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
  needsReview?: boolean;
  isDeleted: boolean;
  payee?: string;
  location?: string;
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
  excludeFromNetWorth?: boolean;
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
  photoUrls: any[]; // Base64 strings, telegram file_ids, or raw Blobs
  linkedTransactionId?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  // Enrichment fields (all optional — backward compatible)
  mood?: string;           // e.g., "Happy 😊"
  event?: string;          // e.g., "Dinner with friends"
  location?: string;       // JSON string: {lat, lng, place_name, city, country}
  audioFileId?: any;       // Now accepts string or Blob
  audioDurationMs?: number;
  waveformData?: number[]; // amplitude values generated client-side
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

export type ActionType = "CREATE" | "UPDATE" | "DELETE" | "UPLOAD_MEDIA";

export interface SyncAction {
  id: string;
  entity: string; // e.g., 'TRANSACTION', 'JOURNAL', 'ACCOUNT'
  actionType: ActionType;
  payload: any;
  timestamp: number;
  status: "pending" | "syncing" | "failed";
  retryCount: number;
}

export interface ErrorLogEntity {
  id: string;
  timestamp: number;
  feature: string;
  operation: string;
  level: "info" | "warning" | "error";
  message: string;
  details?: string;
  retryCount?: number;
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
  sync_queue: {
    key: string;
    value: SyncAction;
    indexes: { "by-timestamp": number };
  };
  error_logs: {
    key: string;
    value: ErrorLogEntity;
    indexes: { "by-timestamp": number };
  };
}

let dbPromise: Promise<IDBPDatabase<ExpenseTrackerDB>> | null = null;

export function getDB() {
  if (typeof window === "undefined") {
    return new Promise<any>(() => {});
  }
  
  if (!dbPromise) {
    dbPromise = openDB<ExpenseTrackerDB>('ExpenseTrackerDB', 11, {
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
        if (oldVersion < 9) {
          // No new object stores needed — JournalEntity fields are just optional properties.
          // IndexedDB schema is schemaless for object values, so existing entries remain valid.
        }
        if (oldVersion < 10) {
          if (!db.objectStoreNames.contains('sync_queue')) {
            const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
            syncStore.createIndex('by-timestamp', 'timestamp');
          }
        }
        if (oldVersion < 11) {
          if (!db.objectStoreNames.contains('error_logs')) {
            const logStore = db.createObjectStore('error_logs', { keyPath: 'id' });
            logStore.createIndex('by-timestamp', 'timestamp');
          }
        }
      },
    });
  }
  return dbPromise;
}

let imageCacheDbPromise: Promise<IDBPDatabase<any>> | null = null;
export function getImageCacheDB() {
  if (typeof window === "undefined") {
    return new Promise<any>(() => {});
  }
  if (!imageCacheDbPromise) {
    imageCacheDbPromise = openDB('ImageCacheDB', 1, {
      upgrade(db) {
        db.createObjectStore('images');
      }
    });
  }
  return imageCacheDbPromise;
}

/**
 * Pushes an action to the sync_queue for offline-first processing.
 */
export async function pushSyncAction(
  entity: string,
  actionType: ActionType,
  payload: any
): Promise<void> {
  try {
    const db = await getDB();
    if (!db) return;

    const action: SyncAction = {
      id: crypto.randomUUID(),
      entity,
      actionType,
      payload,
      timestamp: Date.now(),
      status: "pending",
      retryCount: 0,
    };

    await db.put('sync_queue', action);
  } catch (err) {
    console.error("Failed to push sync action:", err);
  }
}
