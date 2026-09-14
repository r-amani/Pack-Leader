import { ISOSAlert } from '@packleader/shared';
import { apiClient } from '../config/api';

/**
 * Client API for safety, SOS emergency beacons, and check-ins.
 */
export async function triggerSosBeacon(
  tripId: string,
  latitude: number,
  longitude: number,
  message?: string
): Promise<ISOSAlert> {
  const res = await apiClient.post('/safety/sos', {
    tripId,
    latitude,
    longitude,
    message,
  });
  return res.data?.data as ISOSAlert;
}

export async function fetchActiveSosAlerts(tripId: string): Promise<ISOSAlert[]> {
  const res = await apiClient.get(`/safety/sos/active/${tripId}`);
  return (res.data?.data as ISOSAlert[]) || [];
}

export async function resolveSosBeacon(alertId: string): Promise<ISOSAlert> {
  const res = await apiClient.patch(`/safety/sos/${alertId}/resolve`);
  return res.data?.data as ISOSAlert;
}
