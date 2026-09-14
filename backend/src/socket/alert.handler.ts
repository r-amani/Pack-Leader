import { Server as SocketIOServer, Socket } from 'socket.io';
import { SocketEvents, IQuickAlert } from '@packleader/shared';
import { logger } from '../utils/logger';

/**
 * Real-time convoy quick alert event handlers.
 */
export function registerAlertHandlers(io: SocketIOServer, socket: Socket): void {
  socket.on(SocketEvents.QUICK_ALERT_SEND, (data: Partial<IQuickAlert>) => {
    const { tripId, type, message, senderId, senderName, senderRole, latitude, longitude } = data;
    if (!tripId || !type || !senderId) return;

    const alertPayload: IQuickAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      tripId,
      type,
      senderId,
      senderName: senderName || 'Pack Member',
      senderRole: senderRole || 'member',
      message: message || `Alert: ${type}`,
      latitude,
      longitude,
      timestamp: new Date().toISOString(),
    };

    const room = `trip:${tripId}`;
    logger.info(`🚨 Quick Alert [${type}] dispatched in ${room} by ${senderName || senderId}`);

    // Broadcast to all active riders in the expedition room
    io.to(room).emit(SocketEvents.QUICK_ALERT_BROADCAST, alertPayload);
  });
}
