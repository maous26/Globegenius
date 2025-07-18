import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import * as dotenv from 'dotenv';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

// Import configurations and utilities
import { config } from './config';
import { logger } from './utils';

// Import middleware and services
import { errorHandler } from './middleware';
import { rateLimiter } from './middleware';
import { connectDatabase } from './database/connection';
// import { connectRedis, cleanupRedis } from './services';
// import { initializeJobs } from './jobs';

// Import routes
import { authRoutes, userRoutes, alertRoutes, metricsRoutes, adminRoutes } from './routes';

// Create Express app
const app = express();
const server = createServer(app);

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3006',
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3004',
    'http://localhost:3005'
  ],
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'GlobeGenius API',
    version: '1.0.0',
    description: 'Service d\'alertes voyage intelligent avec IA',
    endpoints: {
      health: '/health',
      auth: '/api/auth/*',
      users: '/api/users/*',
      alerts: '/api/alerts/*',
      metrics: '/api/metrics/*',
      admin: '/api/admin/*'
    },
    documentation: '/api-docs'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource does not exist',
  });
});

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Stop accepting new connections
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // TODO: Re-enable when modules are fixed
  // Close database connections
  await connectDatabase.end();
  logger.info('Database connections closed');

  // Close Redis connections
  // await cleanupRedis();
  // logger.info('Redis connections closed');

  // Exit process
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase.connect();
    logger.info('✅ Database connected successfully');

    // Connect to Redis
    // await connectRedis();
    // logger.info('✅ Redis connected successfully');

    // Initialize background jobs
    // if (process.env.NODE_ENV !== 'test') {
    //   await initializeJobs();
    //   logger.info('✅ Background jobs initialized');
    // }

    // Start listening
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`
        🚀 GlobeGenius Backend Server Started
        📍 Environment: ${process.env.NODE_ENV}
        🔗 URL: http://localhost:${PORT}
        📊 API Docs: http://localhost:${PORT}/api-docs
        🎯 Health Check: http://localhost:${PORT}/health
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();