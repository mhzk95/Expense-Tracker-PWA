"use client";

import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useSyncEngine } from "@/hooks/useSyncEngine";
import { Cloud, CheckCircle, AlertTriangle, AlertCircle, RefreshCw } from "lucide-react";

export function SyncSummaryCard() {
  const { pendingItems, failedItems, conflictItems, syncedItems, retryAll } = useSyncQueue();
  const { isSyncing } = useSyncEngine();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Cloud className="w-5 h-5 text-violet-400" />
          Sync Status
        </h2>
        {isSyncing && (
          <span className="text-xs font-medium text-blue-400 flex items-center gap-1 bg-blue-400/10 px-2 py-1 rounded">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
          </span>
        )}
        {failedItems.length > 0 && !isSyncing && (
          <button 
            onClick={retryAll}
            className="text-xs font-medium text-white flex items-center gap-1 bg-violet-600 hover:bg-violet-500 px-3 py-1.5 rounded-lg transition-colors"
          >
            Retry Failed
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <RefreshCw className="w-4 h-4" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold text-white">{pendingItems.length}</p>
        </div>

        <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Failed</span>
          </div>
          <p className="text-2xl font-bold text-white">{failedItems.length}</p>
        </div>

        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-2 text-amber-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Conflicts</span>
          </div>
          <p className="text-2xl font-bold text-white">{conflictItems.length}</p>
        </div>

        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Synced</span>
          </div>
          <p className="text-2xl font-bold text-white">{syncedItems.length}</p>
        </div>
      </div>
    </div>
  );
}
