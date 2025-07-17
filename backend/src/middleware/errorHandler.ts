import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

// Types d'erreurs personnalisées
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Erreurs spécifiques
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, true, 'RATE_LIMIT_EXCEEDED');
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, originalError?: any) {
    super(
      `External API error: ${service}`,
      502,
      true,
      'EXTERNAL_API_ERROR',
      originalError
    );
  }
}

// Mapper les erreurs de base de données
const handleDatabaseError = (error: any): AppError => {
  // Erreurs PostgreSQL communes
  switch (error.code) {
    case '23505': // Violation de contrainte unique
      return new ConflictError('Cette ressource existe déjà');
    
    case '23503': // Violation de clé étrangère
      return new ValidationError('Référence invalide');
    
    case '23502': // Violation NOT NULL
      return new ValidationError('Champ requis manquant');
    
    case '22P02': // Syntaxe invalide pour le type
      return new ValidationError('Format de données invalide');
    
    case 'ECONNREFUSED':
      return new AppError('Service de base de données indisponible', 503);
    
    default:
      return new AppError('Erreur de base de données', 500, false);
  }
};

// Formater l'erreur pour la réponse
const formatErrorResponse = (error: AppError, isDevelopment: boolean) => {
  const response: any = {
    error: error.code || 'INTERNAL_ERROR',
    message: error.message,
    statusCode: error.statusCode,
  };

  // En développement, inclure plus de détails
  if (isDevelopment) {
    response.details = error.details;
    response.stack = error.stack;
  }

  return response;
};

// Middleware principal de gestion d'erreurs
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: AppError;

  // Convertir en AppError si ce n'est pas déjà le cas
  if (err instanceof AppError) {
    error = err;
  } else if (err.name === 'ValidationError') {
    // Erreur de validation Joi ou Mongoose
    error = new ValidationError(err.message);
  } else if (err.name === 'JsonWebTokenError') {
    // Erreur JWT
    error = new AuthenticationError('Token invalide');
  } else if (err.name === 'TokenExpiredError') {
    // Token expiré
    error = new AuthenticationError('Token expiré');
  } else if ((err as any).code && typeof (err as any).code === 'string') {
    // Erreur de base de données
    error = handleDatabaseError(err);
  } else {
    // Erreur générique
    error = new AppError(
      err.message || 'Une erreur est survenue',
      500,
      false
    );
  }

  // Logger l'erreur
  if (error.isOperational) {
    logger.warn('Operational error:', {
      error: error.message,
      code: error.code,
      statusCode: error.statusCode,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    });
  } else {
    logger.error('Non-operational error:', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query,
      userId: req.user?.id,
    });
  }

  // Envoyer la réponse
  res.status(error.statusCode).json(
    formatErrorResponse(error, config.isDevelopment)
  );
};

// Gestionnaire pour les promesses rejetées non gérées
export const handleUnhandledRejection = (
  reason: any,
  promise: Promise<any>
): void => {
  logger.error('Unhandled Promise Rejection:', {
    reason,
    promise,
  });

  // En production, on pourrait vouloir arrêter le processus
  if (config.isProduction) {
    // Donner le temps de logger l'erreur avant de fermer
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
};

// Gestionnaire pour les exceptions non capturées
export const handleUncaughtException = (error: Error): void => {
  logger.fatal('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });

  // Toujours arrêter le processus pour les exceptions non capturées
  process.exit(1);
};

// Wrapper pour les fonctions async dans Express
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware pour valider les IDs UUID
export const validateUUID = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const uuid = req.params[paramName];
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuid || !uuidRegex.test(uuid)) {
      return next(new ValidationError(`Invalid ${paramName} format`));
    }
    
    next();
  };
};

// Middleware pour gérer les erreurs 404
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.path}`);
  next(error);
};

// Export des classes d'erreur pour utilisation dans l'app
export const errors = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalAPIError,
};