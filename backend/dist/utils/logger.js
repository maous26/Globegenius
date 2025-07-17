"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggers = exports.logger = void 0;
exports.logPerformance = logPerformance;
exports.logApiCall = logApiCall;
exports.logBusinessEvent = logBusinessEvent;
exports.logMetric = logMetric;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("../config");
// Configuration du logger selon l'environnement
const isDevelopment = config_1.config.isDevelopment;
const isTest = config_1.config.isTest;
// Options de base
const options = {
    level: config_1.config.logging.level,
    timestamp: pino_1.default.stdTimeFunctions.isoTime,
    base: {
        env: config_1.config.env,
        pid: process.pid,
    },
    serializers: {
        req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            query: req.query,
            params: req.params,
            headers: {
                ...req.headers,
                authorization: req.headers.authorization ? '[REDACTED]' : undefined,
            },
            remoteAddress: req.socket?.remoteAddress,
            remotePort: req.socket?.remotePort,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
            headers: res.getHeaders(),
        }),
        err: pino_1.default.stdSerializers.err,
    },
};
// Transport pour le développement (pretty print)
const devTransport = {
    target: 'pino-pretty',
    options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
        messageFormat: '{msg}',
        customPrettifiers: {
            time: (timestamp) => `🕐 ${timestamp}`,
            level: (level) => {
                const labels = {
                    10: '🔍 TRACE',
                    20: '🐛 DEBUG',
                    30: 'ℹ️  INFO',
                    40: '⚠️  WARN',
                    50: '❌ ERROR',
                    60: '💀 FATAL',
                };
                return labels[level] || level;
            },
        },
    },
};
// Transport pour la production (JSON structuré)
const prodTransport = {
    target: 'pino/file',
    options: {
        destination: 1, // stdout
        mkdir: true,
    },
};
// Créer le logger
exports.logger = isTest
    ? (0, pino_1.default)({ ...options, level: 'silent' }) // Silent en mode test
    : isDevelopment
        ? (0, pino_1.default)({
            ...options,
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            },
        })
        : (0, pino_1.default)(options);
// Helpers pour logging structuré
exports.loggers = {
    // Logger pour les requêtes HTTP
    http: exports.logger.child({ module: 'http' }),
    // Logger pour la base de données
    db: exports.logger.child({ module: 'database' }),
    // Logger pour les jobs
    jobs: exports.logger.child({ module: 'jobs' }),
    // Logger pour les services externes
    external: exports.logger.child({ module: 'external' }),
    // Logger pour l'authentification
    auth: exports.logger.child({ module: 'auth' }),
    // Logger pour les alertes
    alerts: exports.logger.child({ module: 'alerts' }),
    // Logger pour le ML
    ml: exports.logger.child({ module: 'ml' }),
};
// Fonction helper pour logger les performances
function logPerformance(operation, duration, metadata) {
    const level = duration > 1000 ? 'warn' : 'info';
    exports.logger[level]({
        type: 'performance',
        operation,
        duration,
        durationMs: `${duration}ms`,
        ...metadata,
    }, `Operation ${operation} took ${duration}ms`);
}
// Fonction helper pour logger les appels API externes
function logApiCall(service, endpoint, method, status, duration, error) {
    const log = exports.loggers.external;
    const data = {
        service,
        endpoint,
        method,
        status,
        duration,
        durationMs: `${duration}ms`,
        success: status >= 200 && status < 300,
    };
    if (error) {
        log.error({ ...data, error }, `API call to ${service} failed`);
    }
    else if (duration > 2000) {
        log.warn(data, `Slow API call to ${service}`);
    }
    else {
        log.info(data, `API call to ${service} completed`);
    }
}
// Fonction helper pour logger les événements métier
function logBusinessEvent(event, userId, metadata) {
    exports.logger.info({
        type: 'business_event',
        event,
        userId,
        ...metadata,
    }, `Business event: ${event}`);
}
// Fonction helper pour logger les métriques
function logMetric(metric, value, unit, tags) {
    exports.logger.info({
        type: 'metric',
        metric,
        value,
        unit,
        tags,
    }, `Metric: ${metric} = ${value}${unit ? ` ${unit}` : ''}`);
}
// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
    exports.logger.fatal({ err: error }, 'Uncaught exception');
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    exports.logger.fatal({ err: reason, promise }, 'Unhandled promise rejection');
    process.exit(1);
});
//# sourceMappingURL=logger.js.map