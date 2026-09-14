import { IApiResponse, IAuthResponse, IUser, IUserLogin, IUserRegistration } from '@packleader/shared';
import { apiClient } from '../config/api';

/**
 * Register a new user with the backend API.
 */
export async function registerUser(payload: IUserRegistration): Promise<IAuthResponse> {
  try {
    const res = await apiClient.post<IApiResponse<IAuthResponse>>('/auth/register', payload);
    if (!res.data.data) {
      throw new Error(res.data.error || 'Registration failed');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to register';
    throw new Error(message);
  }
}

/**
 * Log in an existing user with email and password.
 */
export async function loginUser(credentials: IUserLogin): Promise<IAuthResponse> {
  try {
    const res = await apiClient.post<IApiResponse<IAuthResponse>>('/auth/login', credentials);
    if (!res.data.data) {
      throw new Error(res.data.error || 'Login failed');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to log in';
    throw new Error(message);
  }
}

/**
 * Retrieve the currently authenticated user's profile.
 */
export async function fetchCurrentUser(): Promise<IUser> {
  try {
    const res = await apiClient.get<IApiResponse<IUser>>('/auth/me');
    if (!res.data.data) {
      throw new Error(res.data.error || 'Failed to fetch user profile');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to fetch user profile';
    throw new Error(message);
  }
}

/**
 * Notify the backend of user logout.
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch {
    // Ignore server error on logout
  }
}
