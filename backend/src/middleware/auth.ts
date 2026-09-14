import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/environment';
import { AppError } from './error-handler';

/**
 * JWT payload structure.
 */
export interface IJwtPayload {
  id: string;
  email: string;
  name: string;
}

/**
 * Extended Express Request with authenticated user data.
 */
export interface AuthenticatedRequest extends Request {
  user?: IJwtPayload;
}

/**
 * Require authentication for a route.
 * Extracts and verifies JWT from the Authorization header.
 */
export function requireAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError('Authentication required. Missing or invalid Authorization header.', 401));
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new AppError('Authentication required. No token provided.', 401));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as IJwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired. Please log in again.', 401));
    }
    return next(new AppError('Invalid authentication token.', 401));
  }
}

/**
 * Optional authentication middleware.
 * Attaches user to req.user if valid token exists, but doesn't fail if missing.
 */
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as IJwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name,
    };
  } catch {
    // Silently ignore invalid optional tokens
  }

  next();
}

/**
 * Require a specific role for a route.
 */
export function requireRole(..._roles: string[]) {
  return (_req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    // Role checking will be integrated with trip memberships
    next();
  };
}
