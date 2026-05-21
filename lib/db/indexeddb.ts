import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface SyncQueueItem {
  id: string;
  entityType: "transaction" | "account" | "budget" | "category" | "recurringRule" | "receipt";
  entityId: string;
  mutationType: "create" | "update" | "delete" | string;
  payload: any;
  status: "pending" | "syncing" | "synced" | "failed" | "conflict";
  retryCount: number;
  maxRetries: number;
  errorMessage?: string | null;
  conflictData?: any;
  createdAt: string;
  updatedAt: string;
  lastAttemptAt?: string | null;
  syncedAt?: string | null;
}

export interface TransactionEntity {
  id: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  currency: string;
  date: string;
  description: string;
  note?: string;
  categoryId?: string;
  accountId?: string;
  status?: string;
  syncStatus: "pending" | "synced" | "failed" | "conflict";
  localVersion: number;
  remoteVersion?: number;
  isDeleted: boolean;
}

export interface AccountEntity {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  status: string;
  institution?: string;
  lastFour?: string;
  color?: string;
  icon?: string;
  includeInNetWorth: boolean;
  isDefault: boolean;
  syncStatus: "pending" | "synced" | "failed" | "conflict";
  localVersion: number;
  isDeleted: boolean;
}

export interface BudgetEntity {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  currency: string;
  period: string;
  startDate: string;
  status: string;
  rollover: boolean;
  alertThreshold?: number;
  color?: string;
  syncStatus: "pending" | "synced" | "failed" | "conflict";
  localVersion: number;
  isDeleted: boolean;
}

interface ExpenseTrackerDB extends DBSchema {
  syncQueue: {
    key: string;
    value: SyncQueueItem;
    indexes: { "by-status": string };
  };
  transactions: {
    key: string;
    value: TransactionEntity;
    indexes: { "by-date": string, "by-syncStatus": string };
  };
  accounts: {
    key: string;
    value: AccountEntity;
  };
  budgets: {
    key: string;
    value: BudgetEntity;
  };
}

let dbPromise: Promise<IDBPDatabase<ExpenseTrackerDB>> | null = null;

export function getDB() {
  if (typeof window === "undefined") {
    // Return a dummy promise for SSR
    return new Promise<any>(() => {});
  }
  
  if (!dbPromise) {
    dbPromise = openDB<ExpenseTrackerDB>('ExpenseTrackerDB', 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const syncQueueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncQueueStore.createIndex('by-status', 'status');

          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
          txStore.createIndex('by-syncStatus', 'syncStatus');
        }
        
        if (oldVersion < 2) {
          db.createObjectStore('accounts', { keyPath: 'id' });
          db.createObjectStore('budgets', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}
