import { syncQueueRepository } from "./syncQueueRepository";
import { mockApiClient } from "@/lib/mock-api/client";
import { getDB, SyncQueueItem } from "@/lib/db/indexeddb";
import { getDropboxToken, uploadBackupToDropbox } from "@/lib/services/dropbox";

class SyncEngine {
  private isSyncing = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private isPaused = false;

  public async start() {
    if (this.isSyncing || this.isPaused || !navigator.onLine) return;
    this.isSyncing = true;
    window.dispatchEvent(new Event("sync:start"));

    try {
      const pendingItems = await syncQueueRepository.getPendingItems();
      for (const item of pendingItems) {
        if (!navigator.onLine || this.isPaused) break;
        await this.processItem(item);
      }
    } catch (err) {
      console.error("Sync Engine Error:", err);
    } finally {
      this.isSyncing = false;
      window.dispatchEvent(new Event("sync:end"));
      
      // Auto-backup to Dropbox if token is available
      if (getDropboxToken()) {
        uploadBackupToDropbox().catch(err => console.error("Auto-backup failed", err));
      }
    }
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    this.isPaused = false;
    this.start();
  }

  public async retryItem(id: string) {
    const item = await syncQueueRepository.getById(id);
    if (item && (item.status === "failed" || item.status === "conflict")) {
      await syncQueueRepository.updateStatus(id, "pending", { retryCount: item.retryCount + 1 });
      this.start();
    }
  }

  public async retryAllFailed() {
    const failedItems = await syncQueueRepository.getFailedItems();
    for (const item of failedItems) {
      await syncQueueRepository.updateStatus(item.id, "pending", { retryCount: 0 });
    }
    this.start();
  }

  public async resolveConflict(itemId: string, strategy: "local" | "remote" | "both") {
    const item = await syncQueueRepository.getById(itemId);
    if (!item || item.status !== "conflict") return;
    const db = await getDB();

    if (strategy === "local") {
      // Re-queue it with a force flag or just put it to pending
      await syncQueueRepository.updateStatus(itemId, "pending", {
        retryCount: 0,
        payload: { ...item.payload, force: true, simulateConflict: false }, // remove simulate flag
        conflictData: null,
      });
      this.start();
    } else if (strategy === "remote") {
      // Apply remote data to local DB
      if (item.entityType === "transaction" && item.conflictData) {
        await db.put("transactions", {
          ...item.conflictData,
          syncStatus: "synced",
        });
      }
      await syncQueueRepository.updateStatus(itemId, "synced", {
        conflictData: null,
        syncedAt: new Date().toISOString(),
      });
      window.dispatchEvent(new Event("sync:updated"));
    } else if (strategy === "both") {
      // Create a duplicate locally based on local data, let remote stay
      if (item.entityType === "transaction") {
        const newId = crypto.randomUUID();
        await db.put("transactions", {
          ...item.payload,
          id: newId,
          syncStatus: "pending",
        });
        
        // Save the remote version as the original one
        if (item.conflictData) {
          await db.put("transactions", {
            ...item.conflictData,
            syncStatus: "synced",
          });
        }
        
        // Add a new queue item for the duplicate
        await syncQueueRepository.add({
          id: crypto.randomUUID(),
          entityId: newId,
          entityType: item.entityType,
          mutationType: "create",
          payload: { ...item.payload, id: newId },
          status: "pending",
          retryCount: 0,
          maxRetries: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        // Mark original queue item as synced (because we accepted remote as canonical for that ID)
        await syncQueueRepository.updateStatus(itemId, "synced", {
          conflictData: null,
          syncedAt: new Date().toISOString(),
        });
      }
      window.dispatchEvent(new Event("sync:updated"));
      this.start();
    }
  }

  private async processItem(item: SyncQueueItem) {
    if (item.retryCount >= item.maxRetries) {
      await syncQueueRepository.updateStatus(item.id, "failed", {
        errorMessage: "Max retries exceeded",
      });
      this.updateEntitySyncStatus(item.entityType, item.entityId, "failed");
      return;
    }

    await syncQueueRepository.updateStatus(item.id, "syncing", {
      lastAttemptAt: new Date().toISOString(),
    });

    try {
      const response = await mockApiClient.processMutation(item);

      if (response.success) {
        await syncQueueRepository.updateStatus(item.id, "synced", {
          syncedAt: new Date().toISOString(),
          errorMessage: null,
        });
        await this.updateEntitySyncStatus(item.entityType, item.entityId, "synced", response.serverVersion);
      } else if (response.conflict) {
        await syncQueueRepository.updateStatus(item.id, "conflict", {
          conflictData: response.remoteData,
          errorMessage: "Version conflict",
        });
        await this.updateEntitySyncStatus(item.entityType, item.entityId, "conflict");
      } else {
        await syncQueueRepository.updateStatus(item.id, "failed", {
          errorMessage: response.error,
          retryCount: item.retryCount + 1,
        });
        await this.updateEntitySyncStatus(item.entityType, item.entityId, "failed");
      }
    } catch (error: any) {
      await syncQueueRepository.updateStatus(item.id, "failed", {
        errorMessage: error.message || "Network error",
        retryCount: item.retryCount + 1,
      });
      await this.updateEntitySyncStatus(item.entityType, item.entityId, "failed");
    }
    window.dispatchEvent(new Event("sync:updated"));
  }

  private async updateEntitySyncStatus(entityType: string, entityId: string, status: "synced" | "failed" | "conflict", remoteVersion?: number) {
    if (entityType === "transaction") {
      const db = await getDB();
      const tx = await db.get("transactions", entityId);
      if (tx) {
        tx.syncStatus = status;
        if (remoteVersion !== undefined) {
          tx.remoteVersion = remoteVersion;
        }
        await db.put("transactions", tx);
      }
    }
  }

  public getIsSyncing() {
    return this.isSyncing;
  }
}

export const syncEngine = new SyncEngine();
