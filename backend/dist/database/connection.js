"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = exports.getDb = exports.connectDatabase = void 0;
const pg_1 = require("pg");
const config_1 = require("../config");
const logger_1 = require("../utils/logger");
// Configuration du pool de connexions
const poolConfig = {
    host: 'localhost',
    port: 5432,
    database: 'globegenius_dev',
    user: 'globegenius',
    password: 'dev_password_change_in_prod',
    ssl: config_1.config.database.ssl ? { rejectUnauthorized: false } : false,
    max: 20, // Nombre maximum de connexions
    idleTimeoutMillis: 30000, // 30 secondes
    connectionTimeoutMillis: 10000, // 10 secondes
    allowExitOnIdle: false,
};
// Créer le pool
const pool = new pg_1.Pool(poolConfig);
exports.pool = pool;
// Gestion des événements du pool
pool.on('connect', (client) => {
    logger_1.logger.debug('New database connection established');
    // Définir le timezone pour cette connexion
    client.query('SET timezone = "UTC"');
});
pool.on('error', (err, client) => {
    logger_1.logger.error('Unexpected database error on idle client:', err);
    process.exit(-1);
});
pool.on('remove', () => {
    logger_1.logger.debug('Database connection removed from pool');
});
// Classe de gestion de la base de données
class Database {
    pool;
    isConnected = false;
    constructor() {
        this.pool = pool;
    }
    /**
     * Connecter à la base de données
     */
    async connect() {
        try {
            // Test de connexion
            const client = await this.pool.connect();
            await client.query('SELECT NOW()');
            client.release();
            this.isConnected = true;
            logger_1.logger.info('✅ Database connection established');
            // Initialiser les fonctions personnalisées
            await this.initializeCustomFunctions();
        }
        catch (error) {
            logger_1.logger.error('❌ Database connection failed:', error);
            throw error;
        }
    }
    /**
     * Fermer toutes les connexions
     */
    async end() {
        await this.pool.end();
        this.isConnected = false;
        logger_1.logger.info('Database connections closed');
    }
    /**
     * Obtenir le pool (pour les services)
     */
    getPool() {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }
        return this.pool;
    }
    /**
     * Exécuter une requête simple
     */
    async query(text, params) {
        const start = Date.now();
        try {
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;
            // Log les requêtes lentes
            if (duration > 100) {
                logger_1.logger.warn({
                    query: text,
                    duration,
                    rows: result.rowCount,
                }, 'Slow database query');
            }
            return result;
        }
        catch (error) {
            logger_1.logger.error({
                query: text,
                params,
                error,
            }, 'Database query error');
            throw error;
        }
    }
    /**
     * Obtenir un client pour les transactions
     */
    async getClient() {
        return this.pool.connect();
    }
    /**
     * Exécuter une transaction
     */
    async transaction(callback) {
        const client = await this.getClient();
        try {
            await client.query('BEGIN');
            const tx = {
                query: (text, params) => client.query(text, params),
                commit: async () => { await client.query('COMMIT'); },
                rollback: async () => { await client.query('ROLLBACK'); },
                release: () => client.release(),
            };
            const result = await callback(tx);
            await tx.commit();
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    /**
     * Requête avec retry automatique
     */
    async queryWithRetry(text, params, maxRetries = 3) {
        let lastError;
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await this.query(text, params);
            }
            catch (error) {
                lastError = error;
                // Ne pas retry certaines erreurs
                if (error.code === '23505' || // Violation de contrainte unique
                    error.code === '23503' || // Violation de clé étrangère
                    error.code === '23502' // Violation NOT NULL
                ) {
                    throw error;
                }
                // Attendre avant de réessayer
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
                }
            }
        }
        throw lastError;
    }
    /**
     * Initialiser les fonctions SQL personnalisées
     */
    async initializeCustomFunctions() {
        try {
            // Fonction pour calculer la distance entre deux aéroports
            await this.query(`
        CREATE OR REPLACE FUNCTION calculate_distance(
          lat1 FLOAT, lon1 FLOAT,
          lat2 FLOAT, lon2 FLOAT
        ) RETURNS FLOAT AS $$
        DECLARE
          R FLOAT := 6371; -- Rayon de la Terre en km
          dLat FLOAT;
          dLon FLOAT;
          a FLOAT;
          c FLOAT;
        BEGIN
          dLat := RADIANS(lat2 - lat1);
          dLon := RADIANS(lon2 - lon1);
          a := SIN(dLat/2) * SIN(dLat/2) +
               COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
               SIN(dLon/2) * SIN(dLon/2);
          c := 2 * ATAN2(SQRT(a), SQRT(1-a));
          RETURN R * c;
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
      `);
            // Fonction pour formater les montants
            await this.query(`
        CREATE OR REPLACE FUNCTION format_currency(
          amount DECIMAL,
          currency VARCHAR DEFAULT 'EUR'
        ) RETURNS VARCHAR AS $$
        BEGIN
          RETURN CONCAT(TO_CHAR(amount, 'FM999,999.00'), ' ', currency);
        END;
        $$ LANGUAGE plpgsql IMMUTABLE;
      `);
            logger_1.logger.debug('Custom database functions initialized');
        }
        catch (error) {
            logger_1.logger.warn('Error initializing custom functions:', error);
        }
    }
    /**
     * Healthcheck de la base de données
     */
    async healthcheck() {
        try {
            const result = await this.query('SELECT 1');
            return result.rowCount === 1;
        }
        catch (error) {
            logger_1.logger.error('Database healthcheck failed:', error);
            return false;
        }
    }
    /**
     * Obtenir les statistiques de connexion
     */
    async getConnectionStats() {
        const stats = await this.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE state = 'active') as active,
        COUNT(*) FILTER (WHERE state = 'idle') as idle,
        COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
        MAX(EXTRACT(EPOCH FROM (NOW() - state_change))) as max_idle_seconds
      FROM pg_stat_activity
      WHERE datname = current_database()
    `);
        return {
            ...stats.rows[0],
            pool: {
                total: this.pool.totalCount,
                idle: this.pool.idleCount,
                waiting: this.pool.waitingCount,
            },
        };
    }
}
// Exporter une instance unique
exports.connectDatabase = new Database();
// Helper pour obtenir le pool directement
const getDb = () => exports.connectDatabase.getPool();
exports.getDb = getDb;
//# sourceMappingURL=connection.js.map