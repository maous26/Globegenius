/**
 * Backend helper utilities
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import { ApiResponse, PaginatedResponse, User } from '../types';

// Response helpers
export const response = {
  /**
   * Send success response
   */
  success: <T>(res: Response, data: T, message?: string, statusCode = 200): Response => {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    } as ApiResponse<T>);
  },

  /**
   * Send error response
   */
  error: (res: Response, message: string, statusCode = 500, error?: any): Response => {
    return res.status(statusCode).json({
      success: false,
      error: message,
      message,
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && error && { stack: error.stack }),
    } as ApiResponse);
  },

  /**
   * Send paginated response
   */
  paginated: <T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    statusCode = 200
  ): Response => {
    const pages = Math.ceil(total / limit);
    
    return res.status(statusCode).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
      timestamp: new Date().toISOString(),
    } as PaginatedResponse<T[]>);
  },

  /**
   * Send validation error response
   */
  validationError: (res: Response, errors: any[]): Response => {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  },

  /**
   * Send unauthorized response
   */
  unauthorized: (res: Response, message = 'Unauthorized'): Response => {
    return res.status(401).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  },

  /**
   * Send forbidden response
   */
  forbidden: (res: Response, message = 'Forbidden'): Response => {
    return res.status(403).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  },

  /**
   * Send not found response
   */
  notFound: (res: Response, message = 'Resource not found'): Response => {
    return res.status(404).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  },

  /**
   * Send conflict response
   */
  conflict: (res: Response, message = 'Resource already exists'): Response => {
    return res.status(409).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  },

  /**
   * Send rate limit response
   */
  rateLimited: (res: Response, message = 'Too many requests'): Response => {
    return res.status(429).json({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    } as ApiResponse);
  },
};

