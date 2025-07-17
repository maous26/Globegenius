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
const utils_1 = require("./utils");
// Import middleware and services
const middleware_1 = require("./middleware");
const middleware_2 = require("./middleware");
// import { connectDatabase } from './database';
// import { connectRedis, cleanupRedis } from './services';
// import { initializeJobs } from './jobs';
// Import routes
const routes_1 = require("./routes");
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
app.use((0, morgan_1.default)('combined', { stream: { write: message => utils_1.logger.info(message.trim()) } }));
// Rate limiting
app.use('/api/', middleware_2.rateLimiter);
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
app.use('/api/auth', routes_1.authRoutes);
app.use('/api/users', routes_1.userRoutes);
app.use('/api/alerts', routes_1.alertRoutes);
app.use('/api/metrics', routes_1.metricsRoutes);
app.use('/api/admin', routes_1.adminRoutes);
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
app.use(middleware_1.errorHandler);
// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    utils_1.logger.info(`${signal} received. Starting graceful shutdown...`);
    // Stop accepting new connections
    server.close(() => {
        utils_1.logger.info('HTTP server closed');
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
    utils_1.logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', (reason, promise) => {
    utils_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
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
            utils_1.logger.info(`
        🚀 GlobeGenius Backend Server Started
        📍 Environment: ${process.env.NODE_ENV}
        🔗 URL: http://localhost:${PORT}
        📊 API Docs: http://localhost:${PORT}/api-docs
        🎯 Health Check: http://localhost:${PORT}/health
      `);
        });
    }
    catch (error) {
        utils_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
startServer();
//# sourceMappingURL=index.js.map