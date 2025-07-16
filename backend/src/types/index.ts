/**
 * Backend utility types and interfaces
 */

// Express types extension
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

// Common response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Database types
export interface DatabaseConnection {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  departureAirports: string[];
  maxBudget: number;
  alertFrequency: 'immediate' | 'daily' | 'weekly';
  timezone: string;
  currency: string;
  language: string;
  notificationChannels: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Alert types
export interface Alert {
  id: string;
  userId: string;
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  maxPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PriceAlert {
  id: string;
  alertId: string;
  price: number;
  currency: string;
  airline: string;
  flightNumber: string;
  departureTime: Date;
  arrivalTime: Date;
  source: string;
  isProcessed: boolean;
  createdAt: Date;
}

// Price data types
export interface PriceData {
  id: string;
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  price: number;
  currency: string;
  airline: string;
  flightNumber: string;
  departureTime: Date;
  arrivalTime: Date;
  source: string;
  scrapedAt: Date;
  isAnomaly: boolean;
  anomalyScore?: number;
}

// Route types
export interface Route {
  id: string;
  origin: string;
  destination: string;
  tier: 1 | 2 | 3;
  avgVolume: number;
  seasonal?: 'summer' | 'winter' | 'all';
  isActive: boolean;
  scanFrequency: number; // minutes
  lastScanned?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Job types
export interface JobData {
  id: string;
  type: 'scan-route' | 'send-anomaly-alerts' | 'optimize-routes' | 'cleanup-old-data';
  data: any;
  priority: 'low' | 'normal' | 'high';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  processedAt?: Date;
  completedAt?: Date;
  failedAt?: Date;
  error?: string;
}

// ML types
export interface AnomalyDetection {
  id: string;
  routeId: string;
  priceDataId: string;
  anomalyScore: number;
  threshold: number;
  isAnomaly: boolean;
  confidence: number;
  modelVersion: string;
  detectedAt: Date;
  isProcessed: boolean;
}

// API key types
export interface ApiUsage {
  id: string;
  provider: string;
  endpoint: string;
  requestsCount: number;
  date: Date;
  cost: number;
  responseTime: number;
  success: boolean;
  error?: string;
}

// Configuration types
export interface AppConfig {
  env: string;
  port: number;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  database: DatabaseConnection;
  redis: {
    url: string;
  };
  apis: {
    flightLabs: {
      key: string;
      baseUrl: string;
    };
    travelPayout: {
      token: string;
      baseUrl: string;
    };
  };
  security: {
    jwt: {
      secret: string;
      refreshSecret: string;
      expiresIn: string;
    };
    bcrypt: {
      rounds: number;
    };
  };
}

// Middleware types
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  value: any;
}

// Service types
export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: any;
}

export interface SMSOptions {
  to: string;
  message: string;
}

// Queue types
export interface QueueJob<T = any> {
  id: string;
  name: string;
  data: T;
  opts: {
    delay?: number;
    attempts?: number;
    backoff?: {
      type: 'fixed' | 'exponential';
      delay: number;
    };
  };
}

// Cache types
export interface CacheOptions {
  ttl: number; // Time to live in seconds
  compress?: boolean;
  prefix?: string;
}

// Metrics types
export interface SystemMetrics {
  uptime: number;
  memoryUsage: {
    used: number;
    total: number;
    free: number;
  };
  cpuUsage: number;
  diskUsage: {
    used: number;
    total: number;
    free: number;
  };
  activeConnections: number;
  requestsPerMinute: number;
  errorRate: number;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & 
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type Nullable<T> = T | null;

export type ID = string;

export type Timestamp = Date;

export type Currency = 'EUR' | 'USD' | 'GBP' | 'CAD' | 'AUD' | 'JPY';

export type Language = 'fr' | 'en' | 'es' | 'de' | 'it';

export type Timezone = string; // IANA timezone identifier

export type AirportCode = string; // IATA airport code

export type FlightNumber = string;

export type Airline = string;

export type Country = string;

export type City = string;

export type Email = string;

export type PhoneNumber = string;

export type URL = string;

export type JSONValue = string | number | boolean | null | JSONObject | JSONArray;

export interface JSONObject {
  [key: string]: JSONValue;
}

export interface JSONArray extends Array<JSONValue> {}

export type Environment = 'development' | 'production' | 'test';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD';

export type HTTPStatus = 200 | 201 | 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503;
