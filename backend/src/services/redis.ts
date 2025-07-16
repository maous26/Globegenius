import Redis from 'ioredis';
import { config } from '../config';
import { logger } from '../utils/logger';

// Créer l'instance Redis principale
export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  disconnectTimeout: 2000,
  commandTimeout: 5000,
  lazyConnect: false,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
});

// Instance pour les souscriptions pub/sub
export const subscriber = redis.duplicate();

// Instance pour les publications pub/sub
export const publisher = redis.duplicate();

// Gestion des événements Redis
redis.on('connect', () => {
  logger.info('✅ Redis connected successfully');
});

redis.on('ready', () => {
  logger.info('✅ Redis ready to accept commands');
});

redis.on('error', (error) => {
  logger.error('❌ Redis error:', error);
});

redis.on('close', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', (delay: number) => {
  logger.info(`Redis reconnecting in ${delay}ms`);
});

// Service Redis avec méthodes utilitaires
export const redisService = {
  /**
   * Get avec parsing JSON automatique
   */
  async getJSON<T = any>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (error) {
      logger.error(`Error parsing JSON for key ${key}:`, error);
      return null;
    }
  },

  /**
   * Set avec stringification JSON automatique
   */
  async setJSON(key: string, value: any, ttl?: number): Promise<void> {
    const stringified = JSON.stringify(value);
    
    if (ttl) {
      await redis.setex(key, ttl, stringified);
    } else {
      await redis.set(key, stringified);
    }
  },

  /**
   * Incrémenter avec limite
   */
  async incrementWithLimit(
    key: string,
    limit: number,
    ttl: number
  ): Promise<{ count: number; allowed: boolean }> {
    const multi = redis.multi();
    
    multi.incr(key);
    multi.expire(key, ttl);
    
    const results = await multi.exec();
    if (!results) {
      throw new Error('Redis transaction failed');
    }
    
    const count = results[0][1] as number;
    
    return {
      count,
      allowed: count <= limit
    };
  },

  /**
   * Cache avec génération automatique
   */
  async cache<T>(
    key: string,
    ttl: number,
    generator: () => Promise<T>
  ): Promise<T> {
    // Essayer de récupérer depuis le cache
    const cached = await this.getJSON(key) as T | null;
    if (cached !== null) {
      return cached;
    }
    
    // Générer la valeur
    const value = await generator();
    
    // Mettre en cache
    await this.setJSON(key, value, ttl);
    
    return value;
  },

  /**
   * Invalidation de cache par pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    let cursor = '0';
    let count = 0;
    
    do {
      const [newCursor, keys] = await redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100
      );
      
      cursor = newCursor;
      
      if (keys.length > 0) {
        await redis.del(...keys);
        count += keys.length;
      }
    } while (cursor !== '0');
    
    logger.info(`Invalidated ${count} cache keys matching pattern: ${pattern}`);
    return count;
  },

  /**
   * Lock distribué simple
   */
  async acquireLock(
    lockKey: string,
    ttl: number = 10
  ): Promise<string | null> {
    const lockId = Math.random().toString(36).substring(7);
    const acquired = await redis.set(
      `lock:${lockKey}`,
      lockId,
      'EX',
      ttl,
      'NX'
    );
    
    return acquired === 'OK' ? lockId : null;
  },

  /**
   * Libérer un lock
   */
  async releaseLock(lockKey: string, lockId: string): Promise<boolean> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await redis.eval(
      script,
      1,
      `lock:${lockKey}`,
      lockId
    ) as number;
    
    return result === 1;
  },

  /**
   * Rate limiting par fenêtre glissante
   */
  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const key = `rate_limit:${identifier}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Nettoyer les anciennes entrées
    await redis.zremrangebyscore(key, '-inf', windowStart);
    
    // Compter les requêtes dans la fenêtre
    const count = await redis.zcard(key);
    
    if (count < limit) {
      // Ajouter la nouvelle requête
      await redis.zadd(key, now, `${now}-${Math.random()}`);
      await redis.expire(key, Math.ceil(windowMs / 1000));
      
      return {
        allowed: true,
        remaining: limit - count - 1,
        resetAt: new Date(now + windowMs)
      };
    }
    
    // Calculer quand la prochaine requête sera possible
    const oldestScore = await redis.zrange(key, 0, 0, 'WITHSCORES');
    const resetAt = oldestScore.length > 1
      ? new Date(parseInt(oldestScore[1]) + windowMs)
      : new Date(now + windowMs);
    
    return {
      allowed: false,
      remaining: 0,
      resetAt
    };
  },

  /**
   * Pub/Sub helpers
   */
  publish: async (channel: string, message: any): Promise<void> => {
    const stringified = typeof message === 'string' 
      ? message 
      : JSON.stringify(message);
    
    await publisher.publish(channel, stringified);
  },

  subscribe: async (
    channel: string,
    handler: (message: any) => void
  ): Promise<void> => {
    await subscriber.subscribe(channel);
    
    subscriber.on('message', (receivedChannel, message) => {
      if (receivedChannel === channel) {
        try {
          const parsed = JSON.parse(message);
          handler(parsed);
        } catch {
          handler(message);
        }
      }
    });
  },

  unsubscribe: async (channel: string): Promise<void> => {
    await subscriber.unsubscribe(channel);
  },

  /**
   * Statistiques et monitoring
   */
  async getInfo(): Promise<Record<string, any>> {
    const info = await redis.info();
    const lines = info.split('\r\n');
    const stats: Record<string, any> = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split(':');
        if (key && value) {
          stats[key] = value;
        }
      }
    });
    
    return stats;
  },

  /**
   * Healthcheck
   */
  async ping(): Promise<boolean> {
    try {
      const response = await redis.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }
};

// Helper pour nettoyer les connexions
export const cleanupRedis = async (): Promise<void> => {
  await redis.quit();
  await subscriber.quit();
  await publisher.quit();
  logger.info('Redis connections closed');
};

// Connect to Redis (already connected on import)
export const connectRedis = async (): Promise<void> => {
  // Redis connection is already established when importing this module
  logger.info('Redis connection established');
};

// Export du client Redis brut pour les cas d'usage avancés
export const redisClient = redis;