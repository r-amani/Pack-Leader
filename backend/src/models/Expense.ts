import mongoose, { Document, Schema, Types } from 'mongoose';
import { ExpenseCategory } from '@packleader/shared';

export interface IExpenseParticipantDoc {
  userId: Types.ObjectId;
  name: string;
}

export interface IExpenseDocument extends Document {
  tripId: Types.ObjectId;
  paidBy: Types.ObjectId;
  paidByName: string;
  participants: IExpenseParticipantDoc[];
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const expenseParticipantSchema = new Schema<IExpenseParticipantDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const expenseSchema = new Schema<IExpenseDocument>(
  {
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip', required: true, index: true },
    paidBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    paidByName: { type: String, required: true },
    participants: { type: [expenseParticipantSchema], required: true, default: [] },
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      default: ExpenseCategory.OTHER,
    },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'USD' },
    description: { type: String, required: true, trim: true },
    date: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

export const Expense = mongoose.model<IExpenseDocument>('Expense', expenseSchema);
