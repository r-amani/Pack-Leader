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
  /** Speed in m/s, if available */
  speed?: number;
  /** GPS accuracy in meters */
  accuracy?: number;
  timestamp: string;
}

/**
 * Member location state as displayed on the leader dashboard.
 */
export interface IMemberLocationState {
  userId: string;
  name: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  /** Whether the location data is considered fresh */
  isStale: boolean;
  /** Whether the member is actively connected */
  isConnected: boolean;
  lastUpdated: string;
  /** Estimated time of arrival in minutes, if calculable */
  etaMinutes?: number;
}
