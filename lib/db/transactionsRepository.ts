import { getDB, TransactionEntity, pushSyncAction } from "./indexeddb";

export const transactionsRepository = {
  async getAll(): Promise<TransactionEntity[]> {
    const db = await getDB();
    const all = await db.getAll("transactions");
    return all.filter((t: TransactionEntity) => !t.isDeleted).sort((a: TransactionEntity, b: TransactionEntity) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async getPaginated(limit: number, offset: number = 0): Promise<TransactionEntity[]> {
    const db = await getDB();
    const tx = db.transaction("transactions", "readonly");
    const index = tx.store.index("by-date");
    let cursor = await index.openCursor(null, "prev");
    
    const results: TransactionEntity[] = [];
    let skipped = 0;
    
    while (cursor && results.length < limit) {
      if (!cursor.value.isDeleted) {
        if (skipped < offset) {
          skipped++;
        } else {
          results.push(cursor.value);
        }
      }
      cursor = await cursor.continue();
    }
    
    return results;
  },

  async add(transaction: Omit<TransactionEntity, "isDeleted">): Promise<void> {
    const db = await getDB();
    const newTx: TransactionEntity = {
      ...transaction,
      isDeleted: false,
    };
    
    // Save locally
    await db.put("transactions", newTx);
    await pushSyncAction("TRANSACTION", "CREATE", newTx);

    // Notify UI of DB change
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:transactions:changed"));
    }
  },

  async update(id: string, updates: Partial<Omit<TransactionEntity, "id" | "isDeleted">>): Promise<void> {
    const db = await getDB();
    const existing = await db.get("transactions", id);
    if (!existing) throw new Error("Transaction not found");

    const updatedTx: TransactionEntity = {
      ...existing,
      ...updates,
    };

    await db.put("transactions", updatedTx);
    await pushSyncAction("TRANSACTION", "UPDATE", updatedTx);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:transactions:changed"));
    }
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get("transactions", id);
    if (!existing) return;

    const deletedTx: TransactionEntity = {
      ...existing,
      isDeleted: true,
    };

    await db.put("transactions", deletedTx);
    await pushSyncAction("TRANSACTION", "DELETE", deletedTx);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:transactions:changed"));
    }
  }
};
