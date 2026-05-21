import { getDB, TransactionEntity } from "./indexeddb";
import { syncQueueRepository } from "../sync/syncQueueRepository";

export const transactionsRepository = {
  async getAll(): Promise<TransactionEntity[]> {
    const db = await getDB();
    const all = await db.getAll("transactions");
    return all.filter((t: TransactionEntity) => !t.isDeleted).sort((a: TransactionEntity, b: TransactionEntity) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async add(transaction: Omit<TransactionEntity, "syncStatus" | "localVersion" | "isDeleted">): Promise<void> {
    const db = await getDB();
    const newTx: TransactionEntity = {
      ...transaction,
      syncStatus: "pending",
      localVersion: 1,
      isDeleted: false,
    };
    
    // Save locally
    await db.put("transactions", newTx);

    // Queue for sync
    await syncQueueRepository.add({
      id: crypto.randomUUID(),
      entityType: "transaction",
      entityId: newTx.id,
      mutationType: "create",
      payload: newTx,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Notify UI of DB change
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:transactions:changed"));
    }
  },

  async update(id: string, updates: Partial<Omit<TransactionEntity, "id" | "syncStatus" | "localVersion" | "remoteVersion" | "isDeleted">>): Promise<void> {
    const db = await getDB();
    const existing = await db.get("transactions", id);
    if (!existing) throw new Error("Transaction not found");

    const updatedTx: TransactionEntity = {
      ...existing,
      ...updates,
      localVersion: existing.localVersion + 1,
      syncStatus: "pending",
    };

    await db.put("transactions", updatedTx);

    await syncQueueRepository.add({
      id: crypto.randomUUID(),
      entityType: "transaction",
      entityId: updatedTx.id,
      mutationType: "update",
      payload: updatedTx,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

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
      localVersion: existing.localVersion + 1,
      syncStatus: "pending",
    };

    await db.put("transactions", deletedTx);

    await syncQueueRepository.add({
      id: crypto.randomUUID(),
      entityType: "transaction",
      entityId: deletedTx.id,
      mutationType: "delete",
      payload: { id: deletedTx.id },
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:transactions:changed"));
    }
  }
};
