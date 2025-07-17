import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { redisService } from '../services/redis';
import { config } from '../config';
import { logger } from '../utils/logger';

// Store personnalisé utilisant Redis
class RedisStore {
  constructor(private client: typeof redisService) {}

  async increment(key: string): Promise<{ totalHits: number; resetTime: Date }> {
    const result = await this.client.incrementWithLimit(
      `rate_limit:${key}`,
      config.limits.rateLimit.max,
      Math.ceil(config.limits.rateLimit.windowMs / 1000)
    );

    return {
      totalHits: result.count,
      resetTime: new Date(Date.now() + config.limits.rateLimit.windowMs),
    };
  }

  async decrement(key: string): Promise<void> {
    await this.client.setJSON(`rate_limit:${key}`, { count: 0 }, 1);
  }

  async resetKey(key: string): Promise<void> {
    await this.client.setJSON(`rate_limit:${key}`, { count: 0 }, 1);
  }
}

// Configuration de base du rate limiter
export const rateLimiter = rateLimit({
  windowMs: config.limits.rateLimit.windowMs,
  max: config.limits.rateLimit.max,
  message: {
    error: 'TooManyRequests',
    message: 'Trop de requêtes, veuillez réessayer plus tard',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(redisService),
  keyGenerator: (req: Request) => {
    // Utiliser l'ID utilisateur si authentifié, sinon l'IP
    return req.user?.id || req.ip || 'anonymous';
  },
  handler: (req: Request, res: Response) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path,
    });

    res.status(429).json({
      error: 'TooManyRequests',
      message: 'Trop de requêtes, veuillez réessayer plus tard',
      retryAfter: res.getHeader('Retry-After'),
    });
  },
  skip: (req: Request) => {
    // Ne pas limiter certaines routes
    const skipPaths = ['/health', '/metrics'];
    return skipPaths.includes(req.path);
  },
});

// Rate limiter plus strict pour l'authentification
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives
  message: {
    error: 'TooManyAttempts',
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore(redisService),
  keyGenerator: (req: Request) => {
    // Utiliser l'email + IP pour éviter le brute force
    const email = req.body?.email || '';
    return `auth:${email}:${req.ip}`;
  },
  skipSuccessfulRequests: true, // Ne pas compter les connexions réussies
});

// Rate limiter pour les API externes
export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requêtes par minute
  message: {
    error: 'ApiRateLimit',
    message: 'Limite d\'appels API atteinte',
  },
  store: new RedisStore(redisService),
  keyGenerator: (req: Request) => {
    return `api:${req.user?.id || req.ip}`;
  },
});

// Rate limiter personnalisé basé sur le plan d'abonnement
export const planBasedRateLimiter = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return rateLimiter(req, res, next);
  }

  // Limites selon le plan
  const limits: Record<string, number> = {
    free: 100,
    essential: 300,
    premium: 1000,
    premium_plus: 5000,
  };

  const userLimit = limits[req.user.role] || limits.free;
  
  // Créer un rate limiter dynamique
  const dynamicLimiter = rateLimit({
    windowMs: config.limits.rateLimit.windowMs,
    max: userLimit,
    store: new RedisStore(redisService),
    keyGenerator: () => `plan:${req.user!.id}`,
    handler: (req, res) => {
      res.status(429).json({
        error: 'PlanLimitExceeded',
        message: `Limite de votre plan atteinte (${userLimit} requêtes par heure)`,
        upgrade: req.user!.role !== 'premium_plus' ? 'Passez à un plan supérieur pour augmenter vos limites' : undefined,
      });
    },
  });

  dynamicLimiter(req, res, next);
};

// Middleware pour tracker l'usage des API
export const trackApiUsage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const startTime = Date.now();

  // Intercepter la réponse
  const originalSend = res.send;
  res.send = function(data: any) {
    const duration = Date.now() - startTime;
    
    // Logger l'usage
    logger.info('API usage', {
      userId: req.user?.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
    });

    // Enregistrer les métriques (sans await car res.send doit être synchrone)
    redisService.setJSON(`metrics:api:calls:${req.path}`, { count: 1 });
    redisService.setJSON(`metrics:api:duration:${req.path}`, { duration });

    return originalSend.call(this, data);
  };

  next();
};

// Fonction helper pour réinitialiser les limites d'un utilisateur
export const resetUserRateLimit = async (userId: string): Promise<void> => {
  const keys = [
    `rate_limit:${userId}`,
    `rate_limit:plan:${userId}`,
    `rate_limit:api:${userId}`,
  ];

  for (const key of keys) {
    await redisService.setJSON(key, { count: 0 }, 1);
  }

  logger.info(`Rate limits reset for user ${userId}`);
};

// Fonction pour obtenir le statut des limites d'un utilisateur
export const getUserRateLimitStatus = async (userId: string): Promise<{
  general: { used: number; limit: number; resetAt: Date };
  api: { used: number; limit: number; resetAt: Date };
  plan: { used: number; limit: number; resetAt: Date };
}> => {
  const generalKey = `rate_limit:${userId}`;
  const apiKey = `rate_limit:api:${userId}`;
  const planKey = `rate_limit:plan:${userId}`;

  const [generalUsed, apiUsed, planUsed] = await Promise.all([
    redisService.getJSON<{ count: number }>(generalKey),
    redisService.getJSON<{ count: number }>(apiKey),
    redisService.getJSON<{ count: number }>(planKey),
  ]);

  const now = Date.now();
  const windowMs = config.limits.rateLimit.windowMs;

  return {
    general: {
      used: generalUsed?.count || 0,
      limit: config.limits.rateLimit.max,
      resetAt: new Date(now + windowMs),
    },
    api: {
      used: apiUsed?.count || 0,
      limit: 30,
      resetAt: new Date(now + 60000),
    },
    plan: {
      used: planUsed?.count || 0,
      limit: 100, // À ajuster selon le plan
      resetAt: new Date(now + windowMs),
    },
  };
};