"use client";

/**
 * useNetworkStatus — Tracks online/offline state reactively.
 *
 * Wraps native browser online/offline events and navigator.onLine.
 * Safe for Server Components to import — the hook itself must only
 * be called from Client Components.
 */

import { useEffect, useState } from "react";

export interface NetworkStatus {
  isOnline: boolean;
  /** True if we've ever gone offline in this session */
  wasOffline: boolean;
  /** ISO string of when offline was last detected (null if never) */
  lastOfflineAt: string | null;
  /** ISO string of when online was last restored (null if never went offline) */
  lastOnlineAt: string | null;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    wasOffline: false,
    lastOfflineAt: null,
    lastOnlineAt: null,
  });

  useEffect(() => {
    // Sync with current state on mount
    setStatus((prev) => ({ ...prev, isOnline: navigator.onLine }));

    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: true,
        wasOffline: prev.wasOffline || !prev.isOnline,
        lastOnlineAt: new Date().toISOString(),
      }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        wasOffline: true,
        lastOfflineAt: new Date().toISOString(),
      }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return status;
}
