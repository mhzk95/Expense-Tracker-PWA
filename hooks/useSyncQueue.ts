"use client";

import { useEffect, useState, useCallback } from "react";
import { syncQueueRepository } from "@/lib/sync/syncQueueRepository";
import { SyncQueueItem } from "@/lib/db/indexeddb";
import { syncEngine } from "@/lib/sync/syncEngine";

export function useSyncQueue() {
  const [items, setItems] = useState<SyncQueueItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQueue = useCallback(async () => {
    try {
      const allItems = await syncQueueRepository.getAllItems();
      // Sort: descending by date (newest first)
      setItems(allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (err) {
      console.error("Error fetching sync queue", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    window.addEventListener("sync:updated", fetchQueue);
    return () => {
      window.removeEventListener("sync:updated", fetchQueue);
    };
  }, [fetchQueue]);

  const pendingItems = items.filter((i) => i.status === "pending" || i.status === "syncing");
  const failedItems = items.filter((i) => i.status === "failed");
  const conflictItems = items.filter((i) => i.status === "conflict");
  const syncedItems = items.filter((i) => i.status === "synced");

  const retryItem = async (id: string) => {
    await syncEngine.retryItem(id);
    fetchQueue();
  };

  const retryAll = async () => {
    await syncEngine.retryAllFailed();
    fetchQueue();
  };

  const clearSynced = async () => {
    await syncQueueRepository.clearSynced();
    fetchQueue();
  };

  const resolveConflict = async (id: string, strategy: "local" | "remote" | "both") => {
    await syncEngine.resolveConflict(id, strategy);
    fetchQueue();
  };

  return {
    items,
    pendingItems,
    failedItems,
    conflictItems,
    syncedItems,
    loading,
    retryItem,
    retryAll,
    clearSynced,
    resolveConflict,
  };
}
