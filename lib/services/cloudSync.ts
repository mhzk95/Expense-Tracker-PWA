import { getDB, SyncAction } from "@/lib/db/indexeddb";

export async function pullCloudData(entities = "ALL", limit = 500) {
  if (typeof window === "undefined" || !navigator.onLine) return { success: false, error: "Offline" };

  try {
    const db = await getDB();
    const cursorKey = `et_sync_cursor_${entities}`;
    const lastCursor = localStorage.getItem(cursorKey) || "";

    const url = new URL("/api/sync", window.location.origin);
    if (lastCursor) url.searchParams.append("cursor", lastCursor);
    url.searchParams.append("limit", limit.toString());
    url.searchParams.append("entities", entities);

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      if (res.status === 401) throw new Error("unauthorized");
      throw new Error(`Cloud pull failed: ${res.statusText}`);
    }

    const { data, hasMore, nextCursor, success } = await res.json();
    if (!success) throw new Error("Pull returned false success");

    const storesToUpdate = Object.keys(data);
    if (storesToUpdate.length > 0) {
      const tx = db.transaction(storesToUpdate as any, "readwrite");

      for (const storeName of storesToUpdate) {
        const store = tx.objectStore(storeName as any);
        const items = data[storeName] || [];
        for (const item of items) {
          if (item.date) item.date = typeof item.date === 'string' ? item.date : new Date(item.date).toISOString();
          if (item.startDate) item.startDate = typeof item.startDate === 'string' ? item.startDate : new Date(item.startDate).toISOString();
          if (item.createdAt) item.createdAt = typeof item.createdAt === 'string' ? item.createdAt : new Date(item.createdAt).toISOString();
          if (item.updatedAt) item.updatedAt = typeof item.updatedAt === 'string' ? item.updatedAt : new Date(item.updatedAt).toISOString();
          if (item.dueDate) item.dueDate = typeof item.dueDate === 'string' ? item.dueDate : new Date(item.dueDate).toISOString();
          await store.put(item);
        }
      }

      await tx.done;

      // Notify the UI
      if (storesToUpdate.includes("transactions")) window.dispatchEvent(new CustomEvent("db:transactions:changed", { detail: { fromSync: true } }));
      if (storesToUpdate.includes("accounts")) window.dispatchEvent(new CustomEvent("db:accounts:changed", { detail: { fromSync: true } }));
      if (storesToUpdate.includes("categories")) window.dispatchEvent(new CustomEvent("db:categories:changed", { detail: { fromSync: true } }));
      if (storesToUpdate.includes("journalEntries")) window.dispatchEvent(new CustomEvent("db:journal:changed", { detail: { fromSync: true } }));
      if (storesToUpdate.includes("vaultEntries")) window.dispatchEvent(new CustomEvent("db:vault:changed", { detail: { fromSync: true } }));
      if (storesToUpdate.includes("reminders")) window.dispatchEvent(new CustomEvent("db:reminders:changed", { detail: { fromSync: true } }));
      if (storesToUpdate.includes("researchTopics") || storesToUpdate.includes("savedItems")) {
        window.dispatchEvent(new CustomEvent("db:research:changed", { detail: { fromSync: true } }));
      }
      window.dispatchEvent(new CustomEvent("sync:updated", { detail: { fromSync: true } }));
    }

    if (nextCursor) {
      localStorage.setItem(cursorKey, nextCursor);
    }

    // Recursively pull more if there is more data
    if (hasMore) {
      console.log(`[Pull] More data available for ${entities}, pulling next chunk...`);
      setTimeout(() => pullCloudData(entities, limit), 500);
    } else {
      console.log(`[Pull] Sync complete for ${entities}.`);
    }

    return { success: true, hasMore };
  } catch (error: any) {
    console.error("Pull Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Background worker function that drains the sync_queue.
 */
export async function drainSyncQueue() {
  if (typeof window === "undefined" || !navigator.onLine) return { success: false, error: "Offline" };

  try {
    const db = await getDB();
    const allActions = await db.getAll("sync_queue");
    const pendingActions = allActions.filter((a: SyncAction) => a.status === "pending" || a.status === "failed");

    if (pendingActions.length === 0) return { success: true, processed: 0 };

    // Sort by timestamp
    pendingActions.sort((a: SyncAction, b: SyncAction) => a.timestamp - b.timestamp);

    // Process in small batches
    const BATCH_SIZE = 10;
    const batch = pendingActions.slice(0, BATCH_SIZE);

    // Pre-process UPLOAD_MEDIA or blobs within payload
    for (const action of batch) {
      if (action.entity === "JOURNAL" && action.payload) {
        let updated = false;

        // Process photos
        if (Array.isArray(action.payload.photoUrls)) {
          for (let i = 0; i < action.payload.photoUrls.length; i++) {
            const url = action.payload.photoUrls[i];
            if (url instanceof Blob || (typeof url === 'string' && url.startsWith("data:image"))) {
              const formData = new FormData();
              const blob = url instanceof Blob ? url : await fetch(url).then(r => r.blob());
              formData.append("file", blob);
              
              try {
                const upRes = await fetch("/api/upload", { method: "POST", body: formData });
                if (upRes.ok) {
                  const { file_id } = await upRes.json();
                  if (file_id) {
                    action.payload.photoUrls[i] = `telegram:${file_id}`;
                    updated = true;
                  }
                }
              } catch (e) {
                console.error("Failed to upload photo to telegram CDN", e);
              }
            }
          }
        }

        // Process audio
        if (action.payload.audioFileId instanceof Blob) {
          const formData = new FormData();
          formData.append("file", action.payload.audioFileId, "journal-audio.webm");
          formData.append("filename", "journal-audio.webm");
          try {
            const upRes = await fetch("/api/upload", { method: "POST", body: formData });
            if (upRes.ok) {
              const { file_id } = await upRes.json();
              if (file_id) {
                action.payload.audioFileId = `telegram:${file_id}`;
                updated = true;
              }
            }
          } catch (e) {
            console.error("Failed to upload audio to telegram CDN", e);
          }
        }

        if (updated) {
          // Save updated payload back to queue in case the push fails
          await db.put("sync_queue", action);
        }
      }
    }

    // Push the batch to the new Action Processor
    const res = await fetch("/api/sync/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actions: batch }),
    });

    if (!res.ok) {
      throw new Error(`Action sync failed: ${res.statusText}`);
    }

    // Actions processed successfully. Delete them from the queue.
    const tx = db.transaction("sync_queue", "readwrite");
    const store = tx.objectStore("sync_queue");
    for (const action of batch) {
      await store.delete(action.id);
    }
    await tx.done;

    // If there are more items pending, drain them recursively
    if (pendingActions.length > BATCH_SIZE) {
      console.log(`[AutoSync] Processed batch of ${BATCH_SIZE}, more pending...`);
      setTimeout(() => drainSyncQueue(), 500);
    }

    return { success: true, processed: batch.length };

  } catch (error: any) {
    console.error("Drain Queue Error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Convenience wrapper for manual sync operations
 */
export async function syncWithCloud() {
  const drainRes = await drainSyncQueue();
  if (!drainRes.success) return drainRes;
  
  return await pullCloudData("ALL", 500);
}

