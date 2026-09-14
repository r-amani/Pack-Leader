import { TravelMode } from '../constants/travel-modes';
import { TripStatus } from '../constants/trip-status';
import { UserRole } from '../constants/roles';

/**
 * Geographic coordinate pair.
 */
export interface ICoordinates {
  latitude: number;
  longitude: number;
}

/**
 * A named location with coordinates and optional address.
 */
export interface ILocation {
  coordinates: ICoordinates;
  address?: string;
  name?: string;
}

/**
 * A member's participation in a trip.
 */
export interface ITripMember {
  userId: string;
  name: string;
  role: UserRole;
  joinedAt: string;
  /** Whether the member is currently sharing location */
  isActive: boolean;
}

/**
 * Core trip interface.
 */
export interface ITrip {
  id: string;
  name: string;
  leader: string;
  members: ITripMember[];
  travelMode: TravelMode;
  origin: ILocation;
  destination: ILocation;
  status: TripStatus;
  /** Invite code for joining the trip */
  inviteCode: string;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for creating a new trip.
 */
export interface ICreateTrip {
  name: string;
  travelMode: TravelMode;
  origin: ILocation;
  destination: ILocation;
  scheduledStart?: string;
  scheduledEnd?: string;
}
