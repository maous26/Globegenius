/**
 * Backend validation utilities using Joi
 */

import Joi from 'joi';

// Common validation schemas
export const commonSchemas = {
  // Basic types
  id: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
  
  // Date validations
  date: Joi.date().required(),
  futureDate: Joi.date().greater('now').required(),
  pastDate: Joi.date().less('now').required(),
  
  // Currency and numbers
  currency: Joi.string().valid('EUR', 'USD', 'GBP', 'CAD', 'AUD', 'JPY').required(),
  price: Joi.number().positive().precision(2).required(),
  
  // Location
  airportCode: Joi.string().length(3).uppercase().required(),
  country: Joi.string().length(2).uppercase().required(),
  timezone: Joi.string().required(),
  
  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  
  // Sorting
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('asc'),
};

// User validation schemas
export const userSchemas = {
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    acceptTerms: Joi.boolean().valid(true).required(),
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required(),
    rememberMe: Joi.boolean().optional(),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    avatar: Joi.string().uri().optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: commonSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required(),
  }),

  forgotPassword: Joi.object({
    email: commonSchemas.email,
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: commonSchemas.password,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
  }),
};

// Alert validation schemas
export const alertSchemas = {
  create: Joi.object({
    origin: commonSchemas.airportCode,
    destination: commonSchemas.airportCode,
    departureDate: commonSchemas.futureDate,
    returnDate: Joi.date().greater(Joi.ref('departureDate')).optional(),
    maxPrice: commonSchemas.price,
    currency: commonSchemas.currency,
    passengers: Joi.number().integer().min(1).max(9).default(1),
    isFlexible: Joi.boolean().default(false),
    flexibilityDays: Joi.number().integer().min(1).max(7).when('isFlexible', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
  }),

  update: Joi.object({
    maxPrice: commonSchemas.price.optional(),
    isActive: Joi.boolean().optional(),
    isFlexible: Joi.boolean().optional(),
    flexibilityDays: Joi.number().integer().min(1).max(7).optional(),
  }),

  query: Joi.object({
    ...commonSchemas,
    origin: commonSchemas.airportCode.optional(),
    destination: commonSchemas.airportCode.optional(),
    isActive: Joi.boolean().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().greater(Joi.ref('dateFrom')).optional(),
  }),
};

// User preferences validation schemas
export const preferencesSchemas = {
  update: Joi.object({
    departureAirports: Joi.array().items(commonSchemas.airportCode).min(1).max(10).optional(),
    maxBudget: commonSchemas.price.optional(),
    alertFrequency: Joi.string().valid('immediate', 'daily', 'weekly').optional(),
    timezone: commonSchemas.timezone.optional(),
    currency: commonSchemas.currency.optional(),
    language: Joi.string().valid('fr', 'en', 'es', 'de', 'it').optional(),
    notificationChannels: Joi.object({
      email: Joi.boolean().optional(),
      sms: Joi.boolean().optional(),
      push: Joi.boolean().optional(),
    }).optional(),
  }),
};

// Price data validation schemas
export const priceSchemas = {
  create: Joi.object({
    origin: commonSchemas.airportCode,
    destination: commonSchemas.airportCode,
    departureDate: commonSchemas.date,
    returnDate: Joi.date().greater(Joi.ref('departureDate')).optional(),
    price: commonSchemas.price,
    currency: commonSchemas.currency,
    airline: Joi.string().required(),
    flightNumber: Joi.string().required(),
    departureTime: commonSchemas.date,
    arrivalTime: Joi.date().greater(Joi.ref('departureTime')).required(),
    source: Joi.string().required(),
    bookingUrl: Joi.string().uri().optional(),
    availableSeats: Joi.number().integer().min(0).optional(),
    aircraftType: Joi.string().optional(),
    duration: Joi.number().integer().positive().optional(), // in minutes
    stops: Joi.number().integer().min(0).optional(),
  }),

  query: Joi.object({
    ...commonSchemas,
    origin: commonSchemas.airportCode.optional(),
    destination: commonSchemas.airportCode.optional(),
    dateFrom: Joi.date().optional(),
    dateTo: Joi.date().greater(Joi.ref('dateFrom')).optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    airline: Joi.string().optional(),
    isAnomaly: Joi.boolean().optional(),
    source: Joi.string().optional(),
  }),
};

// Route validation schemas
export const routeSchemas = {
  create: Joi.object({
    origin: commonSchemas.airportCode,
    destination: commonSchemas.airportCode,
    tier: Joi.number().integer().valid(1, 2, 3).required(),
    avgVolume: Joi.number().integer().positive().required(),
    seasonal: Joi.string().valid('summer', 'winter', 'all').optional(),
    scanFrequency: Joi.number().integer().min(1).required(), // minutes
  }),

  update: Joi.object({
    tier: Joi.number().integer().valid(1, 2, 3).optional(),
    avgVolume: Joi.number().integer().positive().optional(),
    seasonal: Joi.string().valid('summer', 'winter', 'all').optional(),
    scanFrequency: Joi.number().integer().min(1).optional(),
    isActive: Joi.boolean().optional(),
  }),

  query: Joi.object({
    ...commonSchemas,
    origin: commonSchemas.airportCode.optional(),
    destination: commonSchemas.airportCode.optional(),
    tier: Joi.number().integer().valid(1, 2, 3).optional(),
    seasonal: Joi.string().valid('summer', 'winter', 'all').optional(),
    isActive: Joi.boolean().optional(),
  }),
};

// Admin validation schemas
export const adminSchemas = {
  userQuery: Joi.object({
    ...commonSchemas,
    email: Joi.string().email().optional(),
    role: Joi.string().valid('user', 'admin').optional(),
    isActive: Joi.boolean().optional(),
    registeredFrom: Joi.date().optional(),
    registeredTo: Joi.date().greater(Joi.ref('registeredFrom')).optional(),
  }),

  updateUser: Joi.object({
    role: Joi.string().valid('user', 'admin').optional(),
    isActive: Joi.boolean().optional(),
  }),

  systemConfig: Joi.object({
    scanFrequencies: Joi.object({
      tier1: Joi.number().integer().min(1).optional(),
      tier2: Joi.number().integer().min(1).optional(),
      tier3: Joi.number().integer().min(1).optional(),
    }).optional(),
    limits: Joi.object({
      maxAlertsPerUser: Joi.number().integer().min(1).optional(),
      maxRequestsPerMinute: Joi.number().integer().min(1).optional(),
      maxPriceAgeHours: Joi.number().integer().min(1).optional(),
    }).optional(),
  }),
};

// Middleware validation schemas
export const middlewareSchemas = {
  rateLimitConfig: Joi.object({
    windowMs: Joi.number().integer().min(1000).required(),
    max: Joi.number().integer().min(1).required(),
    message: Joi.string().required(),
    standardHeaders: Joi.boolean().default(true),
    legacyHeaders: Joi.boolean().default(false),
  }),

  corsConfig: Joi.object({
    origin: Joi.alternatives().try(
      Joi.string().uri(),
      Joi.array().items(Joi.string().uri()),
      Joi.function(),
    ).required(),
    credentials: Joi.boolean().default(true),
    methods: Joi.array().items(Joi.string().valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD')).optional(),
  }),
};

// File upload validation schemas
export const fileSchemas = {
  upload: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().valid('image/jpeg', 'image/png', 'image/gif', 'image/webp').required(),
    size: Joi.number().integer().max(5 * 1024 * 1024).required(), // 5MB max
  }),
};

