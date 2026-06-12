import { getDB } from "@/lib/db/indexeddb";

export async function syncWithCloud() {
  if (typeof window === "undefined") return { success: false, error: "SSR" };

  try {
    const db = await getDB();
    const lastSyncAt = localStorage.getItem("et_last_cloud_sync");

    // Gather all local data
    // In a fully optimized production app, we would only gather items that were mutated since last sync.
    // For this migration phase, pushing everything ensures no data is left behind.
    const allTransactions = await db.getAll("transactions");
    const allAccounts = await db.getAll("accounts");
    const allCategories = await db.getAll("categories");
    const allBudgets = await db.getAll("budgets");
    const allJournalEntries = await db.getAll("journalEntries");
    const allVaultEntries = await db.getAll("vaultEntries");
    
    // Phase 1: Research & Reminders
    const allResearchTopics = await db.getAll("researchTopics");
    const allSavedItems = await db.getAll("savedItems");
    const allReminders = await db.getAll("reminders");

    // Upload pending journal photos to Telegram CDN via /api/upload
    for (const entry of allJournalEntries) {
      let updated = false;
      for (let i = 0; i < entry.photoUrls.length; i++) {
        const url = entry.photoUrls[i];
        if (url instanceof Blob || (typeof url === 'string' && url.startsWith("data:image"))) {
          const formData = new FormData();
          const blob = url instanceof Blob ? url : await fetch(url).then(r => r.blob());
          formData.append("file", blob);
          
          try {
            const upRes = await fetch("/api/upload", { method: "POST", body: formData });
            if (upRes.ok) {
              const { file_id } = await upRes.json();
              if (file_id) {
                entry.photoUrls[i] = `telegram:${file_id}`;
                updated = true;
              }
            }
          } catch (e) {
            console.error("Failed to upload photo to telegram CDN", e);
          }
        }
      }
      if (updated) {
        const tx = db.transaction("journalEntries", "readwrite");
        await tx.objectStore("journalEntries").put(entry);
        await tx.done;
      }
    }

    const payload = {
      lastSyncAt: lastSyncAt || null,
      transactions: allTransactions,
      accounts: allAccounts,
      categories: allCategories,
      budgets: allBudgets,
      journalEntries: allJournalEntries,
      vaultEntries: allVaultEntries,
      researchTopics: allResearchTopics,
      savedItems: allSavedItems,
      reminders: allReminders,
    };

    const res = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error("unauthorized");
      }
      throw new Error(`Cloud sync failed: ${res.statusText}`);
    }

    const { data, timestamp } = await res.json();

    // 2. Pull remote changes and update IndexedDB
    const tx = db.transaction(
      ["transactions", "accounts", "categories", "budgets", "journalEntries", "vaultEntries", "researchTopics", "savedItems", "reminders"],
      "readwrite"
    );

    const updateStore = async (storeName: string, items: any[]) => {
      const store = tx.objectStore(storeName as any);
      for (const item of items) {
        if (item.date) item.date = typeof item.date === 'string' ? item.date : new Date(item.date).toISOString();
        if (item.startDate) item.startDate = typeof item.startDate === 'string' ? item.startDate : new Date(item.startDate).toISOString();
        if (item.createdAt) item.createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toISOString();
        if (item.updatedAt) item.updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : new Date(item.updatedAt).toISOString();
        if (item.dueDate) item.dueDate = typeof item.dueDate === 'string' ? item.dueDate : new Date(item.dueDate).toISOString();
        await store.put(item);
      }
    };

    await updateStore("accounts", data.accounts || []);
    await updateStore("categories", data.categories || []);
    await updateStore("budgets", data.budgets || []);
    await updateStore("transactions", data.transactions || []);
    await updateStore("journalEntries", data.journalEntries || []);
    await updateStore("vaultEntries", data.vaultEntries || []);
    await updateStore("researchTopics", data.researchTopics || []);
    await updateStore("savedItems", data.savedItems || []);
    await updateStore("reminders", data.reminders || []);

    await tx.done;

    // Update timestamp
    localStorage.setItem("et_last_cloud_sync", timestamp);

    const syncEvent = new CustomEvent("db:transactions:changed", { detail: { fromSync: true } });
    
    window.dispatchEvent(syncEvent);
    window.dispatchEvent(new CustomEvent("db:accounts:changed", { detail: { fromSync: true } }));
    window.dispatchEvent(new CustomEvent("db:categories:changed", { detail: { fromSync: true } }));
    window.dispatchEvent(new CustomEvent("db:journal:changed", { detail: { fromSync: true } }));
    window.dispatchEvent(new CustomEvent("db:vault:changed", { detail: { fromSync: true } }));
    window.dispatchEvent(new CustomEvent("db:reminders:changed", { detail: { fromSync: true } }));
    window.dispatchEvent(new CustomEvent("db:research:changed", { detail: { fromSync: true } }));
    window.dispatchEvent(new CustomEvent("sync:updated", { detail: { fromSync: true } })); // For generic updates

    return { success: true };
  } catch (error: any) {
    console.error("Sync Error:", error);
    return { success: false, error: error.message };
  }
}
