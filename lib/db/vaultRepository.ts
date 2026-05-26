import { getDB, VaultEntity } from "./indexeddb";

export const vaultRepository = {
  async getAll(): Promise<VaultEntity[]> {
    const db = await getDB();
    const all = await db.getAll("vaultEntries");
    return all.filter((v: VaultEntity) => !v.isDeleted).sort((a: VaultEntity, b: VaultEntity) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async add(entry: Omit<VaultEntity, "isDeleted" | "createdAt" | "updatedAt">): Promise<void> {
    const db = await getDB();
    const newEntry: VaultEntity = {
      ...entry,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.put("vaultEntries", newEntry);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:vault:changed"));
    }
  },

  async update(id: string, updates: Partial<Omit<VaultEntity, "id" | "isDeleted" | "createdAt" | "updatedAt">>): Promise<void> {
    const db = await getDB();
    const existing = await db.get("vaultEntries", id);
    if (!existing) throw new Error("Vault entry not found");

    const updatedEntry: VaultEntity = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.put("vaultEntries", updatedEntry);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:vault:changed"));
    }
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get("vaultEntries", id);
    if (!existing) return;

    const deletedEntry: VaultEntity = {
      ...existing,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    };

    await db.put("vaultEntries", deletedEntry);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:vault:changed"));
    }
  }
};