// API key validation schemas
export const apiKeySchemas = {
  usage: Joi.object({
    provider: Joi.string().required(),
    endpoint: Joi.string().required(),
    requestsCount: Joi.number().integer().min(0).required(),
    cost: Joi.number().min(0).required(),
    responseTime: Joi.number().min(0).required(),
    success: Joi.boolean().required(),
    error: Joi.string().optional(),
  }),
};

// Validation middleware factory
export const validate = (schema: Joi.ObjectSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value,
      }));

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors,
        timestamp: new Date().toISOString(),
      });
    }

    // Replace the request data with the validated and sanitized value
    req[source] = value;
    next();
  };
};

// Custom validation helpers
export const customValidators = {
  /**
   * Validate airport code exists in database
   */
  airportExists: (code: string): Promise<boolean> => {
    // Implementation would check database
    return Promise.resolve(true);
  },

  /**
   * Validate route exists and is active
   */
  routeExists: (origin: string, destination: string): Promise<boolean> => {
    // Implementation would check database
    return Promise.resolve(true);
  },

  /**
   * Validate user has permission for resource
   */
  userCanAccess: (userId: string, resourceId: string): Promise<boolean> => {
    // Implementation would check permissions
    return Promise.resolve(true);
  },

  /**
   * Validate date is within allowed booking window
   */
  dateInBookingWindow: (date: Date): boolean => {
    const now = new Date();
    const maxBookingDate = new Date();
    maxBookingDate.setMonth(maxBookingDate.getMonth() + 11); // 11 months ahead

    return date >= now && date <= maxBookingDate;
  },

  /**
   * Validate price is reasonable for route
   */
  priceIsReasonable: (price: number, origin: string, destination: string): Promise<boolean> => {
    // Implementation would check historical prices
    return Promise.resolve(true);
  },
};

// Error response helper
export const validationError = (message: string, details?: any) => {
  return {
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString(),
  };
};

// Success response helper
export const validationSuccess = (data: any) => {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
};

// Sanitization helpers
export const sanitize = {
  /**
   * Sanitize string input
   */
  string: (value: string): string => {
    return value.trim().replace(/[<>]/g, '');
  },

  /**
   * Sanitize email input
   */
  email: (value: string): string => {
    return value.trim().toLowerCase();
  },

  /**
   * Sanitize airport code
   */
  airportCode: (value: string): string => {
    return value.trim().toUpperCase();
  },

  /**
   * Sanitize phone number
   */
  phone: (value: string): string => {
    return value.replace(/[^\d+]/g, '');
  },

  /**
   * Sanitize URL
   */
  url: (value: string): string => {
    return value.trim().toLowerCase();
  },
};

export default {
  commonSchemas,
  userSchemas,
  alertSchemas,
  preferencesSchemas,
  priceSchemas,
  routeSchemas,
  adminSchemas,
  middlewareSchemas,
  fileSchemas,
  apiKeySchemas,
  validate,
  customValidators,
  validationError,
  validationSuccess,
  sanitize,
};
