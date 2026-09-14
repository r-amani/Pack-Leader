import { io, Socket } from 'socket.io-client';
import { SocketEvents } from '@packleader/shared';
import { AppConfig } from '../config/environment';

let socket: Socket | null = null;

/**
 * Connect to the Socket.IO server.
 *
 * @param token - JWT auth token to authenticate the connection
 */
export function connectSocket(token?: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(AppConfig.socketUrl, {
    transports: ['websocket'],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    auth: token ? { token } : undefined,
  });

  socket.on(SocketEvents.CONNECTION, () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on(SocketEvents.DISCONNECT, (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  socket.on(SocketEvents.CONNECT_ERROR, (error) => {
    console.warn('[Socket] Connection error:', error.message);
  });

  return socket;
}

/**
 * Disconnect the socket.
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/**
 * Get the current socket instance.
 * Returns null if not connected.
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Join a trip room for real-time updates.
 */
export function joinTripRoom(tripId: string, userId: string): void {
  socket?.emit(SocketEvents.TRIP_JOIN, { tripId, userId });
}

/**
 * Leave a trip room.
 */
export function leaveTripRoom(tripId: string, userId: string): void {
  socket?.emit(SocketEvents.TRIP_LEAVE, { tripId, userId });
}
