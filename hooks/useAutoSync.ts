"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { syncWithCloud } from "@/lib/services/cloudSync";

export function useAutoSync() {
  const { data: session } = useSession();
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only auto-sync if the user is authenticated
    if (!session) return;

    // Debounced sync function (waits 3 seconds after the last change before syncing)
    const triggerSync = (e?: Event) => {
      // Prevent sync loops if the event was dispatched by our own syncWithCloud function
      if (e instanceof CustomEvent && e.detail?.fromSync) {
        return;
      }

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      
      syncTimeout.current = setTimeout(async () => {
        try {
          console.log("[AutoSync] Triggering background sync...");
          await syncWithCloud();
        } catch (error) {
          console.error("[AutoSync] Failed:", error);
        }
      }, 3000);
    };

    // 1. Sync on data mutations
    const mutationEvents = [
      "db:transactions:changed",
      "db:accounts:changed",
      "db:categories:changed",
      "db:journal:changed",
      "db:vault:changed",
    ];

    mutationEvents.forEach(event => {
      window.addEventListener(event, triggerSync);
    });

    // 2. Sync on app regaining focus
    const handleFocus = () => triggerSync();
    window.addEventListener("focus", handleFocus);

    // 3. Sync on coming back online
    const handleOnline = () => triggerSync();
    window.addEventListener("online", handleOnline);

    // Initial sync on app load
    triggerSync();

    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      mutationEvents.forEach(event => {
        window.removeEventListener(event, triggerSync);
      });
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [session]);
}
