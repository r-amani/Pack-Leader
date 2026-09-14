import mongoose, { Document, Schema, Types } from 'mongoose';
import { SOSStatus } from '@packleader/shared';

export interface ISosAlertDocument extends Document {
  userId: Types.ObjectId;
  userName: string;
  tripId: Types.ObjectId;
  latitude: number;
  longitude: number;
  status: SOSStatus;
  message?: string;
  acknowledgedBy?: Types.ObjectId;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sosAlertSchema = new Schema<ISosAlertDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    status: {
      type: String,
      enum: Object.values(SOSStatus),
      default: SOSStatus.ACTIVE,
    },
    message: { type: String, default: 'Emergency SOS beacon activated' },
    acknowledgedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const SosAlert = mongoose.model<ISosAlertDocument>('SosAlert', sosAlertSchema);
