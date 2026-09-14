/**
 * SOS alert status.
 */
export enum SOSStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

/**
 * An SOS emergency event.
 */
export interface ISOSAlert {
  id: string;
  userId: string;
  userName: string;
  tripId: string;
  latitude: number;
  longitude: number;
  status: SOSStatus;
  message?: string;
  acknowledgedBy?: string;
  resolvedAt?: string;
  createdAt: string;
}

/**
 * Check-in status for solo travelers.
 */
export enum CheckInStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  MISSED = 'missed',
  ALERTED = 'alerted',
}

/**
 * A solo traveler check-in configuration and state.
 */
export interface ICheckIn {
  id: string;
  userId: string;
  tripId?: string;
  destination: string;
  expectedArrival: string;
  /** Grace period in minutes after expectedArrival */
  checkInWindowMinutes: number;
  status: CheckInStatus;
  confirmedAt?: string;
  createdAt: string;
}
