/**
 * Budget types for the expense tracker.
 */

export type BudgetPeriod = "weekly" | "monthly" | "quarterly" | "yearly" | "custom";

export type BudgetStatus = "active" | "paused" | "archived";

export interface Budget {
  id: string;
  name: string;
  categoryId: string;
  /** Budgeted amount for the period */
  amount: number;
  currency: string;
  period: BudgetPeriod;
  /** ISO 8601 start date */
  startDate: string;
  /** ISO 8601 end date (for custom periods) */
  endDate?: string;
  status: BudgetStatus;
  /** Rollover unspent funds to next period */
  rollover: boolean;
  alertThreshold?: number; // percentage (e.g. 80 = alert at 80% spent)
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentUsed: number;
  isOverBudget: boolean;
  isNearLimit: boolean;
  transactionCount: number;
}

export interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  budgetCount: number;
  overBudgetCount: number;
}
