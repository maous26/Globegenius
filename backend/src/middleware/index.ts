// Re-export all middleware for cleaner imports
export { authenticate } from './auth';
export { errorHandler } from './errorHandler';
export { rateLimiter } from './rateLimiter';
export { validateRequest } from './validation';
