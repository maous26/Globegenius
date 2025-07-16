"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.connectRedis = exports.cleanupRedis = exports.redisService = exports.publisher = exports.subscriber = exports.redis = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Créer l'instance Redis principale
exports.redis = new ioredis_1.default(config_1.config.redis.url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
    connectTimeout: 10000,
    disconnectTimeout: 2000,
    commandTimeout: 5000,
    lazyConnect: false,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        logger_1.logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
    },
});
// Instance pour les souscriptions pub/sub
exports.subscriber = exports.redis.duplicate();
// Instance pour les publications pub/sub
exports.publisher = exports.redis.duplicate();
// Gestion des événements Redis
exports.redis.on('connect', () => {
    logger_1.logger.info('✅ Redis connected successfully');
});
exports.redis.on('ready', () => {
    logger_1.logger.info('✅ Redis ready to accept commands');
});
exports.redis.on('error', (error) => {
    logger_1.logger.error('❌ Redis error:', error);
});
exports.redis.on('close', () => {
    logger_1.logger.warn('Redis connection closed');
});
exports.redis.on('reconnecting', (delay) => {
    logger_1.logger.info(`Redis reconnecting in ${delay}ms`);
});
// Service Redis avec méthodes utilitaires
exports.redisService = {
    /**
     * Get avec parsing JSON automatique
     */
    async getJSON(key) {
        const value = await exports.redis.get(key);
        if (!value)
            return null;
        try {
            return JSON.parse(value);
        }
        catch (error) {
            logger_1.logger.error(`Error parsing JSON for key ${key}:`, error);
            return null;
        }
    },
    /**
     * Set avec stringification JSON automatique
     */
    async setJSON(key, value, ttl) {
        const stringified = JSON.stringify(value);
        if (ttl) {
            await exports.redis.setex(key, ttl, stringified);
        }
        else {
            await exports.redis.set(key, stringified);
        }
    },
    /**
     * Incrémenter avec limite
     */
    async incrementWithLimit(key, limit, ttl) {
        const multi = exports.redis.multi();
        multi.incr(key);
        multi.expire(key, ttl);
        const results = await multi.exec();
        if (!results) {
            throw new Error('Redis transaction failed');
        }
        const count = results[0][1];
        return {
            count,
            allowed: count <= limit
        };
    },
    /**
     * Cache avec génération automatique
     */
    async cache(key, ttl, generator) {
        // Essayer de récupérer depuis le cache
        const cached = await this.getJSON(key);
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
    async invalidatePattern(pattern) {
        let cursor = '0';
        let count = 0;
        do {
            const [newCursor, keys] = await exports.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = newCursor;
            if (keys.length > 0) {
                await exports.redis.del(...keys);
                count += keys.length;
            }
        } while (cursor !== '0');
        logger_1.logger.info(`Invalidated ${count} cache keys matching pattern: ${pattern}`);
        return count;
    },
    /**
     * Lock distribué simple
     */
    async acquireLock(lockKey, ttl = 10) {
        const lockId = Math.random().toString(36).substring(7);
        const acquired = await exports.redis.set(`lock:${lockKey}`, lockId, 'EX', ttl, 'NX');
        return acquired === 'OK' ? lockId : null;
    },
    /**
     * Libérer un lock
     */
    async releaseLock(lockKey, lockId) {
        const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
        const result = await exports.redis.eval(script, 1, `lock:${lockKey}`, lockId);
        return result === 1;
    },
    /**
     * Rate limiting par fenêtre glissante
     */
    async checkRateLimit(identifier, limit, windowMs) {
        const key = `rate_limit:${identifier}`;
        const now = Date.now();
        const windowStart = now - windowMs;
        // Nettoyer les anciennes entrées
        await exports.redis.zremrangebyscore(key, '-inf', windowStart);
        // Compter les requêtes dans la fenêtre
        const count = await exports.redis.zcard(key);
        if (count < limit) {
            // Ajouter la nouvelle requête
            await exports.redis.zadd(key, now, `${now}-${Math.random()}`);
            await exports.redis.expire(key, Math.ceil(windowMs / 1000));
            return {
                allowed: true,
                remaining: limit - count - 1,
                resetAt: new Date(now + windowMs)
            };
        }
        // Calculer quand la prochaine requête sera possible
        const oldestScore = await exports.redis.zrange(key, 0, 0, 'WITHSCORES');
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
    publish: async (channel, message) => {
        const stringified = typeof message === 'string'
            ? message
            : JSON.stringify(message);
        await exports.publisher.publish(channel, stringified);
    },
    subscribe: async (channel, handler) => {
        await exports.subscriber.subscribe(channel);
        exports.subscriber.on('message', (receivedChannel, message) => {
            if (receivedChannel === channel) {
                try {
                    const parsed = JSON.parse(message);
                    handler(parsed);
                }
                catch {
                    handler(message);
                }
            }
        });
    },
    unsubscribe: async (channel) => {
        await exports.subscriber.unsubscribe(channel);
    },
    /**
     * Statistiques et monitoring
     */
    async getInfo() {
        const info = await exports.redis.info();
        const lines = info.split('\r\n');
        const stats = {};
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
    async ping() {
        try {
            const response = await exports.redis.ping();
            return response === 'PONG';
        }
        catch {
            return false;
        }
    }
};
// Helper pour nettoyer les connexions
const cleanupRedis = async () => {
    await exports.redis.quit();
    await exports.subscriber.quit();
    await exports.publisher.quit();
    logger_1.logger.info('Redis connections closed');
};
exports.cleanupRedis = cleanupRedis;
// Connect to Redis (already connected on import)
const connectRedis = async () => {
    // Redis connection is already established when importing this module
    logger_1.logger.info('Redis connection established');
};
exports.connectRedis = connectRedis;
// Export du client Redis brut pour les cas d'usage avancés
exports.redisClient = exports.redis;
//# sourceMappingURL=redis.js.map