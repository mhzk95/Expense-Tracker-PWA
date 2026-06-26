"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { drainSyncQueue, pullCloudData } from "@/lib/services/cloudSync";

export function useAutoSync() {
  const { data: session } = useSession();
  const syncTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastFocusSync = useRef<number>(0);
  const hasRunInitialSync = useRef<boolean>(false);

  useEffect(() => {
    // Only auto-sync if the user is authenticated
    if (!session) return;

    // Debounced function to drain sync queue and conditionally pull updates if 24h passed
    const triggerPush = (e?: Event) => {
      // Prevent sync loops if the event was dispatched by our own syncWithCloud function
      if (e instanceof CustomEvent && e.detail?.fromSync) {
        return;
      }

      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      
      syncTimeout.current = setTimeout(async () => {
        try {
          console.log("[AutoSync] Draining action queue...");
          await drainSyncQueue();
          
          // Throttled pull check (once per 24 hours)
          const lastFullPull = localStorage.getItem("et_last_full_pull_time");
          const now = Date.now();
          if (!lastFullPull || now - parseInt(lastFullPull, 10) > 24 * 60 * 60 * 1000) {
            console.log("[AutoSync] Throttled pull (daily check elapsed). Pulling latest data...");
            const res = await pullCloudData("ALL", 500);
            if (res.success) {
              localStorage.setItem("et_last_full_pull_time", now.toString());
              localStorage.setItem("et_last_cloud_sync", now.toString());
            }
          }
        } catch (error) {
          console.error("[AutoSync] Push/Pull Failed:", error);
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
      window.addEventListener(event, triggerPush);
    });

    // 2. Sync on app regaining focus (throttled to max once per minute)
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastFocusSync.current > 60000) {
        lastFocusSync.current = now;
        triggerPush();
      }
    };
    window.addEventListener("focus", handleFocus);

    // 3. Sync on coming back online
    const handleOnline = () => triggerPush();
    window.addEventListener("online", handleOnline);

    // Initial prioritized sync on app load (Run only once)
    const doInitialSync = async () => {
      if (hasRunInitialSync.current) return;
      hasRunInitialSync.current = true;

      try {
        const lastPriorityPull = localStorage.getItem("et_last_priority_pull_time");
        const now = Date.now();
        
        if (!lastPriorityPull || now - parseInt(lastPriorityPull, 10) > 24 * 60 * 60 * 1000) {
          console.log("[AutoSync] Daily priority pull (metadata)...");
          const res = await pullCloudData("accounts,categories,budgets,reminders", 1000);
          if (res.success) {
            localStorage.setItem("et_last_priority_pull_time", now.toString());
          }
        }
        
        // Trigger queue drain
        triggerPush();
      } catch (e) {
        console.error("Initial sync failed", e);
      }
    };
    
    doInitialSync();

    return () => {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      mutationEvents.forEach(event => {
        window.removeEventListener(event, triggerPush);
      });
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("online", handleOnline);
    };
  }, [session]);
}
