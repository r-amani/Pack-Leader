import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { User } from '../models/User';
import { sendSuccess } from '../utils/api-response';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export class UserController {
  /**
   * Get user profile by ID.
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid user ID format', 400);
    }

    const user = await User.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    sendSuccess(res, user.toUserResponse());
  }

  /**
   * Update authenticated user's profile (name, travel mode, emergency contacts).
   */
  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { name, preferredTravelMode, emergencyContacts } = req.body;

    if (name !== undefined) {
      user.name = name.trim();
    }
    if (preferredTravelMode !== undefined) {
      user.preferredTravelMode = preferredTravelMode;
    }
    if (emergencyContacts !== undefined && Array.isArray(emergencyContacts)) {
      user.emergencyContacts = emergencyContacts.map((c: any) => ({
        name: c.name?.trim() || '',
        phone: c.phone?.trim() || '',
        relationship: c.relationship?.trim() || '',
      }));
    }

    await user.save();
    sendSuccess(res, user.toUserResponse(), 'Profile updated successfully');
  }
}

export const userController = new UserController();
