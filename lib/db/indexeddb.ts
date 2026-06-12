import { openDB, DBSchema, IDBPDatabase } from 'idb';

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
  toAccountId?: string;
  status?: string;
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
  isDeleted: boolean;
}

export interface CategoryEntity {
  id: string;
  name: string;
  type: "income" | "expense" | "transfer";
  color?: string;
  icon?: string;
  isDeleted: boolean;
}

export interface JournalEntity {
  id: string;
  date: string; // ISO String
  title?: string;
  content: string;
  tags: string[];
  photoUrls: (string | Blob)[]; // Base64 strings, telegram file_ids, or raw Blobs
  linkedTransactionId?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VaultEntity {
  id: string;
  title: string; // Stored in plain text so we can list them without decrypting everything, or we can encrypt it too. Let's keep title plain text.
  ciphertext: string; // The encrypted notes/passwords
  iv: string; // Initialization vector used for encryption
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchTopicEntity {
  id: string;
  title: string;
  description?: string;
  status: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedItemEntity {
  id: string;
  topicId?: string;
  type: string;
  url?: string;
  title?: string;
  content?: string;
  imageUrl?: string;
  domain?: string;
  ocrText?: string;
  tags: string[];
  isPinned: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderEntity {
  id: string;
  title: string;
  notes?: string;
  priority: string;
  contextTags: string[];
  dueDate?: string;
  isRecurring: boolean;
  recurrence?: string;
  status: string;
  isDeleted: boolean;
  linkedItemId?: string;
  linkedItemType?: string;
  createdAt: string;
  updatedAt: string;
}

interface ExpenseTrackerDB extends DBSchema {
  transactions: {
    key: string;
    value: TransactionEntity;
    indexes: { "by-date": string };
  };
  accounts: {
    key: string;
    value: AccountEntity;
  };
  budgets: {
    key: string;
    value: BudgetEntity;
  };
  categories: {
    key: string;
    value: CategoryEntity;
  };
  journalEntries: {
    key: string;
    value: JournalEntity;
    indexes: { "by-date": string };
  };
  vaultEntries: {
    key: string;
    value: VaultEntity;
  };
  researchTopics: {
    key: string;
    value: ResearchTopicEntity;
  };
  savedItems: {
    key: string;
    value: SavedItemEntity;
  };
  reminders: {
    key: string;
    value: ReminderEntity;
  };
  syncMetadata: {
    key: string;
    value: any;
  };
}

let dbPromise: Promise<IDBPDatabase<ExpenseTrackerDB>> | null = null;

export function getDB() {
  if (typeof window === "undefined") {
    return new Promise<any>(() => {});
  }
  
  if (!dbPromise) {
    dbPromise = openDB<ExpenseTrackerDB>('ExpenseTrackerDB', 8, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
          txStore.createIndex('by-date', 'date');
        }
        
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains('accounts')) {
            db.createObjectStore('accounts', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('budgets')) {
            db.createObjectStore('budgets', { keyPath: 'id' });
          }
        }

        if (oldVersion < 3) {
          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories', { keyPath: 'id' });
          }
        }

        if (oldVersion < 4) {
          if (db.objectStoreNames.contains('syncQueue' as any)) {
            db.deleteObjectStore('syncQueue' as any);
          }
        }

        if (oldVersion < 5) {
          if (!db.objectStoreNames.contains('journalEntries')) {
            const journalStore = db.createObjectStore('journalEntries', { keyPath: 'id' });
            journalStore.createIndex('by-date', 'date');
          }
        }

        if (oldVersion < 6) {
          if (!db.objectStoreNames.contains('vaultEntries')) {
            db.createObjectStore('vaultEntries', { keyPath: 'id' });
          }
        }

        if (oldVersion < 7) {
          if (!db.objectStoreNames.contains('syncMetadata')) {
            db.createObjectStore('syncMetadata');
          }
        }

        if (oldVersion < 8) {
          if (!db.objectStoreNames.contains('researchTopics')) {
            db.createObjectStore('researchTopics', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('savedItems')) {
            db.createObjectStore('savedItems', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('reminders')) {
            db.createObjectStore('reminders', { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}
