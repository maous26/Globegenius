"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv = __importStar(require("dotenv"));
const http_1 = require("http");
// Load environment variables
dotenv.config();
const logger_1 = require("./utils/logger");
// TODO: Re-enable these imports once module resolution is fixed
// import { errorHandler } from './middleware/errorHandler';
// import { rateLimiter } from './middleware/rateLimiter.simple';
// import { connectDatabase } from './database/connection';
// import { connectRedis, cleanupRedis } from './services/redis';
// import { initializeJobs } from './jobs';
// Import routes (commented out until module resolution is fixed)
// import authRoutes from './routes/auth';
// import userRoutes from './routes/users';
// import alertRoutes from './routes/alerts';
// import metricsRoutes from './routes/metrics';
// import adminRoutes from './routes/admin';
// Create Express app
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
app.use((0, morgan_1.default)('combined', { stream: { write: message => logger_1.logger.info(message.trim()) } }));
// Rate limiting (commented out until module resolution is fixed)
// app.use('/api/', rateLimiter);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
    });
});
// API Routes (commented out until module resolution is fixed)
// app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/alerts', alertRoutes);
// app.use('/api/metrics', metricsRoutes);
// app.use('/api/admin', adminRoutes);
// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist',
    });
});
// Error handling middleware (commented out until module resolution is fixed)
// app.use(errorHandler);
// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`${signal} received. Starting graceful shutdown...`);
    // Stop accepting new connections
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
    // TODO: Re-enable when modules are fixed
    // Close database connections
    // await connectDatabase.end();
    // logger.info('Database connections closed');
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
    logger_1.logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
// Start server
const startServer = async () => {
    try {
        // TODO: Re-enable when modules are fixed
        // Connect to database
        // await connectDatabase.connect();
        // logger.info('✅ Database connected successfully');
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
            logger_1.logger.info(`
        🚀 GlobeGenius Backend Server Started
        📍 Environment: ${process.env.NODE_ENV}
        🔗 URL: http://localhost:${PORT}
        📊 API Docs: http://localhost:${PORT}/api-docs
        🎯 Health Check: http://localhost:${PORT}/health
      `);
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
//# sourceMappingURL=index.js.map