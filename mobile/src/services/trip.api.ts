import { IApiResponse, ICreateTrip, ITrip, TripStatus, UserRole } from '@packleader/shared';
import { apiClient } from '../config/api';

/**
 * Create a new trip.
 */
export async function createTrip(payload: ICreateTrip): Promise<ITrip> {
  try {
    const res = await apiClient.post<IApiResponse<ITrip>>('/trips', payload);
    if (!res.data.data) {
      throw new Error(res.data.error || 'Failed to create trip');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to create trip';
    throw new Error(message);
  }
}

/**
 * Fetch all trips for the authenticated user.
 */
export async function fetchMyTrips(): Promise<ITrip[]> {
  try {
    const res = await apiClient.get<IApiResponse<ITrip[]>>('/trips');
    return res.data.data || [];
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to fetch trips';
    throw new Error(message);
  }
}

/**
 * Fetch trip details by ID.
 */
export async function fetchTripById(tripId: string): Promise<ITrip> {
  try {
    const res = await apiClient.get<IApiResponse<ITrip>>(`/trips/${tripId}`);
    if (!res.data.data) {
      throw new Error(res.data.error || 'Trip not found');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to fetch trip details';
    throw new Error(message);
  }
}

/**
 * Join a trip using a 6-character invite code.
 */
export async function joinTripByCode(inviteCode: string): Promise<ITrip> {
  try {
    const res = await apiClient.post<IApiResponse<ITrip>>('/trips/join', {
      inviteCode: inviteCode.trim().toUpperCase(),
    });
    if (!res.data.data) {
      throw new Error(res.data.error || 'Failed to join trip');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to join trip';
    throw new Error(message);
  }
}

/**
 * Update the status of a trip (e.g. start or finish).
 */
export async function updateTripStatus(tripId: string, status: TripStatus): Promise<ITrip> {
  try {
    const res = await apiClient.patch<IApiResponse<ITrip>>(`/trips/${tripId}/status`, { status });
    if (!res.data.data) {
      throw new Error(res.data.error || 'Failed to update trip status');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to update trip status';
    throw new Error(message);
  }
}

/**
 * Update a member's role in a trip (Leader only).
 */
export async function updateMemberRole(
  tripId: string,
  memberUserId: string,
  role: UserRole
): Promise<ITrip> {
  try {
    const res = await apiClient.patch<IApiResponse<ITrip>>(
      `/trips/${tripId}/members/${memberUserId}/role`,
      { role }
    );
    if (!res.data.data) {
      throw new Error(res.data.error || 'Failed to update member role');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to update member role';
    throw new Error(message);
  }
}

/**
 * Remove a member or leave a trip.
 */
export async function removeTripMember(tripId: string, memberUserId: string): Promise<ITrip> {
  try {
    const res = await apiClient.delete<IApiResponse<ITrip>>(
      `/trips/${tripId}/members/${memberUserId}`
    );
    if (!res.data.data) {
      throw new Error(res.data.error || 'Failed to remove member');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to leave trip';
    throw new Error(message);
  }
}

/**
 * Update trip details (Leader only).
 */
export async function updateTrip(tripId: string, data: Partial<ICreateTrip>): Promise<ITrip> {
  try {
    const res = await apiClient.put<IApiResponse<ITrip>>(`/trips/${tripId}`, data);
    if (!res.data.data) {
      throw new Error(res.data.error || 'Failed to update trip');
    }
    return res.data.data;
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to update trip';
    throw new Error(message);
  }
}

/**
 * Delete a trip (Leader only).
 */
export async function deleteTrip(tripId: string): Promise<void> {
  try {
    const res = await apiClient.delete<IApiResponse<null>>(`/trips/${tripId}`);
    if (!res.data.success) {
      throw new Error(res.data.error || 'Failed to delete trip');
    }
  } catch (error: any) {
    const message = error.response?.data?.error || error.message || 'Failed to delete trip';
    throw new Error(message);
  }
}
