import { getDB, SyncQueueItem } from "@/lib/db/indexeddb";

export const syncQueueRepository = {
  async add(item: SyncQueueItem): Promise<void> {
    const db = await getDB();
    await db.put("syncQueue", item);
  },

  async getPendingItems(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    const items = await db.getAllFromIndex("syncQueue", "by-status", "pending");
    return items.sort((a: SyncQueueItem, b: SyncQueueItem) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  async getFailedItems(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    return db.getAllFromIndex("syncQueue", "by-status", "failed");
  },

  async getConflictItems(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    return db.getAllFromIndex("syncQueue", "by-status", "conflict");
  },

  async getAllItems(): Promise<SyncQueueItem[]> {
    const db = await getDB();
    return db.getAll("syncQueue");
  },

  async updateStatus(
    id: string, 
    status: SyncQueueItem["status"], 
    updates?: Partial<SyncQueueItem>
  ): Promise<void> {
    const db = await getDB();
    const item = await db.get("syncQueue", id);
    if (!item) return;

    const updatedItem = {
      ...item,
      ...updates,
      status,
      updatedAt: new Date().toISOString(),
    };
    await db.put("syncQueue", updatedItem);
  },

  async clearSynced(): Promise<void> {
    const db = await getDB();
    const items = await db.getAllFromIndex("syncQueue", "by-status", "synced");
    const tx = db.transaction("syncQueue", "readwrite");
    for (const item of items) {
      tx.store.delete(item.id);
    }
    await tx.done;
  },

  async getById(id: string): Promise<SyncQueueItem | undefined> {
    const db = await getDB();
    return db.get("syncQueue", id);
  }
};
