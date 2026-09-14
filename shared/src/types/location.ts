import { UserRole } from '../constants/roles';

/**
 * A real-time location snapshot from a device.
 */
export interface ILocationSnapshot {
  userId: string;
  tripId: string;
  latitude: number;
  longitude: number;
  /** Heading in degrees (0-360), if available */
  heading?: number;
  /** Speed in m/s or km/h, if available */
  speed?: number;
  /** GPS accuracy in meters */
  accuracy?: number;
  /** Device battery level percentage (0-100) */
  batteryLevel?: number;
  timestamp: string;
}

/**
 * Member location state as displayed on the leader dashboard and map radar.
 */
export interface IMemberLocationState {
  userId: string;
  name: string;
  role?: UserRole;
  avatar?: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  batteryLevel?: number;
  /** Distance from this member to the pack leader in meters */
  distanceToLeaderMeters?: number;
  /** Whether the location data is considered fresh (received within 2 mins) */
  isStale: boolean;
  /** Whether the member's WebSocket is currently active */
  isConnected: boolean;
  lastUpdated: string;
  lastSeenTimestamp: number;
  /** Estimated time of arrival in minutes, if calculable */
  etaMinutes?: number;
}

/**
 * Summary of the overall pack formation and telemetry.
 */
export interface IPackStatusSummary {
  tripId: string;
  activeMembersCount: number;
  totalMembersCount: number;
  /** Distance between Leader and Sweeper in meters */
  leaderToSweeperDistanceMeters?: number;
  /** Maximum distance between any two pack members in meters */
  maxSpreadMeters?: number;
  /** Status indicator: 'tight' (<1km), 'stretched' (1-3km), 'scattered' (>3km) */
  packStatus: 'tight' | 'stretched' | 'scattered' | 'unknown';
  members: IMemberLocationState[];
}
