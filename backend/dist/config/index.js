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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PRICING_PLANS = exports.ROUTE_CONFIGURATIONS = exports.config = void 0;
const dotenv = __importStar(require("dotenv"));
const Joi = __importStar(require("joi"));
// Load environment variables
dotenv.config();
// Define validation schema
const envSchema = Joi.object({
    // Environment
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(3000),
    // Database
    DATABASE_URL: Joi.string().required(),
    // Redis
    REDIS_URL: Joi.string().required(),
    // API Keys
    FLIGHTLABS_API_KEY: Joi.string().required(),
    TRAVELPAYOUT_TOKEN: Joi.string().required(),
    SENDGRID_API_KEY: Joi.string().required(),
    // Security
    JWT_SECRET: Joi.string().min(32).required(),
    JWT_REFRESH_SECRET: Joi.string().min(32).required(),
    ENCRYPTION_KEY: Joi.string().length(32).required(),
    JWT_EXPIRES_IN: Joi.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
    // ML Service
    ML_SERVICE_URL: Joi.string().default('http://localhost:8000'),
    ML_CONFIDENCE_THRESHOLD: Joi.number().min(0).max(1).default(0.75),
    ML_ANOMALY_CONTAMINATION: Joi.number().min(0).max(1).default(0.05),
    // API Limits
    MONTHLY_API_CALLS_LIMIT: Joi.number().default(10000),
    DAILY_API_CALLS_WARNING: Joi.number().default(300),
    RATE_LIMIT_WINDOW: Joi.number().default(60000),
    RATE_LIMIT_MAX: Joi.number().default(100),
    // Email Configuration
    EMAIL_FROM: Joi.string().email().default('alerts@globegenius.com'),
    EMAIL_FROM_NAME: Joi.string().default('GlobeGenius'),
    // Route Scanning
    TIER1_SCAN_FREQUENCY: Joi.number().default(240),
    TIER2_SCAN_FREQUENCY: Joi.number().default(360),
    TIER3_SCAN_FREQUENCY: Joi.number().default(720),
    SCAN_BUFFER_PERCENTAGE: Joi.number().min(0).max(1).default(0.25),
    // Business Rules
    MIN_DISCOUNT_PERCENTAGE: Joi.number().default(30),
    MAX_PRICE_AGE_HOURS: Joi.number().default(24),
    ALERT_EXPIRY_HOURS: Joi.number().default(48),
    MAX_ALERTS_PER_USER_PER_DAY: Joi.number().default(20),
    // URLs
    FRONTEND_URL: Joi.string().default('http://localhost:3001'),
    API_URL: Joi.string().default('http://localhost:3000'),
    // Cache TTL
    CACHE_TTL_PRICES: Joi.number().default(14400),
    CACHE_TTL_ROUTES: Joi.number().default(86400),
    CACHE_TTL_USER_PROFILE: Joi.number().default(3600),
    // Feature Flags
    FEATURE_ERROR_DETECTION: Joi.boolean().default(true),
    FEATURE_PACKAGE_DEALS: Joi.boolean().default(false),
    FEATURE_SMS_ALERTS: Joi.boolean().default(false),
    FEATURE_MOBILE_APP: Joi.boolean().default(false),
    // Monitoring
    LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error').default('info'),
}).unknown();
// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
// Export configuration object
exports.config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    isDevelopment: envVars.NODE_ENV === 'development',
    isProduction: envVars.NODE_ENV === 'production',
    isTest: envVars.NODE_ENV === 'test',
    database: {
        url: envVars.DATABASE_URL,
        ssl: envVars.NODE_ENV === 'production',
    },
    redis: {
        url: envVars.REDIS_URL,
    },
    apis: {
        flightLabs: {
            key: envVars.FLIGHTLABS_API_KEY,
            baseUrl: 'https://app.goflightlabs.com',
            endpoints: {
                search: '/advanced-future-flight-search',
                routes: '/routes',
                airports: '/airports',
            },
        },
        travelPayout: {
            token: envVars.TRAVELPAYOUT_TOKEN,
            baseUrl: 'https://api.travelpayouts.com',
            marker: '436920', // Your TravelPayout marker
        },
        sendGrid: {
            key: envVars.SENDGRID_API_KEY,
            from: envVars.EMAIL_FROM,
            fromName: envVars.EMAIL_FROM_NAME,
            templates: {
                welcome: 'd-1234567890abcdef',
                alert: 'd-2345678901abcdef',
                digest: 'd-3456789012abcdef',
            },
        },
    },
    security: {
        jwt: {
            secret: envVars.JWT_SECRET,
            refreshSecret: envVars.JWT_REFRESH_SECRET,
            expiresIn: envVars.JWT_EXPIRES_IN,
            refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
        },
        encryption: {
            key: envVars.ENCRYPTION_KEY,
        },
        bcrypt: {
            rounds: 10,
        },
    },
    ml: {
        serviceUrl: envVars.ML_SERVICE_URL,
        confidenceThreshold: envVars.ML_CONFIDENCE_THRESHOLD,
        anomalyContamination: envVars.ML_ANOMALY_CONTAMINATION,
    },
    limits: {
        api: {
            monthlyLimit: envVars.MONTHLY_API_CALLS_LIMIT,
            dailyWarning: envVars.DAILY_API_CALLS_WARNING,
            bufferPercentage: envVars.SCAN_BUFFER_PERCENTAGE,
        },
        rateLimit: {
            windowMs: envVars.RATE_LIMIT_WINDOW,
            max: envVars.RATE_LIMIT_MAX,
        },
        alerts: {
            maxPerUserPerDay: envVars.MAX_ALERTS_PER_USER_PER_DAY,
        },
    },
    scanning: {
        frequencies: {
            tier1: envVars.TIER1_SCAN_FREQUENCY,
            tier2: envVars.TIER2_SCAN_FREQUENCY,
            tier3: envVars.TIER3_SCAN_FREQUENCY,
        },
    },
    business: {
        minDiscountPercentage: envVars.MIN_DISCOUNT_PERCENTAGE,
        maxPriceAgeHours: envVars.MAX_PRICE_AGE_HOURS,
        alertExpiryHours: envVars.ALERT_EXPIRY_HOURS,
    },
    urls: {
        frontend: envVars.FRONTEND_URL,
        api: envVars.API_URL,
    },
    cache: {
        ttl: {
            prices: envVars.CACHE_TTL_PRICES,
            routes: envVars.CACHE_TTL_ROUTES,
            userProfile: envVars.CACHE_TTL_USER_PROFILE,
        },
    },
    features: {
        errorDetection: envVars.FEATURE_ERROR_DETECTION,
        packageDeals: envVars.FEATURE_PACKAGE_DEALS,
        smsAlerts: envVars.FEATURE_SMS_ALERTS,
        mobileApp: envVars.FEATURE_MOBILE_APP,
    },
    logging: {
        level: envVars.LOG_LEVEL,
    },
};
// Route configurations
exports.ROUTE_CONFIGURATIONS = {
    tier1: {
        routes: [
            // Paris CDG - Capitales européennes
            { origin: 'CDG', destination: 'MAD', avgVolume: 2500000 },
            { origin: 'CDG', destination: 'BCN', avgVolume: 2000000 },
            { origin: 'CDG', destination: 'LHR', avgVolume: 1700000 },
            { origin: 'CDG', destination: 'FCO', avgVolume: 1800000 },
            { origin: 'CDG', destination: 'AMS', avgVolume: 1500000 },
            { origin: 'CDG', destination: 'FRA', avgVolume: 1300000 },
            { origin: 'CDG', destination: 'LIS', avgVolume: 1200000 },
            { origin: 'CDG', destination: 'BRU', avgVolume: 1100000 },
            { origin: 'CDG', destination: 'ZRH', avgVolume: 1000000 },
            { origin: 'CDG', destination: 'VIE', avgVolume: 900000 },
            // Paris CDG - Long courrier
            { origin: 'CDG', destination: 'JFK', avgVolume: 1600000 },
            { origin: 'CDG', destination: 'DXB', avgVolume: 1200000 },
            // Routes domestiques
            { origin: 'CDG', destination: 'NCE', avgVolume: 3200000 },
            { origin: 'CDG', destination: 'TLS', avgVolume: 3200000 },
            { origin: 'CDG', destination: 'MRS', avgVolume: 2000000 },
            { origin: 'CDG', destination: 'BOD', avgVolume: 1800000 },
            { origin: 'CDG', destination: 'LYS', avgVolume: 1600000 },
            { origin: 'CDG', destination: 'NTE', avgVolume: 1400000 },
            { origin: 'ORY', destination: 'NCE', avgVolume: 1500000 },
            { origin: 'ORY', destination: 'TLS', avgVolume: 1400000 },
        ],
        scanFrequency: exports.config.scanning.frequencies.tier1,
    },
    tier2: {
        routes: [
            // Lyon
            { origin: 'LYS', destination: 'MAD', avgVolume: 400000 },
            { origin: 'LYS', destination: 'BCN', avgVolume: 350000 },
            { origin: 'LYS', destination: 'LHR', avgVolume: 300000 },
            { origin: 'LYS', destination: 'FCO', avgVolume: 280000 },
            { origin: 'LYS', destination: 'AMS', avgVolume: 250000 },
            // Nice
            { origin: 'NCE', destination: 'CDG', avgVolume: 1000000 },
            { origin: 'NCE', destination: 'LHR', avgVolume: 400000 },
            { origin: 'NCE', destination: 'FCO', avgVolume: 350000 },
            { origin: 'NCE', destination: 'MAD', avgVolume: 300000 },
            { origin: 'NCE', destination: 'BCN', avgVolume: 280000 },
            // Marseille
            { origin: 'MRS', destination: 'MAD', avgVolume: 300000 },
            { origin: 'MRS', destination: 'FCO', avgVolume: 280000 },
            { origin: 'MRS', destination: 'LHR', avgVolume: 250000 },
            { origin: 'MRS', destination: 'BCN', avgVolume: 240000 },
            { origin: 'MRS', destination: 'AMS', avgVolume: 200000 },
            // Long-courrier secondaires
            { origin: 'CDG', destination: 'LAX', avgVolume: 800000 },
            { origin: 'CDG', destination: 'NRT', avgVolume: 600000 },
            { origin: 'CDG', destination: 'CMN', avgVolume: 900000 },
            { origin: 'CDG', destination: 'YUL', avgVolume: 700000 },
            { origin: 'CDG', destination: 'SIN', avgVolume: 500000 },
            // Autres capitales européennes
            { origin: 'CDG', destination: 'PRG', avgVolume: 600000 },
            { origin: 'CDG', destination: 'BUD', avgVolume: 550000 },
            { origin: 'CDG', destination: 'WAW', avgVolume: 500000 },
            { origin: 'CDG', destination: 'CPH', avgVolume: 480000 },
            { origin: 'CDG', destination: 'STO', avgVolume: 450000 },
        ],
        scanFrequency: exports.config.scanning.frequencies.tier2,
    },
    tier3: {
        routes: [
            // Destinations saisonnières été
            { origin: 'CDG', destination: 'PMI', avgVolume: 800000, seasonal: 'summer' },
            { origin: 'CDG', destination: 'IBZ', avgVolume: 400000, seasonal: 'summer' },
            { origin: 'CDG', destination: 'HER', avgVolume: 350000, seasonal: 'summer' },
            { origin: 'CDG', destination: 'RHO', avgVolume: 300000, seasonal: 'summer' },
            { origin: 'CDG', destination: 'DBV', avgVolume: 280000, seasonal: 'summer' },
            { origin: 'CDG', destination: 'SPU', avgVolume: 250000, seasonal: 'summer' },
            // Nouvelles destinations 2025
            { origin: 'CDG', destination: 'MCO', avgVolume: 400000 }, // Orlando
            { origin: 'CDG', destination: 'RUH', avgVolume: 300000 }, // Riyad
            // Destinations émergentes
            { origin: 'CDG', destination: 'TIA', avgVolume: 200000 }, // Tirana
            { origin: 'CDG', destination: 'SOF', avgVolume: 180000 }, // Sofia
            { origin: 'CDG', destination: 'OTP', avgVolume: 170000 }, // Bucarest
            // Aéroports secondaires français
            { origin: 'BOD', destination: 'LHR', avgVolume: 150000 },
            { origin: 'TLS', destination: 'MAD', avgVolume: 140000 },
            { origin: 'NTE', destination: 'BCN', avgVolume: 130000 },
            { origin: 'SXB', destination: 'AMS', avgVolume: 100000 },
        ],
        scanFrequency: exports.config.scanning.frequencies.tier3,
    },
};
// Pricing plans
exports.PRICING_PLANS = {
    free: {
        name: 'Gratuit',
        price: 0,
        features: {
            alertsPerWeek: 3,
            departureAirports: 1,
            destinations: 'Europe',
            errorDetection: false,
            priority: 'normal',
            support: 'email',
        },
    },
    essential: {
        name: 'Essential',
        price: 4.99,
        features: {
            alertsPerWeek: 'unlimited',
            departureAirports: 5,
            destinations: 'Europe',
            errorDetection: true,
            priority: 'high',
            support: 'email',
        },
    },
    premium: {
        name: 'Premium',
        price: 9.99,
        features: {
            alertsPerWeek: 'unlimited',
            departureAirports: 'unlimited',
            destinations: 'Monde',
            errorDetection: true,
            packageDeals: true,
            priority: 'very_high',
            support: 'priority',
        },
    },
    premium_plus: {
        name: 'Premium+',
        price: 14.99,
        features: {
            alertsPerWeek: 'unlimited',
            departureAirports: 'unlimited',
            destinations: 'Monde',
            errorDetection: true,
            packageDeals: true,
            smsAlerts: true,
            priority: 'immediate',
            support: '24/7',
            personalAgent: true,
        },
    },
};
//# sourceMappingURL=index.js.map