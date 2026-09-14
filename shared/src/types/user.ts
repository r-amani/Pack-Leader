import { TravelMode } from '../constants/travel-modes';

/**
 * Emergency contact for a user.
 */
export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

/**
 * Core user interface.
 */
export interface IUser {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  emergencyContacts: IEmergencyContact[];
  preferredTravelMode: TravelMode;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for user registration.
 */
export interface IUserRegistration {
  name: string;
  email: string;
  password: string;
  preferredTravelMode?: TravelMode;
}

/**
 * Payload for user login.
 */
export interface IUserLogin {
  email: string;
  password: string;
}

/**
 * Authentication response returned after login/signup.
 */
export interface IAuthResponse {
  user: IUser;
  token: string;
}
