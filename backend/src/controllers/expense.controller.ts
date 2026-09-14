import { Request, Response } from 'express';
import { expenseService } from '../services/expense.service';
import { asyncHandler, AppError } from '../middleware/error-handler';
import { AuthenticatedRequest } from '../middleware/auth';
import { sendSuccess } from '../utils/api-response';

export class ExpenseController {
  createExpense = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { tripId, category, amount, currency, description, date, participantIds } = req.body;

    if (!tripId || amount === undefined || !description) {
      throw new AppError('tripId, amount, and description are required', 400);
    }

    if (amount <= 0) {
      throw new AppError('Expense amount must be positive', 400);
    }

    const expense = await expenseService.createExpense(req.user.id, {
      tripId,
      category,
      amount: Number(amount),
      currency,
      description,
      date: date || new Date().toISOString(),
      participantIds: participantIds || [],
    });

    sendSuccess(res, expense, 'Expense created successfully', 201);
  });

  getTripExpenses = asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    if (!tripId) {
      throw new AppError('Trip ID is required', 400);
    }

    const expenses = await expenseService.getTripExpenses(tripId);
    sendSuccess(res, expenses);
  });

  getTripExpenseSummary = asyncHandler(async (req: Request, res: Response) => {
    const { tripId } = req.params;
    if (!tripId) {
      throw new AppError('Trip ID is required', 400);
    }

    const summary = await expenseService.getTripExpenseSummary(tripId);
    sendSuccess(res, summary);
  });

  deleteExpense = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user?.id) {
      throw new AppError('Authentication required', 401);
    }

    const { id } = req.params;
    if (!id) {
      throw new AppError('Expense ID is required', 400);
    }

    await expenseService.deleteExpense(id, req.user.id);
    sendSuccess(res, { message: 'Expense deleted successfully' });
  });
}

export const expenseController = new ExpenseController();
