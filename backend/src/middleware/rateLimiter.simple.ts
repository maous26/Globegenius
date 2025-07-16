import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Simple rate limiter without Redis for testing
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'TooManyRequests',
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request): string => {
    return req.ip || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'TooManyRequests',
      message: 'Too many requests, please try again later',
    });
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth
  message: {
    error: 'TooManyRequests',
    message: 'Too many authentication attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs for API
  message: {
    error: 'TooManyRequests',
    message: 'API rate limit exceeded, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
