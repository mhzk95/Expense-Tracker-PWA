/**
 * Account types for the expense tracker.
 */

export type AccountType =
  | "checking"
  | "savings"
  | "credit_card"
  | "investment"
  | "cash"
  | "loan"
  | "wallet"
  | "other";

export type AccountStatus = "active" | "closed" | "frozen";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  status: AccountStatus;
  /** Bank or institution name */
  institution?: string;
  /** Last four digits for cards */
  lastFour?: string;
  /** Account color for UI theming */
  color?: string;
  icon?: string;
  /** Credit limit (for credit cards) */
  creditLimit?: number;
  /** Interest rate */
  interestRate?: number;
  /** Whether to include in net worth calculations */
  includeInNetWorth: boolean;
  isDefault: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountSummary {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  accountCount: number;
}
