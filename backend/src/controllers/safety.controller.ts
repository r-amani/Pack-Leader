import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/error-handler';
import { sendSuccess } from '../utils/api-response';
import { SosAlert } from '../models/SosAlert';
import { SOSStatus, SocketEvents } from '@packleader/shared';
import { emitToTrip } from '../socket';

export class SafetyController {
  /**
   * Trigger an Emergency SOS Beacon.
   */
  async triggerSos(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { tripId, latitude, longitude, location, message, note } = req.body;
    const finalLat = latitude !== undefined ? latitude : location?.latitude;
    const finalLng = longitude !== undefined ? longitude : location?.longitude;

    if (!tripId || finalLat === undefined || finalLng === undefined) {
      throw new AppError('tripId, latitude, and longitude are required for SOS beacon', 400);
    }

    const alert = await SosAlert.create({
      userId: req.user.id,
      userName: req.user.name || 'Pack Member',
      tripId,
      latitude: finalLat,
      longitude: finalLng,
      status: SOSStatus.ACTIVE,
      message: message || note || '🚨 EMERGENCY SOS BEACON ACTIVATED — Immediate assistance requested',
    });

    // Real-time broadcast to all riders in the expedition
    emitToTrip(tripId, SocketEvents.SOS_TRIGGERED, {
      alertId: alert._id.toString(),
      userId: req.user.id,
      userName: req.user.name,
      latitude,
      longitude,
      message: alert.message,
      timestamp: alert.createdAt.toISOString(),
    });

    sendSuccess(res, alert, 'Emergency SOS beacon dispatched', 201);
  }

  /**
   * Get currently active SOS alerts for an expedition.
   */
  async getActiveSos(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { tripId } = req.params;
    const alerts = await SosAlert.find({
      tripId,
      status: { $in: [SOSStatus.ACTIVE, SOSStatus.ACKNOWLEDGED] },
    }).sort({ createdAt: -1 });

    sendSuccess(res, alerts, 'Active SOS alerts retrieved', 200);
  }

  /**
   * Resolve an active SOS alert.
   */
  async resolveSos(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    const alert = await SosAlert.findById(id);
    if (!alert) {
      throw new AppError('SOS Alert not found', 404);
    }

    alert.status = SOSStatus.RESOLVED;
    alert.resolvedAt = new Date();
    await alert.save();

    emitToTrip(alert.tripId.toString(), SocketEvents.SOS_RESOLVED, {
      alertId: alert._id.toString(),
      resolvedBy: req.user.name,
      resolvedAt: alert.resolvedAt.toISOString(),
    });

    sendSuccess(res, alert, 'SOS alert resolved successfully', 200);
  }
}

export const safetyController = new SafetyController();
