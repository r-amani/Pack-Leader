import { ICreateExpense, IExpense, IExpenseSummary } from '@packleader/shared';
import { apiClient } from '../config/api';

/**
 * Client service for Trip Expense Ledger and Debt Settlements (Stage 10).
 */
export async function createExpense(payload: ICreateExpense): Promise<IExpense> {
  const res = await apiClient.post('/expenses', payload);
  return res.data?.data as IExpense;
}

export async function fetchTripExpenses(tripId: string): Promise<IExpense[]> {
  const res = await apiClient.get(`/expenses/trip/${tripId}`);
  return (res.data?.data as IExpense[]) || [];
}

export async function fetchTripExpenseSummary(tripId: string): Promise<IExpenseSummary> {
  const res = await apiClient.get(`/expenses/trip/${tripId}/summary`);
  return res.data?.data as IExpenseSummary;
}

export async function deleteExpense(expenseId: string): Promise<void> {
  await apiClient.delete(`/expenses/${expenseId}`);
}
