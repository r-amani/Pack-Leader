/**
 * WebSocket / Socket.IO event names.
 *
 * Shared between backend and mobile to ensure event name consistency.
 * All custom events use namespaced naming: `domain:action`.
 */
export const SocketEvents = {
  // Connection lifecycle
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',

  // Trip lifecycle
  TRIP_JOIN: 'trip:join',
  TRIP_LEAVE: 'trip:leave',
  TRIP_STARTED: 'trip:started',
  TRIP_ENDED: 'trip:ended',
  TRIP_UPDATED: 'trip:updated',

  // Location tracking & Pack formation
  LOCATION_UPDATE: 'location:update',
  LOCATION_UPDATED: 'location:updated',
  LOCATION_BATCH_UPDATE: 'location:batch-updated',
  LOCATION_STALE: 'location:stale',
  PACK_STATE: 'pack:state',
  PACK_ALERT: 'pack:alert',

  // ETA and route progress
  ETA_UPDATED: 'eta:updated',
  ROUTE_PROGRESS: 'route:progress',

  // Safety — SOS
  SOS_TRIGGERED: 'sos:triggered',
  SOS_ACKNOWLEDGED: 'sos:acknowledged',
  SOS_RESOLVED: 'sos:resolved',

  // Safety — Check-in
  CHECKIN_REMINDER: 'checkin:reminder',
  CHECKIN_CONFIRMED: 'checkin:confirmed',
  CHECKIN_MISSED: 'checkin:missed',

  // Expenses
  EXPENSE_ADDED: 'expense:added',
  EXPENSE_UPDATED: 'expense:updated',
  EXPENSE_DELETED: 'expense:deleted',

  // Errors
  ERROR: 'error',
} as const;

export type SocketEvent = (typeof SocketEvents)[keyof typeof SocketEvents];
