import {
  SocketEvents,
  ILocationSnapshot,
  IMemberLocationState,
  IPackStatusSummary,
  UserRole,
} from '@packleader/shared';
import { connectSocket, getSocket } from './socket.service';
import { locationService } from './location.service';
import { ILocationCoordinates } from './map/map.types';

type PackUpdateListener = (summary: IPackStatusSummary) => void;
type PackAlertListener = (alert: { message: string; type: string }) => void;

/**
 * Service managing live GPS broadcasting, pack telemetry sync, and member updates via Socket.IO.
 */
export class PackTrackingService {
  private activeTripId: string | null = null;
  private currentUser: { id: string; name: string } | null = null;
  private userRole: UserRole = UserRole.MEMBER;
  private isTracking = false;

  private membersMap = new Map<string, IMemberLocationState>();
  private lastEmittedCoords: ILocationCoordinates | null = null;
  private lastEmittedTimestamp = 0;

  private stopLocationWatch: (() => void) | null = null;
  private packUpdateListeners = new Set<PackUpdateListener>();
  private alertListeners = new Set<PackAlertListener>();

  /**
   * Distance threshold in meters before triggering an immediate location emit.
   */
  private readonly MOVEMENT_THRESHOLD_METERS = 5;

  /**
   * Time interval in ms before emitting a periodic location keep-alive.
   */
  private readonly TIME_THRESHOLD_MS = 4000;

  /**
   * Start live tracking and GPS streaming for an expedition.
   */
  public async startTracking(
    tripId: string,
    user: { id: string; name: string },
    role: UserRole = UserRole.MEMBER
  ): Promise<void> {
    if (this.isTracking && this.activeTripId === tripId) {
      return;
    }

    this.stopTracking();

    this.activeTripId = tripId;
    this.currentUser = user;
    this.userRole = role;
    this.isTracking = true;

    // 1. Establish socket connection and register listeners
    const socket = connectSocket();
    this.registerSocketListeners(socket, tripId);

    // 2. Join the expedition's real-time room
    socket.emit(SocketEvents.TRIP_JOIN, {
      tripId,
      userId: user.id,
      name: user.name,
    });

    // 3. Acquire location permissions & start continuous GPS watch
    await locationService.requestLocationPermissions();

    this.stopLocationWatch = locationService.watchLocation(
      (coords) => {
        this.handleDeviceLocationUpdate(coords);
      },
      (error) => {
        console.warn('[PackTracker] GPS watch error:', error);
      }
    );

    console.log(`[PackTracker] Live tracking started for trip: ${tripId}`);
  }

  /**
   * Stop active GPS streaming and leave the expedition room.
   */
  public stopTracking(): void {
    if (!this.isTracking) return;

    if (this.stopLocationWatch) {
      this.stopLocationWatch();
      this.stopLocationWatch = null;
    }

    const socket = getSocket();
    if (socket && this.activeTripId && this.currentUser) {
      socket.emit(SocketEvents.TRIP_LEAVE, {
        tripId: this.activeTripId,
        userId: this.currentUser.id,
      });
      this.removeSocketListeners(socket);
    }

    this.isTracking = false;
    this.activeTripId = null;
    this.currentUser = null;
    this.lastEmittedCoords = null;
    this.membersMap.clear();

    this.notifyPackUpdate();
    console.log('[PackTracker] Live tracking stopped.');
  }

  /**
   * Check if live tracking is currently active.
   */
  public getIsTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get the ID of the trip currently being tracked.
   */
  public getActiveTripId(): string | null {
    return this.activeTripId;
  }

  /**
   * Subscribe to live pack formation and telemetry updates.
   */
  public onPackUpdate(listener: PackUpdateListener): () => void {
    this.packUpdateListeners.add(listener);
    // Emit immediate current state
    listener(this.getCurrentPackSummary());
    return () => {
      this.packUpdateListeners.delete(listener);
    };
  }

  /**
   * Subscribe to pack separation and formation alerts.
   */
  public onAlert(listener: PackAlertListener): () => void {
    this.alertListeners.add(listener);
    return () => {
      this.alertListeners.delete(listener);
    };
  }

