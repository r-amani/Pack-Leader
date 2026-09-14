import { ExpenseCategory } from '../constants/expense-categories';

/**
 * A participant's share in an expense.
 */
export interface IExpenseParticipant {
  userId: string;
  name: string;
}

/**
 * Core expense interface.
 */
export interface IExpense {
  id: string;
  tripId: string;
  /** User who paid */
  paidBy: string;
  paidByName: string;
  /** Users who share this expense */
  participants: IExpenseParticipant[];
  category: ExpenseCategory;
  amount: number;
  currency: string;
  description: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Payload for creating an expense.
 */
export interface ICreateExpense {
  tripId: string;
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  description: string;
  date: string;
  participantIds: string[];
}

/**
 * Per-member balance summary for a trip.
 */
export interface IMemberBalance {
  userId: string;
  name: string;
  totalPaid: number;
  totalOwed: number;
  netBalance: number;
}

/**
 * A suggested payment to settle balances.
 */
export interface ISettlement {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  amount: number;
}

/**
 * Full trip financial ledger summary including debt simplification.
 */
export interface IExpenseSummary {
  tripId: string;
  totalTripCost: number;
  currency: string;
  categoryBreakdown: Record<string, number>;
  memberBalances: IMemberBalance[];
  settlements: ISettlement[];
}
