import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { config } from '../config';
// import { redis } from '../services/redis';  // Temporarily disabled
import { logger } from '../utils/logger';

// Import types to ensure they are loaded
import '../types';

// Note: The user interface is defined in src/types/index.ts

interface JWTPayload {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

/**
 * Middleware d'authentification JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token d\'authentification manquant'
      });
      return;
    }

    const token = authHeader.substring(7); // Enlever "Bearer "

    // Vérifier si le token est dans la blacklist
    // TODO: Re-enable when Redis is configured
    // const isBlacklisted = await redis.get(`blacklist:${token}`);
    // if (isBlacklisted) {
    //   res.status(401).json({
    //     error: 'Unauthorized',
    //     message: 'Token révoqué'
    //   });
    //   return;
    // }

    // Vérifier et décoder le token
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, config.security.jwt.secret) as JWTPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({
          error: 'TokenExpired',
          message: 'Token expiré'
        });
        return;
      }
      
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({
          error: 'InvalidToken',
          message: 'Token invalide'
        });
        return;
      }
      
      throw error;
    }

    // Attacher les informations utilisateur à la requête
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    logger.error('Erreur authentification:', error);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Erreur lors de l\'authentification'
    });
  }
};

/**
 * Middleware pour vérifier le statut premium
 */
export const requirePremium = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentification requise'
    });
    return;
  }

  const premiumStatuses = ['essential', 'premium', 'premium_plus'];
  
  if (!premiumStatuses.includes(req.user.role)) {
    res.status(403).json({
      error: 'PremiumRequired',
      message: 'Cette fonctionnalité nécessite un abonnement premium'
    });
    return;
  }

  next();
};

/**
 * Middleware pour vérifier le statut premium+ uniquement
 */
export const requirePremiumPlus = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentification requise'
    });
    return;
  }

  if (req.user.role !== 'premium_plus') {
    res.status(403).json({
      error: 'PremiumPlusRequired',
      message: 'Cette fonctionnalité nécessite un abonnement Premium+'
    });
    return;
  }

  next();
};

/**
 * Middleware optionnel d'authentification (ne bloque pas si pas de token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token, continuer sans authentification
      next();
      return;
    }

    const token = authHeader.substring(7);

    // Vérifier si le token est dans la blacklist
    // TODO: Re-enable when Redis is configured
    // const isBlacklisted = await redis.get(`blacklist:${token}`);
    // if (isBlacklisted) {
    //   // Token révoqué, continuer sans authentification
    //   next();
    //   return;
    // }

    // Vérifier et décoder le token
    try {
      const decoded = jwt.verify(token, config.security.jwt.secret) as JWTPayload;
      
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role
      };
    } catch (error) {
      // Token invalide, continuer sans authentification
      logger.debug('Token optionnel invalide:', error);
    }

    next();
  } catch (error) {
    logger.error('Erreur auth optionnelle:', error);
    next();
  }
};

/**
 * Middleware pour rafraîchir automatiquement le token si proche de l'expiration
 */
export const autoRefreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    next();
    return;
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.decode(token) as JWTPayload;

    if (!decoded || !decoded.exp) {
      next();
      return;
    }

    // Vérifier si le token expire dans moins de 5 minutes
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresIn < 300) { // 5 minutes
      // Générer un nouveau token
      const newToken = jwt.sign(
        {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role
        },
        config.security.jwt.secret,
        {
          expiresIn: config.security.jwt.expiresIn
        }
      );

      // Ajouter le nouveau token dans le header de réponse
      res.setHeader('X-New-Token', newToken);
      logger.debug(`Token auto-rafraîchi pour l'utilisateur ${req.user.id}`);
    }
  } catch (error) {
    logger.error('Erreur auto-refresh token:', error);
  }

  next();
};