import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Custom application error with HTTP status code.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Wrap an async route handler to catch errors and forward them to the error handler.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Global error handling middleware.
 * Must be registered last in the Express middleware chain.
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Default to 500
  let statusCode = 500;
  let message = 'Internal server error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${statusCode}] ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`[${statusCode}] ${err.message}`);
  }

  // Send response
  res.status(statusCode).json({
    success: false,
    error: message,
    // Include stack trace in development only
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Handle 404 — route not found.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}
