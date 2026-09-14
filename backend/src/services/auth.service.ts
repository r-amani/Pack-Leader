import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { IAuthResponse, IUser, IUserLogin, IUserRegistration, TravelMode } from '@packleader/shared';
import { env } from '../config/environment';
import { User } from '../models/User';
import { AppError } from '../middleware/error-handler';
import { IJwtPayload } from '../middleware/auth';

/**
 * Generate a JWT token for the user.
 */
export function generateToken(payload: IJwtPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiry as any,
  });
}

export class AuthService {
  /**
   * Register a new user and return an auth response.
   */
  async register(data: IUserRegistration): Promise<IAuthResponse> {
    const existingUser = await User.findOne({ email: data.email.toLowerCase().trim() });
    if (existingUser) {
      throw new AppError('An account with this email address already exists', 409);
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const user = await User.create({
      name: data.name.trim(),
      email: data.email.toLowerCase().trim(),
      passwordHash,
      preferredTravelMode: data.preferredTravelMode || TravelMode.ROAD_TRIP,
      emergencyContacts: [],
    });

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return {
      user: user.toUserResponse(),
      token,
    };
  }

  /**
   * Authenticate a user with email and password.
   */
  async login(credentials: IUserLogin): Promise<IAuthResponse> {
    const user = await User.findByEmailWithPassword(credentials.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await user.comparePassword(credentials.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    });

    return {
      user: user.toUserResponse(),
      token,
    };
  }

  /**
   * Retrieve the user profile by ID.
   */
  async getCurrentUser(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user.toUserResponse();
  }
}

export const authService = new AuthService();
