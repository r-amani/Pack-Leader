import { Socket, Server as SocketIOServer } from 'socket.io';
import {
  SocketEvents,
  ILocationSnapshot,
  IMemberLocationState,
  IPackStatusSummary,
  UserRole,
} from '@packleader/shared';
import { logger } from '../utils/logger';
import { Trip } from '../models/Trip';
import { User } from '../models/User';

/**
 * In-memory store of real-time member locations grouped by tripId:
 * tripId -> Map<userId, IMemberLocationState>
 */
export const tripLocationStores = new Map<string, Map<string, IMemberLocationState>>();

/**
 * Mapping of socketId -> { tripId, userId } for disconnect tracking.
 */
const socketUserMap = new Map<string, { tripId: string; userId: string }>();

/**
 * Calculate Haversine distance in meters between two coordinate pairs.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Retrieve the current pack telemetry summary for a trip.
 */
export function getTripPackStatus(tripId: string): IPackStatusSummary {
  const store = tripLocationStores.get(tripId);
  const members: IMemberLocationState[] = store ? Array.from(store.values()) : [];

  const activeMembers = members.filter((m) => m.isConnected && !m.isStale);
  const leader = members.find((m) => m.role === UserRole.LEADER);
  const sweeper = members.find((m) => m.role === UserRole.SWEEPER);

  let leaderToSweeperDistanceMeters: number | undefined;
  if (leader && sweeper && leader.latitude && sweeper.latitude) {
    leaderToSweeperDistanceMeters = calculateHaversineDistanceMeters(
      leader.latitude,
      leader.longitude,
      sweeper.latitude,
      sweeper.longitude
    );
  }

  // Update distance to leader for each member
  if (leader) {
    for (const m of members) {
      if (m.userId !== leader.userId && m.latitude) {
        m.distanceToLeaderMeters = calculateHaversineDistanceMeters(
          leader.latitude,
          leader.longitude,
          m.latitude,
          m.longitude
        );
      } else if (m.userId === leader.userId) {
        m.distanceToLeaderMeters = 0;
      }
    }
  }

  // Calculate maximum spread among currently active members
  let maxSpreadMeters = 0;
  if (activeMembers.length > 1) {
    for (let i = 0; i < activeMembers.length; i++) {
      for (let j = i + 1; j < activeMembers.length; j++) {
        const d = calculateHaversineDistanceMeters(
          activeMembers[i].latitude,
          activeMembers[i].longitude,
          activeMembers[j].latitude,
          activeMembers[j].longitude
        );
        if (d > maxSpreadMeters) {
          maxSpreadMeters = d;
        }
      }
    }
  }

  let packStatus: 'tight' | 'stretched' | 'scattered' | 'unknown' = 'unknown';
  if (activeMembers.length > 0) {
    if (maxSpreadMeters <= 1000) {
      packStatus = 'tight';
    } else if (maxSpreadMeters <= 3000) {
      packStatus = 'stretched';
    } else {
      packStatus = 'scattered';
    }
  }

  return {
    tripId,
    activeMembersCount: activeMembers.length,
    totalMembersCount: members.length,
    leaderToSweeperDistanceMeters,
    maxSpreadMeters,
    packStatus,
    members,
  };
}

/**
 * Attach location tracking and pack telemetry socket handlers.
 */
