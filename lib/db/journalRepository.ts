import { getDB, JournalEntity } from "./indexeddb";

export const journalRepository = {
  async getAll(): Promise<JournalEntity[]> {
    const db = await getDB();
    const all = await db.getAll("journalEntries");
    return all.filter((j: JournalEntity) => !j.isDeleted).sort((a: JournalEntity, b: JournalEntity) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  async add(entry: Omit<JournalEntity, "isDeleted" | "createdAt" | "updatedAt">): Promise<void> {
    const db = await getDB();
    const newEntry: JournalEntity = {
      ...entry,
      isDeleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    await db.put("journalEntries", newEntry);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:journal:changed"));
    }
  },

  async update(id: string, updates: Partial<Omit<JournalEntity, "id" | "isDeleted" | "createdAt" | "updatedAt">>): Promise<void> {
    const db = await getDB();
    const existing = await db.get("journalEntries", id);
    if (!existing) throw new Error("Journal entry not found");

    const updatedEntry: JournalEntity = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await db.put("journalEntries", updatedEntry);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:journal:changed"));
    }
  },

  async softDelete(id: string): Promise<void> {
    const db = await getDB();
    const existing = await db.get("journalEntries", id);
    if (!existing) return;

    const deletedEntry: JournalEntity = {
      ...existing,
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    };

    await db.put("journalEntries", deletedEntry);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("db:journal:changed"));
    }
  }
};
