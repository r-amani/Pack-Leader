import { Types } from 'mongoose';
import { Expense, IExpenseDocument } from '../models/Expense';
import { Trip } from '../models/Trip';
import { User } from '../models/User';
import { AppError } from '../middleware/error-handler';
import {
  ICreateExpense,
  IExpense,
  IExpenseSummary,
  IMemberBalance,
  ISettlement,
  ExpenseCategory,
} from '@packleader/shared';

function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export class ExpenseService {
  /**
   * Create a new expense for a trip
   */
  async createExpense(userId: string, data: ICreateExpense): Promise<IExpense> {
    const trip = await Trip.findById(data.tripId);
    if (!trip) {
      throw new AppError('Trip not found', 404);
    }

    const payer = await User.findById(userId);
    if (!payer) {
      throw new AppError('User not found', 404);
    }

    // Resolve participant names
    const participantIds = data.participantIds && data.participantIds.length > 0
      ? data.participantIds
      : [userId];

    const users = await User.find({ _id: { $in: participantIds } }).select('_id name');
    const participants = users.map((u) => ({
      userId: u._id as Types.ObjectId,
      name: u.name,
    }));

    const expense = await Expense.create({
      tripId: new Types.ObjectId(data.tripId),
      paidBy: new Types.ObjectId(userId),
      paidByName: payer.name,
      participants,
      category: data.category || ExpenseCategory.OTHER,
      amount: data.amount,
      currency: data.currency || 'USD',
      description: data.description,
      date: data.date ? new Date(data.date) : new Date(),
    });

    return this.serializeExpense(expense);
  }

  /**
   * List all expenses for a specific trip
   */
  async getTripExpenses(tripId: string): Promise<IExpense[]> {
    const expenses = await Expense.find({ tripId: new Types.ObjectId(tripId) }).sort({ date: -1 });
    return expenses.map((e) => this.serializeExpense(e));
  }

  /**
   * Delete an expense (only payer or trip leader can delete)
   */
  async deleteExpense(expenseId: string, userId: string): Promise<void> {
    const expense = await Expense.findById(expenseId);
    if (!expense) {
      throw new AppError('Expense not found', 404);
    }

    const trip = await Trip.findById(expense.tripId);
    const isPayer = expense.paidBy.toString() === userId;
    const isLeader = trip?.members.some(
      (m) => (m.userId?.toString() === userId || (m as any).user?.toString() === userId) && m.role === 'leader'
    );

    if (!isPayer && !isLeader) {
      throw new AppError('Not authorized to delete this expense', 403);
    }

    await Expense.findByIdAndDelete(expenseId);
  }

  /**
   * Compute full financial ledger summary and optimal debt simplification settlements
   */
  async getTripExpenseSummary(tripId: string): Promise<IExpenseSummary> {
    const expenses = await Expense.find({ tripId: new Types.ObjectId(tripId) });
    const trip = await Trip.findById(tripId);

    let totalTripCost = 0;
    const categoryBreakdown: Record<string, number> = {};
    const memberMap: Map<string, { name: string; totalPaid: number; totalOwed: number }> = new Map();

    // Populate all trip members to show complete roster balance
    if (trip) {
      for (const m of trip.members) {
        const uId = (m.userId || (m as any).user)?.toString();
        if (uId && !memberMap.has(uId)) {
          const u = await User.findById(uId).select('name');
          memberMap.set(uId, {
            name: u?.name || 'Rider',
            totalPaid: 0,
            totalOwed: 0,
          });
        }
      }
    }

    for (const exp of expenses) {
      totalTripCost += exp.amount;

      // Category breakdown
      categoryBreakdown[exp.category] = (categoryBreakdown[exp.category] || 0) + exp.amount;

      // Payer balance
      const payerId = exp.paidBy.toString();
      if (!memberMap.has(payerId)) {
        memberMap.set(payerId, { name: exp.paidByName, totalPaid: 0, totalOwed: 0 });
      }
      const payerRec = memberMap.get(payerId)!;
      payerRec.totalPaid += exp.amount;

      // Participants share
      const partCount = exp.participants.length || 1;
      const share = exp.amount / partCount;

      for (const p of exp.participants) {
        const pId = p.userId.toString();
        if (!memberMap.has(pId)) {
          memberMap.set(pId, { name: p.name, totalPaid: 0, totalOwed: 0 });
        }
        const pRec = memberMap.get(pId)!;
        pRec.totalOwed += share;
      }
    }

    // Build member balances
    const memberBalances: IMemberBalance[] = [];
    for (const [userId, rec] of memberMap.entries()) {
      const net = round2(rec.totalPaid - rec.totalOwed);
      memberBalances.push({
        userId,
        name: rec.name,
        totalPaid: round2(rec.totalPaid),
        totalOwed: round2(rec.totalOwed),
        netBalance: net,
      });
    }

    // Solve debt settlements using minimum cash flow greedy algorithm
    const settlements = this.computeSettlements(memberBalances);

    return {
      tripId,
      totalTripCost: round2(totalTripCost),
      currency: expenses[0]?.currency || 'USD',
      categoryBreakdown,
      memberBalances,
      settlements,
    };
  }

  /**
   * Minimum cash flow settlement algorithm
   */
  private computeSettlements(balances: IMemberBalance[]): ISettlement[] {
    const settlements: ISettlement[] = [];

    // Clone balances for mutation
    const debtors: { userId: string; name: string; amount: number }[] = [];
    const creditors: { userId: string; name: string; amount: number }[] = [];

    for (const b of balances) {
      if (b.netBalance < -0.01) {
        debtors.push({ userId: b.userId, name: b.name, amount: -b.netBalance });
      } else if (b.netBalance > 0.01) {
        creditors.push({ userId: b.userId, name: b.name, amount: b.netBalance });
      }
    }

    let dIdx = 0;
    let cIdx = 0;

    while (dIdx < debtors.length && cIdx < creditors.length) {
      const debtor = debtors[dIdx];
      const creditor = creditors[cIdx];

      const settle = Math.min(debtor.amount, creditor.amount);
      settlements.push({
        from: debtor.userId,
        fromName: debtor.name,
        to: creditor.userId,
        toName: creditor.name,
        amount: round2(settle),
      });

      debtor.amount -= settle;
      creditor.amount -= settle;

      if (debtor.amount < 0.01) dIdx++;
      if (creditor.amount < 0.01) cIdx++;
    }

    return settlements;
  }

  private serializeExpense(doc: IExpenseDocument): IExpense {
    return {
      id: doc._id.toString(),
      tripId: doc.tripId.toString(),
      paidBy: doc.paidBy.toString(),
      paidByName: doc.paidByName,
      participants: doc.participants.map((p) => ({
        userId: p.userId.toString(),
        name: p.name,
      })),
      category: doc.category,
      amount: doc.amount,
      currency: doc.currency,
      description: doc.description,
      date: doc.date.toISOString(),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    };
  }
}

export const expenseService = new ExpenseService();
