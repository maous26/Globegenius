"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var cors_1 = require("cors");
var helmet_1 = require("helmet");
var compression_1 = require("compression");
var morgan_1 = require("morgan");
var dotenv = require("dotenv");
var http_1 = require("http");
// Load environment variables
dotenv.config();
var logger_1 = require("./utils/logger");
var errorHandler_1 = require("./middleware/errorHandler");
var rateLimiter_1 = require("./middleware/rateLimiter");
var connection_1 = require("./database/connection");
var redis_1 = require("./services/redis");
var jobs_1 = require("./jobs");
// Import routes
var auth_1 = require("./routes/auth");
var users_1 = require("./routes/users");
var alerts_1 = require("./routes/alerts");
var metrics_1 = require("./routes/metrics");
var admin_1 = require("./routes/admin");
// Create Express app
var app = (0, express_1.default)();
var server = (0, http_1.createServer)(app);
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
app.use((0, morgan_1.default)('combined', { stream: { write: function (message) { return logger_1.logger.info(message.trim()); } } }));
// Rate limiting
app.use('/api/', rateLimiter_1.rateLimiter);
// Health check endpoint
app.get('/health', function (req, res) {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version,
    });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/users', users_1.default);
app.use('/api/alerts', alerts_1.default);
app.use('/api/metrics', metrics_1.default);
app.use('/api/admin', admin_1.default);
// 404 handler
app.use(function (req, res) {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource does not exist',
    });
});
// Error handling middleware (must be last)
app.use(errorHandler_1.errorHandler);
// Graceful shutdown handler
var gracefulShutdown = function (signal) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.logger.info("".concat(signal, " received. Starting graceful shutdown..."));
                // Stop accepting new connections
                server.close(function () {
                    logger_1.logger.info('HTTP server closed');
                });
                // Close database connections
                return [4 /*yield*/, connection_1.connectDatabase.end()];
            case 1:
                // Close database connections
                _a.sent();
                logger_1.logger.info('Database connections closed');
                // Close Redis connections
                return [4 /*yield*/, redis_1.connectRedis.quit()];
            case 2:
                // Close Redis connections
                _a.sent();
                logger_1.logger.info('Redis connections closed');
                // Exit process
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); };
// Handle shutdown signals
process.on('SIGTERM', function () { return gracefulShutdown('SIGTERM'); });
process.on('SIGINT', function () { return gracefulShutdown('SIGINT'); });
// Handle uncaught errors
process.on('uncaughtException', function (error) {
    logger_1.logger.error('Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
});
process.on('unhandledRejection', function (reason, promise) {
    logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('unhandledRejection');
});
// Start server
var startServer = function () { return __awaiter(void 0, void 0, void 0, function () {
    var PORT_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                // Connect to database
                return [4 /*yield*/, connection_1.connectDatabase.connect()];
            case 1:
                // Connect to database
                _a.sent();
                logger_1.logger.info('✅ Database connected successfully');
                // Connect to Redis
                return [4 /*yield*/, redis_1.connectRedis.connect()];
            case 2:
                // Connect to Redis
                _a.sent();
                logger_1.logger.info('✅ Redis connected successfully');
                if (!(process.env.NODE_ENV !== 'test')) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, jobs_1.initializeJobs)()];
            case 3:
                _a.sent();
                logger_1.logger.info('✅ Background jobs initialized');
                _a.label = 4;
            case 4:
                PORT_1 = process.env.PORT || 3000;
                server.listen(PORT_1, function () {
                    logger_1.logger.info("\n        \uD83D\uDE80 GlobeGenius Backend Server Started\n        \uD83D\uDCCD Environment: ".concat(process.env.NODE_ENV, "\n        \uD83D\uDD17 URL: http://localhost:").concat(PORT_1, "\n        \uD83D\uDCCA API Docs: http://localhost:").concat(PORT_1, "/api-docs\n        \uD83C\uDFAF Health Check: http://localhost:").concat(PORT_1, "/health\n      "));
                });
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                logger_1.logger.error('Failed to start server:', error_1);
                process.exit(1);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
// Start the server
startServer();
