import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { SocketEvents } from '@packleader/shared';
import { logger } from '../utils/logger';
import { env } from '../config/environment';

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO server and attach to the HTTP server.
 */
export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on(SocketEvents.CONNECTION, (socket: Socket) => {
    logger.info(`🔌 Socket connected: ${socket.id}`);

    // Join a trip room
    socket.on(SocketEvents.TRIP_JOIN, (data: { tripId: string; userId: string }) => {
      socket.join(`trip:${data.tripId}`);
      logger.debug(`Socket ${socket.id} joined trip room: trip:${data.tripId}`);

      // Notify other members
      socket.to(`trip:${data.tripId}`).emit(SocketEvents.TRIP_UPDATED, {
        type: 'member_joined',
        userId: data.userId,
        tripId: data.tripId,
      });
    });

    // Leave a trip room
    socket.on(SocketEvents.TRIP_LEAVE, (data: { tripId: string; userId: string }) => {
      socket.leave(`trip:${data.tripId}`);
      logger.debug(`Socket ${socket.id} left trip room: trip:${data.tripId}`);

      socket.to(`trip:${data.tripId}`).emit(SocketEvents.TRIP_UPDATED, {
        type: 'member_left',
        userId: data.userId,
        tripId: data.tripId,
      });
    });

    // Location update (Stage 5 will implement the full pipeline)
    socket.on(SocketEvents.LOCATION_UPDATE, (data) => {
      if (data.tripId) {
        // Broadcast to other trip members
        socket.to(`trip:${data.tripId}`).emit(SocketEvents.LOCATION_UPDATED, data);
      }
    });

    // Disconnect
    socket.on(SocketEvents.DISCONNECT, (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });

    // Error
    socket.on(SocketEvents.CONNECT_ERROR, (err) => {
      logger.error(`Socket error: ${socket.id}`, err);
    });
  });

  logger.info('🔌 Socket.IO initialized');
  return io;
}

/**
 * Get the Socket.IO server instance.
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO has not been initialized. Call initializeSocket first.');
  }
  return io;
}

/**
 * Emit an event to all members of a specific trip room.
 */
export function emitToTrip(tripId: string, event: string, data: unknown): void {
  if (io) {
    io.to(`trip:${tripId}`).emit(event, data);
  }
}
