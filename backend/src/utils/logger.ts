import pino from 'pino';
import { config } from '../config';

// Configuration du logger selon l'environnement
const isDevelopment = config.isDevelopment;
const isTest = config.isTest;

// Options de base
const options: pino.LoggerOptions = {
  level: config.logging.level,
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: config.env,
    pid: process.pid,
  },
  serializers: {
    req: (req: any) => ({
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
    res: (res: any) => ({
      statusCode: res.statusCode,
      headers: res.getHeaders(),
    }),
    err: pino.stdSerializers.err,
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
      time: (timestamp: string) => `🕐 ${timestamp}`,
      level: (level: string) => {
        const labels: Record<string, string> = {
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
export const logger = isTest
  ? pino({ ...options, level: 'silent' }) // Silent en mode test
  : isDevelopment
    ? pino({
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
    : pino(options);

// Helpers pour logging structuré
export const loggers = {
  // Logger pour les requêtes HTTP
  http: logger.child({ module: 'http' }),
  
  // Logger pour la base de données
  db: logger.child({ module: 'database' }),
  
  // Logger pour les jobs
  jobs: logger.child({ module: 'jobs' }),
  
  // Logger pour les services externes
  external: logger.child({ module: 'external' }),
  
  // Logger pour l'authentification
  auth: logger.child({ module: 'auth' }),
  
  // Logger pour les alertes
  alerts: logger.child({ module: 'alerts' }),
  
  // Logger pour le ML
  ml: logger.child({ module: 'ml' }),
};

// Fonction helper pour logger les performances
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  const level = duration > 1000 ? 'warn' : 'info';
  logger[level]({
    type: 'performance',
    operation,
    duration,
    durationMs: `${duration}ms`,
    ...metadata,
  }, `Operation ${operation} took ${duration}ms`);
}

// Fonction helper pour logger les appels API externes
export function logApiCall(
  service: string,
  endpoint: string,
  method: string,
  status: number,
  duration: number,
  error?: any
) {
  const log = loggers.external;
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
  } else if (duration > 2000) {
    log.warn(data, `Slow API call to ${service}`);
  } else {
    log.info(data, `API call to ${service} completed`);
  }
}

// Fonction helper pour logger les événements métier
export function logBusinessEvent(
  event: string,
  userId?: string,
  metadata?: Record<string, any>
) {
  logger.info({
    type: 'business_event',
    event,
    userId,
    ...metadata,
  }, `Business event: ${event}`);
}

// Fonction helper pour logger les métriques
export function logMetric(
  metric: string,
  value: number,
  unit?: string,
  tags?: Record<string, string>
) {
  logger.info({
    type: 'metric',
    metric,
    value,
    unit,
    tags,
  }, `Metric: ${metric} = ${value}${unit ? ` ${unit}` : ''}`);
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal(
    { err: reason, promise },
    'Unhandled promise rejection'
  );
  process.exit(1);
});

// Export du type Logger pour TypeScript
export type Logger = pino.Logger;