import { getDB, AccountEntity } from "./indexeddb";
import { syncQueueRepository } from "../sync/syncQueueRepository";

export const accountsRepository = {
  async getAll(): Promise<AccountEntity[]> {
    const db = await getDB();
    const all = await db.getAll("accounts");
    return all.filter((a: AccountEntity) => !a.isDeleted);
  },

  async add(account: Omit<AccountEntity, "syncStatus" | "localVersion" | "isDeleted">): Promise<void> {
    const db = await getDB();
    const newAcc: AccountEntity = {
      ...account,
      syncStatus: "pending",
      localVersion: 1,
      isDeleted: false,
    };
    
    // Save locally
    await db.put("accounts", newAcc);

    // Queue for sync
    await syncQueueRepository.add({
      id: crypto.randomUUID(),
      entityType: "account",
      entityId: newAcc.id,
      mutationType: "create",
      payload: newAcc,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:accounts:changed"));
    }
  },

  async update(id: string, updates: Partial<Omit<AccountEntity, "id" | "syncStatus" | "localVersion" | "isDeleted">>): Promise<void> {
    const db = await getDB();
    const existing = await db.get("accounts", id);
    if (!existing) throw new Error("Account not found");

    const updatedAcc: AccountEntity = {
      ...existing,
      ...updates,
      localVersion: existing.localVersion + 1,
      syncStatus: "pending",
    };

    await db.put("accounts", updatedAcc);

    await syncQueueRepository.add({
      id: crypto.randomUUID(),
      entityType: "account",
      entityId: updatedAcc.id,
      mutationType: "update",
      payload: updatedAcc,
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:accounts:changed"));
    }
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get("accounts", id);
    if (!existing) return;

    const deletedAcc: AccountEntity = {
      ...existing,
      isDeleted: true,
      localVersion: existing.localVersion + 1,
      syncStatus: "pending",
    };

    await db.put("accounts", deletedAcc);

    await syncQueueRepository.add({
      id: crypto.randomUUID(),
      entityType: "account",
      entityId: deletedAcc.id,
      mutationType: "delete",
      payload: { id: deletedAcc.id },
      status: "pending",
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:accounts:changed"));
    }
  }
};
