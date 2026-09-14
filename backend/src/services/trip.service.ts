import { Types } from 'mongoose';
import {
  ICreateTrip,
  ITrip,
  TravelMode,
  TripStatus,
  UserRole,
} from '@packleader/shared';
import { Trip } from '../models/Trip';
import { AppError } from '../middleware/error-handler';

export class TripService {
  /**
   * Create a new trip with the creator assigned as the initial Pack Leader.
   */
  async createTrip(userId: string, userName: string, data: ICreateTrip): Promise<ITrip> {
    const inviteCode = await Trip.generateUniqueInviteCode();

    const leaderMember = {
      userId: new Types.ObjectId(userId),
      name: userName,
      role: UserRole.LEADER,
      joinedAt: new Date(),
      isActive: true,
    };

    const trip = await Trip.create({
      name: data.name.trim(),
      leader: new Types.ObjectId(userId),
      members: [leaderMember],
      travelMode: data.travelMode || TravelMode.ROAD_TRIP,
      origin: {
        coordinates: {
          latitude: data.origin?.coordinates?.latitude ?? 0,
          longitude: data.origin?.coordinates?.longitude ?? 0,
        },
        address: data.origin?.address || '',
        name: data.origin?.name || '',
      },
      destination: {
        coordinates: {
          latitude: data.destination?.coordinates?.latitude ?? 0,
          longitude: data.destination?.coordinates?.longitude ?? 0,
        },
        address: data.destination?.address || '',
        name: data.destination?.name || '',
      },
      status: TripStatus.PLANNED,
      inviteCode,
      scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
      scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
    });

    return trip.toTripResponse();
  }

  /**
   * Get all trips that the specified user is a member of.
   */
  async getUserTrips(userId: string): Promise<ITrip[]> {
    const trips = await Trip.find({
      'members.userId': new Types.ObjectId(userId),
    }).sort({ updatedAt: -1 });

    return trips.map((t) => t.toTripResponse());
  }

  /**
   * Get a single trip by ID, verifying that the user belongs to the trip.
   */
  async getTripById(tripId: string, userId: string): Promise<ITrip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new AppError('Invalid trip ID format', 400);
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    if (!trip.isMember(userId)) {
      throw new AppError('Access denied. You are not a member of this trip.', 403);
    }

    return trip.toTripResponse();
  }

  /**
   * Join a trip using a 6-character invite code.
   */
  async joinTripByInviteCode(userId: string, userName: string, code: string): Promise<ITrip> {
    const cleanCode = code.toUpperCase().trim();
    const trip = await Trip.findByInviteCode(cleanCode);

    if (!trip) {
      throw new AppError('Invalid invite code. No trip found matching this code.', 404);
    }

    // Already a member? Return trip idempotently
    if (trip.isMember(userId)) {
      return trip.toTripResponse();
    }

    trip.members.push({
      userId: new Types.ObjectId(userId),
      name: userName,
      role: UserRole.MEMBER,
      joinedAt: new Date(),
      isActive: true,
    });

    await trip.save();
    return trip.toTripResponse();
  }

  /**
   * Update the status of a trip (e.g., start or complete).
   * Only the Pack Leader can perform this action.
   */
  async updateTripStatus(tripId: string, userId: string, status: TripStatus): Promise<ITrip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new AppError('Invalid trip ID format', 400);
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    if (!trip.isLeader(userId)) {
      throw new AppError('Only the Pack Leader can change the trip status', 403);
    }

    trip.status = status;

    if (status === TripStatus.ACTIVE && !trip.actualStart) {
      trip.actualStart = new Date();
    } else if (status === TripStatus.COMPLETED && !trip.actualEnd) {
      trip.actualEnd = new Date();
    }

    await trip.save();
    return trip.toTripResponse();
  }

  /**
   * Update a member's role within a trip (e.g. designate as Sweeper or Navigator).
   * Only the Pack Leader can perform this action.
   */
  async updateMemberRole(
    tripId: string,
    leaderId: string,
    targetUserId: string,
    newRole: UserRole
  ): Promise<ITrip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new AppError('Invalid trip ID format', 400);
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    if (!trip.isLeader(leaderId)) {
      throw new AppError('Only the Pack Leader can assign member roles', 403);
    }

    const member = trip.members.find(
      (m) => m.userId.toString() === targetUserId.toString()
    );

    if (!member) {
      throw new AppError('Member not found in this trip', 404);
    }

    member.role = newRole;
    await trip.save();

    return trip.toTripResponse();
  }

  /**
   * Remove a member from a trip, or allow a member to leave.
   */
  async removeMember(
    tripId: string,
    requestingUserId: string,
    targetUserId: string
  ): Promise<ITrip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new AppError('Invalid trip ID format', 400);
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    const isSelfLeaving = requestingUserId.toString() === targetUserId.toString();
    const isLeader = trip.isLeader(requestingUserId);

    if (!isSelfLeaving && !isLeader) {
      throw new AppError('Only the Pack Leader can remove other members from the trip', 403);
    }

    if (trip.isLeader(targetUserId)) {
      throw new AppError(
        'The Pack Leader cannot leave the trip. You must transfer leadership or delete the trip.',
        400
      );
    }

    trip.members = trip.members.filter(
      (m) => m.userId.toString() !== targetUserId.toString()
    );

    await trip.save();
    return trip.toTripResponse();
  }

  /**
   * Update trip details (name, travelMode, origin, destination, schedule).
   * Only the Pack Leader can perform this action.
   */
  async updateTrip(tripId: string, userId: string, data: Partial<ICreateTrip>): Promise<ITrip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new AppError('Invalid trip ID format', 400);
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    if (!trip.isLeader(userId)) {
      throw new AppError('Only the Pack Leader can update trip details', 403);
    }

    if (data.name !== undefined) trip.name = data.name.trim();
    if (data.travelMode !== undefined) trip.travelMode = data.travelMode;
    if (data.origin !== undefined) {
      trip.origin = {
        name: data.origin.name || trip.origin.name,
        address: data.origin.address || trip.origin.address,
        coordinates: data.origin.coordinates || trip.origin.coordinates,
      };
    }
    if (data.destination !== undefined) {
      trip.destination = {
        name: data.destination.name || trip.destination.name,
        address: data.destination.address || trip.destination.address,
        coordinates: data.destination.coordinates || trip.destination.coordinates,
      };
    }
    if (data.scheduledStart !== undefined) {
      trip.scheduledStart = data.scheduledStart ? new Date(data.scheduledStart) : undefined;
    }
    if (data.scheduledEnd !== undefined) {
      trip.scheduledEnd = data.scheduledEnd ? new Date(data.scheduledEnd) : undefined;
    }

    await trip.save();
    return trip.toTripResponse();
  }

  /**
   * Delete a trip. Only the Pack Leader can delete the trip.
   */
  async deleteTrip(tripId: string, userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new AppError('Invalid trip ID format', 400);
    }

    const trip = await Trip.findById(tripId);
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    if (!trip.isLeader(userId)) {
      throw new AppError('Only the Pack Leader can delete this trip', 403);
    }

    await Trip.findByIdAndDelete(tripId);
  }
}

export const tripService = new TripService();
