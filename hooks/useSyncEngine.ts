"use client";

import { useEffect, useState, useCallback } from "react";
import { syncEngine } from "@/lib/sync/syncEngine";

export function useSyncEngine() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  useEffect(() => {
    const handleStart = () => setIsSyncing(true);
    const handleEnd = () => {
      setIsSyncing(false);
      setLastSyncAt(new Date().toISOString());
    };

    window.addEventListener("sync:start", handleStart);
    window.addEventListener("sync:end", handleEnd);

    // Initial check
    setIsSyncing(syncEngine.getIsSyncing());

    return () => {
      window.removeEventListener("sync:start", handleStart);
      window.removeEventListener("sync:end", handleEnd);
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      syncEngine.resume();
    };
    const handleOffline = () => {
      syncEngine.pause();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Trigger initial sync if online
    if (navigator.onLine) {
      syncEngine.start();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const syncNow = useCallback(() => {
    syncEngine.start();
  }, []);

  return {
    isSyncing,
    lastSyncAt,
    syncNow,
  };
}