// Authentication helpers
export const auth = {
  /**
   * Extract user from request
   */
  getUser: (req: Request): User | null => {
    return req.user as User || null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (req: Request): boolean => {
    return !!req.user;
  },

  /**
   * Check if user has specific role
   */
  hasRole: (req: Request, role: string): boolean => {
    return req.user?.role === role;
  },

  /**
   * Check if user is admin
   */
  isAdmin: (req: Request): boolean => {
    return req.user?.role === 'admin';
  },

  /**
   * Check if user owns resource
   */
  isOwner: (req: Request, resourceUserId: string): boolean => {
    return req.user?.id === resourceUserId;
  },

  /**
   * Check if user can access resource
   */
  canAccess: (req: Request, resourceUserId: string): boolean => {
    return auth.isAdmin(req) || auth.isOwner(req, resourceUserId);
  },
};

// Pagination helpers
export const pagination = {
  /**
   * Get pagination parameters from request
   */
  getParams: (req: Request): { page: number; limit: number; offset: number } => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  },

  /**
   * Calculate pagination metadata
   */
  getMeta: (page: number, limit: number, total: number) => {
    const pages = Math.ceil(total / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;

    return {
      page,
      limit,
      total,
      pages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null,
    };
  },
};

// Sorting helpers
export const sorting = {
  /**
   * Get sort parameters from request
   */
  getParams: (req: Request, allowedFields: string[] = []): { sortBy: string; sortOrder: 'asc' | 'desc' } => {
    const sortBy = req.query.sortBy as string;
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'desc' ? 'desc' : 'asc';

    // Validate sort field
    if (sortBy && allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      throw new Error(`Invalid sort field: ${sortBy}. Allowed fields: ${allowedFields.join(', ')}`);
    }

    return {
      sortBy: sortBy || 'createdAt',
      sortOrder,
    };
  },

  /**
   * Build SQL ORDER BY clause
   */
  buildOrderBy: (sortBy: string, sortOrder: 'asc' | 'desc', tableAlias?: string): string => {
    const field = tableAlias ? `${tableAlias}.${sortBy}` : sortBy;
    return `${field} ${sortOrder.toUpperCase()}`;
  },
};

// Filtering helpers
export const filtering = {
  /**
   * Get filter parameters from request
   */
  getParams: (req: Request, allowedFields: string[] = []): Record<string, any> => {
    const filters: Record<string, any> = {};

    for (const [key, value] of Object.entries(req.query)) {
      if (allowedFields.length === 0 || allowedFields.includes(key)) {
        if (value !== undefined && value !== null && value !== '') {
          filters[key] = value;
        }
      }
    }

    return filters;
  },

  /**
   * Build SQL WHERE conditions
   */
  buildWhereConditions: (filters: Record<string, any>, tableAlias?: string): string => {
    const conditions: string[] = [];

    for (const [key, value] of Object.entries(filters)) {
      const field = tableAlias ? `${tableAlias}.${key}` : key;
      
      if (Array.isArray(value)) {
        conditions.push(`${field} IN (${value.map(() => '?').join(', ')})`);
      } else if (typeof value === 'string' && value.includes('%')) {
        conditions.push(`${field} LIKE ?`);
      } else {
        conditions.push(`${field} = ?`);
      }
    }

    return conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  },
};

// Validation helpers
export const validation = {
  /**
   * Check if value is valid UUID
   */
  isUUID: (value: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * Check if value is valid email
   */
  isEmail: (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * Check if value is valid airport code
   */
  isAirportCode: (value: string): boolean => {
    return /^[A-Z]{3}$/.test(value);
  },

  /**
   * Check if value is valid phone number
   */
  isPhoneNumber: (value: string): boolean => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(value);
  },

  /**
   * Check if value is valid URL
   */
  isURL: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if date is in future
   */
  isFutureDate: (date: Date): boolean => {
    return date > new Date();
  },

  /**
   * Check if date is in past
   */
  isPastDate: (date: Date): boolean => {
    return date < new Date();
  },
};

// Encryption helpers
export const encryption = {
  /**
   * Encrypt text using AES-256-GCM
   */
  encrypt: (text: string, key: string): string => {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('additional data'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  },

  /**
   * Decrypt text using AES-256-GCM
   */
  decrypt: (encryptedText: string, key: string): string => {
    const algorithm = 'aes-256-gcm';
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
    
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipher(algorithm, key);
    
    decipher.setAuthTag(authTag);
    decipher.setAAD(Buffer.from('additional data'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  },

  /**
   * Generate random token
   */
  generateToken: (length = 32): string => {
    return crypto.randomBytes(length).toString('hex');
  },

  /**
   * Hash password using bcrypt
   */
  hashPassword: async (password: string): Promise<string> => {
    const bcrypt = require('bcryptjs');
    return bcrypt.hash(password, 10);
  },

  /**
   * Compare password with hash
   */
  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, hash);
  },
};

// Date helpers
export const dateHelpers = {
  /**
   * Format date to ISO string
   */
  toISOString: (date: Date): string => {
    return date.toISOString();
  },

  /**
   * Add days to date
   */
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Add hours to date
   */
  addHours: (date: Date, hours: number): Date => {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  },

  /**
   * Get start of day
   */
  startOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  },

  /**
   * Get end of day
   */
  endOfDay: (date: Date): Date => {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  },

  /**
   * Check if date is today
   */
  isToday: (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  },

  /**
   * Get difference in days
   */
  diffInDays: (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Get difference in hours
   */
  diffInHours: (date1: Date, date2: Date): number => {
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60));
  },
};

// String helpers
export const stringHelpers = {
  /**
   * Generate random string
   */
  random: (length = 10): string => {
    return crypto.randomBytes(length).toString('hex').slice(0, length);
  },

  /**
   * Capitalize first letter
   */
  capitalize: (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  },

  /**
   * Convert to camelCase
   */
  toCamelCase: (str: string): string => {
    return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  },

  /**
   * Convert to snake_case
   */
  toSnakeCase: (str: string): string => {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  },

  /**
   * Truncate string
   */
  truncate: (str: string, length: number): string => {
    return str.length > length ? str.slice(0, length) + '...' : str;
  },

  /**
   * Remove HTML tags
   */
  stripHtml: (str: string): string => {
    return str.replace(/<[^>]*>/g, '');
  },

  /**
   * Slugify string
   */
  slugify: (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },
};

// Array helpers
export const arrayHelpers = {
  /**
   * Remove duplicates from array
   */
  unique: <T>(arr: T[]): T[] => {
    return [...new Set(arr)];
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk: <T>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Shuffle array
   */
  shuffle: <T>(arr: T[]): T[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  },

  /**
   * Group array by key
   */
  groupBy: <T>(arr: T[], key: keyof T): Record<string, T[]> => {
    return arr.reduce((groups, item) => {
      const groupKey = String(item[key]);
      groups[groupKey] = groups[groupKey] || [];
      groups[groupKey].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  },

  /**
   * Sort array by key
   */
  sortBy: <T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
    return arr.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
      return 0;
    });
  },
};

// Object helpers
export const objectHelpers = {
  /**
   * Pick specific keys from object
   */
  pick: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>;
    keys.forEach(key => {
      if (key in obj) {
        result[key] = obj[key];
      }
    });
    return result;
  },

  /**
   * Omit specific keys from object
   */
  omit: <T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj } as Omit<T, K>;
    keys.forEach(key => {
      delete (result as any)[key];
    });
    return result;
  },

  /**
   * Deep merge objects
   */
  deepMerge: <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = objectHelpers.deepMerge(result[key] || {} as any, source[key]);
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>];
      }
    }
    
    return result;
  },

  /**
   * Check if object is empty
   */
  isEmpty: (obj: Record<string, any>): boolean => {
    return Object.keys(obj).length === 0;
  },

  /**
   * Get nested value from object
   */
  get: (obj: Record<string, any>, path: string, defaultValue?: any): any => {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined) {
        return defaultValue;
      }
    }
    
    return result;
  },
};

// Export all helpers
export const helpers = {
  response,
  auth,
  pagination,
  sorting,
  filtering,
  validation,
  encryption,
  dateHelpers,
  stringHelpers,
  arrayHelpers,
  objectHelpers,
};

export default helpers;
