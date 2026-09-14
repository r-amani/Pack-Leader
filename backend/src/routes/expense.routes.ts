import { Router } from 'express';
import { expenseController } from '../controllers/expense.controller';
import { requireAuth } from '../middleware/auth';

const router = Router();

// All expense routes require authentication
router.use(requireAuth);

router.post('/', expenseController.createExpense);
router.get('/trip/:tripId', expenseController.getTripExpenses);
router.get('/trip/:tripId/summary', expenseController.getTripExpenseSummary);
router.delete('/:id', expenseController.deleteExpense);

export const expenseRoutes = router;
