import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess } from '../utils/api-response';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export class AuthController {
  /**
   * Register a new user account.
   */
  async register(req: Request, res: Response): Promise<void> {
    const result = await authService.register(req.body);
    sendSuccess(res, result, 'Registration successful', 201);
  }

  /**
   * Log in an existing user.
   */
  async login(req: Request, res: Response): Promise<void> {
    const result = await authService.login(req.body);
    sendSuccess(res, result, 'Login successful', 200);
  }

  /**
   * Retrieve current authenticated user's profile.
   */
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const user = await authService.getCurrentUser(req.user.id);
    sendSuccess(res, user, 'Profile retrieved successfully', 200);
  }

  /**
   * Log out user (client destroys token).
   */
  async logout(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, null, 'Logged out successfully', 200);
  }
}

export const authController = new AuthController();
