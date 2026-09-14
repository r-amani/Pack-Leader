import { IApiResponse, IUser } from '@packleader/shared';
import { apiClient } from '../config/api';

/**
 * Fetch a user profile by their ID.
 */
export async function fetchUserProfile(userId: string): Promise<IUser> {
  try {
    const res = await apiClient.get<IApiResponse<IUser>>(`/users/${userId}`);
    if (!res.data.data) {
      throw new Error(res.data.error || 'User not found');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to fetch user profile';
    throw new Error(message);
  }
}

/**
 * Update authenticated user's profile (name, travel mode, emergency contacts).
 */
export async function updateUserProfile(data: Partial<IUser>): Promise<IUser> {
  try {
    const res = await apiClient.put<IApiResponse<IUser>>('/users/me', data);
    if (!res.data.data) {
      throw new Error(res.data.error || 'Failed to update profile');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to update profile';
    throw new Error(message);
  }
}
