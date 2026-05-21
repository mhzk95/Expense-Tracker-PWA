"use client";

import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { Cloud, CloudOff, RefreshCw, AlertTriangle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import { useAppRuntime } from "@/hooks/useAppRuntime";

export function SyncStatusBadge() {
  const { isOnline } = useAppRuntime();
  const { isSyncing } = useSyncEngine();
  const { pendingItems, failedItems, conflictItems } = useSyncQueue();

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-slate-800/50 px-2 py-1 rounded-md">
        <CloudOff className="w-3.5 h-3.5" />
        <span>Offline</span>
      </div>
    );
  }

  if (conflictItems.length > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md animate-pulse">
        <AlertTriangle className="w-3.5 h-3.5" />
        <span>Conflict ({conflictItems.length})</span>
      </div>
    );
  }

  if (failedItems.length > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-md">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Failed ({failedItems.length})</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (pendingItems.length > 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs font-medium text-violet-400 bg-violet-400/10 px-2 py-1 rounded-md">
        <Cloud className="w-3.5 h-3.5" />
        <span>{pendingItems.length} Pending</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
      <Cloud className="w-3.5 h-3.5" />
      <span>Synced</span>
    </div>
  );
}
