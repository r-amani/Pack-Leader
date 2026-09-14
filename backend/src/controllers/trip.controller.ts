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
}

export const tripController = new TripController();
