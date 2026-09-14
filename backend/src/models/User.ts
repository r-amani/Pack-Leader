import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser, TravelMode } from '@packleader/shared';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  profileImage?: string;
  emergencyContacts: {
    name: string;
    phone: string;
    relationship: string;
  }[];
  preferredTravelMode: TravelMode;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  toUserResponse(): IUser;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmailWithPassword(email: string): Promise<IUserDocument | null>;
}

const emergencyContactSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    profileImage: {
      type: String,
      default: '',
    },
    emergencyContacts: {
      type: [emergencyContactSchema],
      default: [],
    },
    preferredTravelMode: {
      type: String,
      enum: Object.values(TravelMode),
      default: TravelMode.ROAD_TRIP,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Compare candidate password with the stored hashed password.
 */
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

/**
 * Convert user document to the shared IUser format.
 */
userSchema.methods.toUserResponse = function (): IUser {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    profileImage: this.profileImage || undefined,
    emergencyContacts: (this.emergencyContacts || []).map((c: any) => ({
      name: c.name,
      phone: c.phone,
      relationship: c.relationship,
    })),
    preferredTravelMode: this.preferredTravelMode,
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

/**
 * Find user by email including the passwordHash field.
 */
userSchema.statics.findByEmailWithPassword = function (email: string): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() }).select('+passwordHash');
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
