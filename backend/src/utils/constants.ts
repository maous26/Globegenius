/**
 * Backend constants and configuration values
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  // Authentication errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  ACCOUNT_LOCKED: 'Account has been locked. Please contact support.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address before logging in',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_TOKEN: 'Invalid or malformed token',
  UNAUTHORIZED: 'You are not authorized to access this resource',
  FORBIDDEN: 'You do not have permission to perform this action',
  
  // User errors
  USER_NOT_FOUND: 'User not found',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_INACTIVE: 'User account is inactive',
  
  // Validation errors
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input provided',
  REQUIRED_FIELD_MISSING: 'Required field is missing',
  INVALID_FORMAT: 'Invalid format',
  INVALID_DATE_RANGE: 'Invalid date range',
  INVALID_PRICE: 'Invalid price value',
  INVALID_AIRPORT_CODE: 'Invalid airport code',
  
  // Alert errors
  ALERT_NOT_FOUND: 'Alert not found',
  ALERT_LIMIT_EXCEEDED: 'Maximum number of alerts reached',
  ALERT_ALREADY_EXISTS: 'Alert with same criteria already exists',
  
  // Route errors
  ROUTE_NOT_FOUND: 'Route not found',
  ROUTE_INACTIVE: 'Route is currently inactive',
  ROUTE_NOT_AVAILABLE: 'Route is not available for the selected date',
  
  // System errors
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_API_ERROR: 'External API error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
  
  // File upload errors
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FILE_TYPE: 'Invalid file type',
  UPLOAD_FAILED: 'File upload failed',
  
  // Email errors
  EMAIL_SEND_FAILED: 'Failed to send email',
  INVALID_EMAIL_TEMPLATE: 'Invalid email template',
  
  // Payment errors
  PAYMENT_FAILED: 'Payment processing failed',
  PAYMENT_REQUIRED: 'Payment required to access this feature',
  SUBSCRIPTION_EXPIRED: 'Subscription has expired',
  
  // Cache errors
  CACHE_ERROR: 'Cache operation failed',
  CACHE_MISS: 'Requested data not found in cache',
  
  // Queue errors
  QUEUE_ERROR: 'Queue operation failed',
  JOB_FAILED: 'Background job failed',
  
  // ML errors
  ML_SERVICE_ERROR: 'Machine learning service error',
  ANOMALY_DETECTION_FAILED: 'Anomaly detection failed',
  PREDICTION_FAILED: 'Price prediction failed',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User account created successfully',
  USER_UPDATED: 'User profile updated successfully',
  USER_DELETED: 'User account deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
  EMAIL_VERIFIED: 'Email verified successfully',
  RESET_PASSWORD_EMAIL_SENT: 'Password reset email sent',
  
  ALERT_CREATED: 'Alert created successfully',
  ALERT_UPDATED: 'Alert updated successfully',
  ALERT_DELETED: 'Alert deleted successfully',
  ALERT_ACTIVATED: 'Alert activated successfully',
  ALERT_DEACTIVATED: 'Alert deactivated successfully',
  
  PREFERENCES_UPDATED: 'Preferences updated successfully',
  SETTINGS_UPDATED: 'Settings updated successfully',
  
  DATA_SYNCHRONIZED: 'Data synchronized successfully',
  CACHE_CLEARED: 'Cache cleared successfully',
  
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',
  
  EMAIL_SENT: 'Email sent successfully',
  NOTIFICATION_SENT: 'Notification sent successfully',
  
  PAYMENT_PROCESSED: 'Payment processed successfully',
  SUBSCRIPTION_UPDATED: 'Subscription updated successfully',
  
  ROUTE_OPTIMIZED: 'Route optimization completed',
  SCAN_COMPLETED: 'Price scan completed successfully',
  
  BACKUP_CREATED: 'Backup created successfully',
  BACKUP_RESTORED: 'Backup restored successfully',
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
  },
  
  EMAIL: {
    MAX_LENGTH: 254,
  },
  
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  
  PRICE: {
    MIN_VALUE: 0.01,
    MAX_VALUE: 999999.99,
    DECIMAL_PLACES: 2,
  },
  
  AIRPORT_CODE: {
    LENGTH: 3,
    PATTERN: /^[A-Z]{3}$/,
  },
  
  DATE: {
    MIN_BOOKING_DAYS: 1,
    MAX_BOOKING_DAYS: 365,
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  
  ALERTS: {
    MAX_PER_USER: 50,
    MAX_PER_DAY: 10,
  },
  
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
} as const;

// Cache Keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_PREFERENCES: (userId: string) => `user:preferences:${userId}`,
  USER_ALERTS: (userId: string) => `user:alerts:${userId}`,
  PRICE_DATA: (origin: string, destination: string, date: string) => `price:${origin}:${destination}:${date}`,
  ROUTE_DATA: (routeId: string) => `route:${routeId}`,
  AIRPORT_DATA: (code: string) => `airport:${code}`,
  EXCHANGE_RATES: 'exchange:rates',
  SYSTEM_CONFIG: 'system:config',
  API_USAGE: (provider: string, date: string) => `api:usage:${provider}:${date}`,
  ANOMALY_DETECTION: (routeId: string) => `anomaly:${routeId}`,
  STATISTICS: (type: string, date: string) => `stats:${type}:${date}`,
} as const;

// Cache TTL (Time To Live) in seconds
export const CACHE_TTL = {
  USER_PROFILE: 3600, // 1 hour
  USER_PREFERENCES: 7200, // 2 hours
  USER_ALERTS: 1800, // 30 minutes
  PRICE_DATA: 3600, // 1 hour
  ROUTE_DATA: 86400, // 24 hours
  AIRPORT_DATA: 604800, // 7 days
  EXCHANGE_RATES: 3600, // 1 hour
  SYSTEM_CONFIG: 86400, // 24 hours
  API_USAGE: 3600, // 1 hour
  ANOMALY_DETECTION: 1800, // 30 minutes
  STATISTICS: 3600, // 1 hour
} as const;

// Queue Names
export const QUEUE_NAMES = {
  PRICE_SCAN: 'price-scan',
  ALERT_PROCESSING: 'alert-processing',
  EMAIL_SENDING: 'email-sending',
  NOTIFICATION_SENDING: 'notification-sending',
  ROUTE_OPTIMIZATION: 'route-optimization',
  DATA_CLEANUP: 'data-cleanup',
  BACKUP_CREATION: 'backup-creation',
  ANALYTICS_PROCESSING: 'analytics-processing',
  ML_PROCESSING: 'ml-processing',
} as const;

// Job Types
export const JOB_TYPES = {
  SCAN_ROUTE: 'scan-route',
  SEND_ANOMALY_ALERTS: 'send-anomaly-alerts',
  OPTIMIZE_ROUTES: 'optimize-routes',
  CLEANUP_OLD_DATA: 'cleanup-old-data',
  SEND_EMAIL: 'send-email',
  SEND_NOTIFICATION: 'send-notification',
  PROCESS_PAYMENT: 'process-payment',
  GENERATE_REPORT: 'generate-report',
  SYNC_DATA: 'sync-data',
  BACKUP_DATABASE: 'backup-database',
  ANALYZE_PRICES: 'analyze-prices',
  DETECT_ANOMALIES: 'detect-anomalies',
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  AUTHENTICATION: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_ATTEMPTS: 5,
  },
  
  API_GENERAL: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100,
  },
  
  API_PREMIUM: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 1000,
  },
  
  PASSWORD_RESET: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_ATTEMPTS: 3,
  },
  
  EMAIL_SENDING: {
    WINDOW_MS: 60 * 60 * 1000, // 1 hour
    MAX_EMAILS: 10,
  },
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  EMAIL_VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',
  ALERT_NOTIFICATION: 'alert-notification',
  PRICE_ALERT: 'price-alert',
  DIGEST: 'digest',
  ACCOUNT_LOCKED: 'account-locked',
  SUBSCRIPTION_EXPIRED: 'subscription-expired',
  PAYMENT_FAILED: 'payment-failed',
  MAINTENANCE_NOTICE: 'maintenance-notice',
} as const;

// Currencies
export const CURRENCIES = {
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  SEK: { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' },
  NOK: { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone' },
  DKK: { code: 'DKK', symbol: 'kr', name: 'Danish Krone' },
} as const;

// Languages
export const LANGUAGES = {
  FR: { code: 'fr', name: 'Français', flag: '🇫🇷' },
  EN: { code: 'en', name: 'English', flag: '🇬🇧' },
  ES: { code: 'es', name: 'Español', flag: '🇪🇸' },
  DE: { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  IT: { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  PT: { code: 'pt', name: 'Português', flag: '🇵🇹' },
  NL: { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  RU: { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  ZH: { code: 'zh', name: '中文', flag: '🇨🇳' },
  JA: { code: 'ja', name: '日本語', flag: '🇯🇵' },
} as const;

// Timezones (common ones)
export const TIMEZONES = {
  UTC: 'UTC',
  EUROPE_PARIS: 'Europe/Paris',
  EUROPE_LONDON: 'Europe/London',
  EUROPE_BERLIN: 'Europe/Berlin',
  EUROPE_ROME: 'Europe/Rome',
  EUROPE_MADRID: 'Europe/Madrid',
  AMERICA_NEW_YORK: 'America/New_York',
  AMERICA_LOS_ANGELES: 'America/Los_Angeles',
  AMERICA_CHICAGO: 'America/Chicago',
  AMERICA_TORONTO: 'America/Toronto',
  ASIA_TOKYO: 'Asia/Tokyo',
  ASIA_SHANGHAI: 'Asia/Shanghai',
  ASIA_SINGAPORE: 'Asia/Singapore',
  AUSTRALIA_SYDNEY: 'Australia/Sydney',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  
  USERS: {
    PROFILE: '/users/profile',
    PREFERENCES: '/users/preferences',
    ALERTS: '/users/alerts',
    NOTIFICATIONS: '/users/notifications',
    SETTINGS: '/users/settings',
  },
  
  ALERTS: {
    LIST: '/alerts',
    CREATE: '/alerts',
    UPDATE: '/alerts/:id',
    DELETE: '/alerts/:id',
    ACTIVATE: '/alerts/:id/activate',
    DEACTIVATE: '/alerts/:id/deactivate',
  },
  
  ADMIN: {
    USERS: '/admin/users',
    ANALYTICS: '/admin/analytics',
    SYSTEM: '/admin/system',
    ROUTES: '/admin/routes',
    PRICES: '/admin/prices',
    SETTINGS: '/admin/settings',
  },
  
  METRICS: {
    SYSTEM: '/metrics/system',
    USER: '/metrics/user',
    BUSINESS: '/metrics/business',
  },
} as const;

// System Configuration
export const SYSTEM_CONFIG = {
  DEFAULT_SCAN_FREQUENCY: {
    TIER1: 30, // minutes
    TIER2: 60, // minutes
    TIER3: 120, // minutes
  },
  
  DEFAULT_LIMITS: {
    MAX_ALERTS_PER_USER: 50,
    MAX_ALERTS_PER_DAY: 10,
    MAX_PRICE_AGE_HOURS: 24,
    ALERT_EXPIRY_HOURS: 48,
  },
  
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  },
  
  FILE_UPLOAD: {
    MAX_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  },
  
  SECURITY: {
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
    BCRYPT_ROUNDS: 10,
    SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  },
  
  MONITORING: {
    HEALTH_CHECK_INTERVAL: 30000, // 30 seconds
    METRICS_COLLECTION_INTERVAL: 60000, // 1 minute
    LOG_RETENTION_DAYS: 30,
  },
} as const;

// Regular Expressions
export const REGEX = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  AIRPORT_CODE: /^[A-Z]{3}$/,
  PHONE: /^\+?[1-9]\d{1,14}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  JWT_TOKEN: /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/,
  FLIGHT_NUMBER: /^[A-Z]{2,3}[0-9]{1,4}$/,
  PRICE: /^\d+(\.\d{1,2})?$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/,
} as const;

// Default Values
export const DEFAULTS = {
  CURRENCY: 'EUR',
  LANGUAGE: 'fr',
  TIMEZONE: 'Europe/Paris',
  ALERT_FREQUENCY: 'daily',
  PAGINATION_LIMIT: 20,
  CACHE_TTL: 3600,
  RETRY_ATTEMPTS: 3,
  TIMEOUT: 30000,
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANOMALY_DETECTION: true,
  ENABLE_PRICE_PREDICTION: true,
  ENABLE_SMS_ALERTS: false,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_PACKAGE_DEALS: false,
  ENABLE_MULTI_CURRENCY: true,
  ENABLE_MULTI_LANGUAGE: true,
  ENABLE_MOBILE_APP: false,
  ENABLE_ADVANCED_ANALYTICS: true,
  ENABLE_REAL_TIME_ALERTS: true,
} as const;

// Export all constants
export const constants = {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  CACHE_KEYS,
  CACHE_TTL,
  QUEUE_NAMES,
  JOB_TYPES,
  RATE_LIMITS,
  EMAIL_TEMPLATES,
  CURRENCIES,
  LANGUAGES,
  TIMEZONES,
  API_ENDPOINTS,
  SYSTEM_CONFIG,
  REGEX,
  DEFAULTS,
  FEATURE_FLAGS,
};

export default constants;
