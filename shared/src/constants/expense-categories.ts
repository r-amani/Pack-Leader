/**
 * Expense categories for trip cost tracking.
 */
export enum ExpenseCategory {
  FUEL = 'fuel',
  FOOD = 'food',
  ACCOMMODATION = 'accommodation',
  TOLL = 'toll',
  PARKING = 'parking',
  TICKETS = 'tickets',
  OTHER = 'other',
}

/**
 * Display labels for each expense category.
 */
export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FUEL]: 'Fuel',
  [ExpenseCategory.FOOD]: 'Food',
  [ExpenseCategory.ACCOMMODATION]: 'Accommodation',
  [ExpenseCategory.TOLL]: 'Toll',
  [ExpenseCategory.PARKING]: 'Parking',
  [ExpenseCategory.TICKETS]: 'Tickets',
  [ExpenseCategory.OTHER]: 'Other',
};