  /**
   * Generate current snapshot of pack members and leader metrics.
   */
  public getCurrentPackSummary(): IPackStatusSummary {
    const members = Array.from(this.membersMap.values());
    const activeMembers = members.filter((m) => m.isConnected && !m.isStale);
    const leader = members.find((m) => m.role === UserRole.LEADER);
    const sweeper = members.find((m) => m.role === UserRole.SWEEPER);

    let leaderToSweeperDistanceMeters: number | undefined;
    if (leader && sweeper && leader.latitude && sweeper.latitude) {
      leaderToSweeperDistanceMeters = this.calculateDistanceMeters(
        leader.latitude,
        leader.longitude,
        sweeper.latitude,
        sweeper.longitude
      );
    }

    let maxSpreadMeters = 0;
    if (activeMembers.length > 1) {
      for (let i = 0; i < activeMembers.length; i++) {
        for (let j = i + 1; j < activeMembers.length; j++) {
          const d = this.calculateDistanceMeters(
            activeMembers[i].latitude,
            activeMembers[i].longitude,
            activeMembers[j].latitude,
            activeMembers[j].longitude
          );
          if (d > maxSpreadMeters) maxSpreadMeters = d;
        }
      }
    }

    let packStatus: 'tight' | 'stretched' | 'scattered' | 'unknown' = 'unknown';
    if (activeMembers.length > 0) {
      if (maxSpreadMeters <= 1000) packStatus = 'tight';
      else if (maxSpreadMeters <= 3000) packStatus = 'stretched';
      else packStatus = 'scattered';
    }

    return {
      tripId: this.activeTripId || '',
      activeMembersCount: activeMembers.length,
      totalMembersCount: members.length,
      leaderToSweeperDistanceMeters,
      maxSpreadMeters,
      packStatus,
      members,
    };
  }

  /**
   * Handle incoming device GPS location and determine if throttle conditions are met.
   */
  private handleDeviceLocationUpdate(coords: ILocationCoordinates): void {
    const now = Date.now();

    // Check if movement exceeds threshold or time interval elapsed
    let shouldEmit = false;
    if (!this.lastEmittedCoords) {
      shouldEmit = true;
    } else {
      const distance = this.calculateDistanceMeters(
        this.lastEmittedCoords.latitude,
        this.lastEmittedCoords.longitude,
        coords.latitude,
        coords.longitude
      );
      if (distance >= this.MOVEMENT_THRESHOLD_METERS) {
        shouldEmit = true;
      } else if (now - this.lastEmittedTimestamp >= this.TIME_THRESHOLD_MS) {
        shouldEmit = true;
      }
    }

    if (shouldEmit && this.activeTripId && this.currentUser) {
      this.lastEmittedCoords = coords;
      this.lastEmittedTimestamp = now;

      const payload: ILocationSnapshot = {
        tripId: this.activeTripId,
        userId: this.currentUser.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        timestamp: new Date().toISOString(),
      };

      const socket = getSocket();
      if (socket?.connected) {
        socket.emit(SocketEvents.LOCATION_UPDATE, payload);
      }

      // Also update current user in local map
      this.membersMap.set(this.currentUser.id, {
        userId: this.currentUser.id,
        name: this.currentUser.name,
        role: this.userRole,
        latitude: coords.latitude,
        longitude: coords.longitude,
        isStale: false,
        isConnected: true,
        lastUpdated: new Date().toISOString(),
        lastSeenTimestamp: now,
      });

      this.notifyPackUpdate();
    }
  }

  /**
   * Register Socket.IO listeners for room updates.
   */
  private registerSocketListeners(socket: any, tripId: string): void {
    // Initial pack state on join
    socket.on(SocketEvents.PACK_STATE, (state: IPackStatusSummary) => {
      if (state.members) {
        for (const m of state.members) {
          this.membersMap.set(m.userId, m);
        }
        this.notifyPackUpdate();
      }
    });

    // Real-time location update of a pack member
    socket.on(SocketEvents.LOCATION_UPDATED, (member: IMemberLocationState) => {
      if (member && member.userId) {
        this.membersMap.set(member.userId, member);
        this.notifyPackUpdate();
      }
    });

    // Pack separation warning alert
    socket.on(SocketEvents.PACK_ALERT, (alert: any) => {
      this.notifyAlert(alert);
    });

    // Stale location notifications
    socket.on(SocketEvents.LOCATION_STALE, () => {
      const now = Date.now();
      this.membersMap.forEach((m) => {
        if (now - m.lastSeenTimestamp > 120000) {
          m.isStale = true;
        }
      });
      this.notifyPackUpdate();
    });
  }

  private removeSocketListeners(socket: any): void {
    socket.off(SocketEvents.PACK_STATE);
    socket.off(SocketEvents.LOCATION_UPDATED);
    socket.off(SocketEvents.PACK_ALERT);
    socket.off(SocketEvents.LOCATION_STALE);
  }

  private notifyPackUpdate(): void {
    const summary = this.getCurrentPackSummary();
    this.packUpdateListeners.forEach((listener) => {
      try {
        listener(summary);
      } catch (err) {
        console.warn('[PackTracker] Listener error:', err);
      }
    });
  }

  private notifyAlert(alert: { message: string; type: string }): void {
    this.alertListeners.forEach((listener) => {
      try {
        listener(alert);
      } catch (err) {
        console.warn('[PackTracker] Alert listener error:', err);
      }
    });
  }

  private calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  }
}

export const packTrackingService = new PackTrackingService();
