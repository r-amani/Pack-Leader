import mongoose, { Document, Model, Schema, Types } from 'mongoose';
import {
  ITrip,
  ITripMember,
  ILocation,
  TravelMode,
  TripStatus,
  UserRole,
} from '@packleader/shared';

export interface ITripMemberDocument {
  userId: Types.ObjectId;
  name: string;
  role: UserRole;
  joinedAt: Date;
  isActive: boolean;
}

export interface ITripDocument extends Document {
  name: string;
  leader: Types.ObjectId;
  members: ITripMemberDocument[];
  travelMode: TravelMode;
  origin: ILocation;
  destination: ILocation;
  status: TripStatus;
  inviteCode: string;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  actualStart?: Date;
  actualEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
  toTripResponse(): ITrip;
  isMember(userId: string): boolean;
  isLeader(userId: string): boolean;
}

export interface ITripModel extends Model<ITripDocument> {
  generateUniqueInviteCode(): Promise<string>;
  findByInviteCode(code: string): Promise<ITripDocument | null>;
}

const locationSchema = new Schema<ILocation>(
  {
    coordinates: {
      latitude: { type: Number, required: true, default: 0 },
      longitude: { type: Number, required: true, default: 0 },
    },
    address: { type: String, default: '' },
    name: { type: String, default: '' },
  },
  { _id: false }
);

const tripMemberSchema = new Schema<ITripMemberDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.MEMBER,
    },
    joinedAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const tripSchema = new Schema<ITripDocument, ITripModel>(
  {
    name: {
      type: String,
      required: [true, 'Trip name is required'],
      trim: true,
      maxlength: [120, 'Trip name cannot exceed 120 characters'],
    },
    leader: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: {
      type: [tripMemberSchema],
      default: [],
    },
    travelMode: {
      type: String,
      enum: Object.values(TravelMode),
      default: TravelMode.ROAD_TRIP,
    },
    origin: {
      type: locationSchema,
      required: true,
    },
    destination: {
      type: locationSchema,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(TripStatus),
      default: TripStatus.PLANNED,
      index: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    scheduledStart: { type: Date },
    scheduledEnd: { type: Date },
    actualStart: { type: Date },
    actualEnd: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
tripSchema.index({ 'members.userId': 1 });
tripSchema.index({ status: 1, updatedAt: -1 });

/**
 * Format document as the shared ITrip interface.
 */
tripSchema.methods.toTripResponse = function (): ITrip {
  return {
    id: this._id.toString(),
    name: this.name,
    leader: this.leader.toString(),
    members: (this.members || []).map((m: ITripMemberDocument) => ({
      userId: m.userId.toString(),
      name: m.name,
      role: m.role,
      joinedAt: m.joinedAt ? m.joinedAt.toISOString() : new Date().toISOString(),
      isActive: m.isActive,
    })),
    travelMode: this.travelMode,
    origin: {
      coordinates: {
        latitude: this.origin?.coordinates?.latitude ?? 0,
        longitude: this.origin?.coordinates?.longitude ?? 0,
      },
      address: this.origin?.address || '',
      name: this.origin?.name || '',
    },
    destination: {
      coordinates: {
        latitude: this.destination?.coordinates?.latitude ?? 0,
        longitude: this.destination?.coordinates?.longitude ?? 0,
      },
      address: this.destination?.address || '',
      name: this.destination?.name || '',
    },
    status: this.status,
    inviteCode: this.inviteCode,
    scheduledStart: this.scheduledStart ? this.scheduledStart.toISOString() : undefined,
    scheduledEnd: this.scheduledEnd ? this.scheduledEnd.toISOString() : undefined,
    actualStart: this.actualStart ? this.actualStart.toISOString() : undefined,
    actualEnd: this.actualEnd ? this.actualEnd.toISOString() : undefined,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

/**
 * Check if a user is currently a member of this trip.
 */
tripSchema.methods.isMember = function (userId: string): boolean {
  return (this.members || []).some(
    (m: ITripMemberDocument) => m.userId.toString() === userId.toString()
  );
};

/**
 * Check if a user is the leader of this trip.
 */
tripSchema.methods.isLeader = function (userId: string): boolean {
  return this.leader.toString() === userId.toString();
};

/**
 * Generate a unique 6-character uppercase invite code avoiding ambiguous characters.
 */
tripSchema.statics.generateUniqueInviteCode = async function (): Promise<string> {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  let exists = true;

  while (exists) {
    code = '';
    for (let i = 0; i < 6; i++) {
      const idx = Math.floor(Math.random() * chars.length);
      code += chars[idx];
    }
    const found = await this.findOne({ inviteCode: code });
    if (!found) {
      exists = false;
    }
  }

  return code;
};

/**
 * Find trip by invite code (case-insensitive).
 */
tripSchema.statics.findByInviteCode = function (code: string): Promise<ITripDocument | null> {
  return this.findOne({ inviteCode: code.toUpperCase().trim() });
};

export const Trip = mongoose.model<ITripDocument, ITripModel>('Trip', tripSchema);