export function registerLocationHandlers(io: SocketIOServer, socket: Socket): void {
  // 1. Join Trip Room
  socket.on(
    SocketEvents.TRIP_JOIN,
    async (data: { tripId: string; userId: string; name?: string }) => {
      const { tripId, userId } = data;
      if (!tripId || !userId) return;

      const room = `trip:${tripId}`;
      socket.join(room);
      socketUserMap.set(socket.id, { tripId, userId });

      logger.info(`📍 Member ${userId} joined room ${room} (Socket: ${socket.id})`);

      // Initialize trip store if not present
      if (!tripLocationStores.has(tripId)) {
        tripLocationStores.set(tripId, new Map());
      }
      const store = tripLocationStores.get(tripId)!;

      // Determine member's name and role from Trip database
      let memberName = data.name || 'Pack Member';
      let memberRole = UserRole.MEMBER;

      try {
        const trip = await Trip.findById(tripId).select('leader members').lean();
        if (trip) {
          if (trip.leader?.toString() === userId) {
            memberRole = UserRole.LEADER;
          }
          const m = trip.members?.find(
            (mem: any) =>
              mem.userId?.toString() === userId || mem.user?.toString() === userId
          );
          if (m?.role) {
            memberRole = m.role as UserRole;
          }
        }
        const user = await User.findById(userId).select('name avatar').lean();
        if (user?.name) {
          memberName = user.name;
        }
      } catch (err) {
        logger.debug(`Error fetching user/trip details on socket join: ${err}`);
      }

      // If member was already in store, mark reconnected; else create initial record
      const existing = store.get(userId);
      const memberState: IMemberLocationState = existing || {
        userId,
        name: memberName,
        role: memberRole,
        latitude: 0,
        longitude: 0,
        isStale: true,
        isConnected: true,
        lastUpdated: new Date().toISOString(),
        lastSeenTimestamp: Date.now(),
      };
      memberState.isConnected = true;
      memberState.name = memberName;
      memberState.role = memberRole;
      store.set(userId, memberState);

      // Send the entire current pack formation state directly to the new joiner
      const currentPackStatus = getTripPackStatus(tripId);
      socket.emit(SocketEvents.PACK_STATE, currentPackStatus);

      // Broadcast update to other members in the trip
      socket.to(room).emit(SocketEvents.TRIP_UPDATED, {
        type: 'member_joined',
        userId,
        tripId,
        member: memberState,
      });
    }
  );

  // 2. Broadcast Live GPS Location Update
  socket.on(SocketEvents.LOCATION_UPDATE, (payload: ILocationSnapshot) => {
    const { tripId, userId, latitude, longitude, speed, heading, accuracy, batteryLevel } =
      payload;
    if (!tripId || !userId || latitude === undefined || longitude === undefined) return;

    const room = `trip:${tripId}`;
    if (!tripLocationStores.has(tripId)) {
      tripLocationStores.set(tripId, new Map());
    }
    const store = tripLocationStores.get(tripId)!;

    const existing = store.get(userId);
    const updatedState: IMemberLocationState = {
      userId,
      name: existing?.name || 'Pack Member',
      role: existing?.role || UserRole.MEMBER,
      avatar: existing?.avatar,
      latitude,
      longitude,
      speed: speed ?? existing?.speed ?? 0,
      heading: heading ?? existing?.heading ?? 0,
      batteryLevel: batteryLevel ?? existing?.batteryLevel,
      isStale: false,
      isConnected: true,
      lastUpdated: new Date().toISOString(),
      lastSeenTimestamp: Date.now(),
    };

    store.set(userId, updatedState);

    // Compute updated pack summary and broadcast
    const packSummary = getTripPackStatus(tripId);
    const enrichedMember =
      packSummary.members.find((m: IMemberLocationState) => m.userId === userId) || updatedState;

    // Broadcast updated location to all other members in the trip room
    socket.to(room).emit(SocketEvents.LOCATION_UPDATED, enrichedMember);

    // Check for pack separation / spread alert (> 2.5 km between leader and sweeper or members)
    if (packSummary.packStatus === 'scattered' && (packSummary.maxSpreadMeters || 0) > 2500) {
      io.to(room).emit(SocketEvents.PACK_ALERT, {
        tripId,
        type: 'pack_spread',
        message: `⚠️ Pack formation scattered: Max distance between riders is ${(
          (packSummary.maxSpreadMeters || 0) / 1000
        ).toFixed(1)} km.`,
        leaderToSweeperDistanceMeters: packSummary.leaderToSweeperDistanceMeters,
        maxSpreadMeters: packSummary.maxSpreadMeters,
      });
    }
  });

  // 3. Leave Trip Room
  socket.on(SocketEvents.TRIP_LEAVE, (data: { tripId: string; userId: string }) => {
    const { tripId, userId } = data;
    if (!tripId) return;

    const room = `trip:${tripId}`;
    socket.leave(room);
    socketUserMap.delete(socket.id);

    const store = tripLocationStores.get(tripId);
    if (store && userId && store.has(userId)) {
      const member = store.get(userId)!;
      member.isConnected = false;
      member.isStale = true;
      socket.to(room).emit(SocketEvents.LOCATION_UPDATED, member);
    }

    socket.to(room).emit(SocketEvents.TRIP_UPDATED, {
      type: 'member_left',
      userId,
      tripId,
    });
  });

  // 4. Socket Disconnection Cleanup
  socket.on(SocketEvents.DISCONNECT, () => {
    const userMeta = socketUserMap.get(socket.id);
    if (userMeta) {
      const { tripId, userId } = userMeta;
      socketUserMap.delete(socket.id);

      const store = tripLocationStores.get(tripId);
      if (store && store.has(userId)) {
        const member = store.get(userId)!;
        member.isConnected = false;
        member.lastUpdated = new Date().toISOString();

        // Broadcast member disconnected status
        socket.to(`trip:${tripId}`).emit(SocketEvents.LOCATION_UPDATED, member);
      }
    }
  });
}

/**
 * Background Heartbeat: Check for stale GPS locations every 30 seconds.
 */
setInterval(() => {
  const now = Date.now();
  const STALE_THRESHOLD_MS = 120000; // 2 minutes

  tripLocationStores.forEach((store, tripId) => {
    let hasStaleUpdate = false;
    store.forEach((member) => {
      if (!member.isStale && now - member.lastSeenTimestamp > STALE_THRESHOLD_MS) {
        member.isStale = true;
        hasStaleUpdate = true;
      }
    });

    if (hasStaleUpdate) {
      // Broadcast stale notification if members stopped updating
      try {
        const { getIO } = require('./index');
        const io = getIO();
        io.to(`trip:${tripId}`).emit(SocketEvents.LOCATION_STALE, {
          tripId,
          timestamp: new Date().toISOString(),
        });
      } catch {
        // Socket server may not be ready
      }
    }
  });
}, 30000);
