/**
 * Core transaction types for the expense tracker.
 */

export type TransactionType = "income" | "expense" | "transfer";

export type TransactionStatus = "completed" | "pending" | "failed" | "cancelled";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  /** ISO 8601 date string */
  date: string;
  description: string;
  categoryId: string;
  accountId: string;
  /** Optional target account for transfers */
  toAccountId?: string;
  status: TransactionStatus;
  tags?: string[];
  notes?: string;
  isRecurring?: boolean;
  recurringId?: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilter {
  type?: TransactionType;
  categoryId?: string;
  accountId?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  status?: TransactionStatus;
  tags?: string[];
  search?: string;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  transactionCount: number;
  period: string;
}
