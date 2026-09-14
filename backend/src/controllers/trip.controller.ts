import { Response } from 'express';
import { tripService } from '../services/trip.service';
import { sendSuccess } from '../utils/api-response';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';

export class TripController {
  /**
   * Create a new trip.
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const trip = await tripService.createTrip(req.user.id, req.user.name, req.body);
    sendSuccess(res, trip, 'Trip created successfully', 201);
  }

  /**
   * Get all trips for the authenticated user.
   */
  async getMyTrips(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const trips = await tripService.getUserTrips(req.user.id);
    sendSuccess(res, trips, 'Trips retrieved successfully', 200);
  }

  /**
   * Get trip details by ID.
   */
  async getById(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const trip = await tripService.getTripById(req.params.id, req.user.id);
    sendSuccess(res, trip, 'Trip details retrieved successfully', 200);
  }

  /**
   * Join a trip using a 6-character invite code.
   */
  async joinByCode(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const trip = await tripService.joinTripByInviteCode(
      req.user.id,
      req.user.name,
      req.body.inviteCode
    );
    sendSuccess(res, trip, 'Successfully joined the pack!', 200);
  }

  /**
   * Update the status of a trip.
   */
  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const trip = await tripService.updateTripStatus(
      req.params.id,
      req.user.id,
      req.body.status
    );
    sendSuccess(res, trip, 'Trip status updated successfully', 200);
  }

  /**
   * Update a trip member's role (Leader only).
   */
  async updateMemberRole(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const trip = await tripService.updateMemberRole(
      req.params.id,
      req.user.id,
      req.params.userId,
      req.body.role
    );
    sendSuccess(res, trip, 'Member role updated successfully', 200);
  }

  /**
   * Remove a member from a trip, or leave the trip.
   */
  async removeMember(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const trip = await tripService.removeMember(
      req.params.id,
      req.user.id,
      req.params.userId
    );
    sendSuccess(res, trip, 'Member removed successfully', 200);
  }

  /**
   * Update trip details (Leader only).
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const trip = await tripService.updateTrip(req.params.id, req.user.id, req.body);
    sendSuccess(res, trip, 'Trip updated successfully', 200);
  }

  /**
   * Delete a trip (Leader only).
   */
  async delete(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    await tripService.deleteTrip(req.params.id, req.user.id);
    sendSuccess(res, null, 'Trip deleted successfully', 200);
  }

  /**
   * Get real-time pack location and telemetry status for a trip.
   */
  async getPackStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    // Verify caller is a member
    await tripService.getTripById(req.params.id, req.user.id);
    const { getTripPackStatus } = require('../socket/location.handler');
    const packStatus = getTripPackStatus(req.params.id);
    sendSuccess(res, packStatus, 'Pack status retrieved successfully', 200);
  }

  /**
   * Bulk sync offline queued telemetry snapshots and status updates.
   */
  async syncOfflineTelemetry(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }
    const { id } = req.params;
    const { snapshots } = req.body;

    if (!snapshots || !Array.isArray(snapshots)) {
      throw new AppError('Snapshots array is required for batch sync', 400);
    }

    if (snapshots.length > 0) {
      const { tripLocationStores } = require('../socket/location.handler');
      if (tripLocationStores) {
        if (!tripLocationStores.has(id)) {
          tripLocationStores.set(id, new Map());
        }
        const store = tripLocationStores.get(id);
        if (store && req.user.id) {
          const latest = snapshots[snapshots.length - 1];
          const existing = store.get(req.user.id);
          if (existing) {
            existing.latitude = latest.latitude;
            existing.longitude = latest.longitude;
            existing.lastUpdated = latest.timestamp || new Date().toISOString();
            existing.isStale = false;
          } else {
            store.set(req.user.id, {
              userId: req.user.id,
              name: req.user.name || 'Rider',
              latitude: latest.latitude,
              longitude: latest.longitude,
              isStale: false,
              isConnected: false,
              lastUpdated: latest.timestamp || new Date().toISOString(),
              lastSeenTimestamp: Date.now(),
            });
          }
        }
      }
    }

    sendSuccess(
      res,
      {
        syncedCount: snapshots.length,
        lastSyncedTimestamp: new Date().toISOString(),
      },
      'Offline telemetry synchronized successfully',
      200
    );
  }
}

export const tripController = new TripController();
