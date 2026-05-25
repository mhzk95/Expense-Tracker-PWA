import { getDB, TransactionEntity } from "./indexeddb";

export const transactionsRepository = {
  async getAll(): Promise<TransactionEntity[]> {
    const db = await getDB();
    const all = await db.getAll("transactions");
    return all.filter((t: TransactionEntity) => !t.isDeleted).sort((a: TransactionEntity, b: TransactionEntity) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async add(transaction: Omit<TransactionEntity, "isDeleted">): Promise<void> {
    const db = await getDB();
    const newTx: TransactionEntity = {
      ...transaction,
      isDeleted: false,
    };
    
    // Save locally
    await db.put("transactions", newTx);

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

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:transactions:changed"));
    }
  }
};
