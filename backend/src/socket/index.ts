import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { SocketEvents } from '@packleader/shared';
import { logger } from '../utils/logger';
import { env } from '../config/environment';
import { registerLocationHandlers } from './location.handler';

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

    // Register all Stage 5 real-time location & pack tracking handlers
    registerLocationHandlers(io!, socket);

    // Disconnect
    socket.on(SocketEvents.DISCONNECT, (reason) => {
      logger.info(`🔌 Socket disconnected: ${socket.id} (${reason})`);
    });

    // Error
    socket.on(SocketEvents.CONNECT_ERROR, (err) => {
      logger.error(`Socket error: ${socket.id}`, err);
    });
  });

  logger.info('🔌 Socket.IO initialized with Stage 5 location tracking');
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

export * from './location.handler';
