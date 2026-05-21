"use client";

import { useSyncQueue } from "@/hooks/useSyncQueue";
import { SyncQueueItem } from "@/lib/db/indexeddb";
import { format } from "date-fns";
import { RefreshCcw, Check, X, AlertTriangle, Play } from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import { useState } from "react";

export function SyncQueueTable() {
  const { items, loading, retryItem, resolveConflict, clearSynced } = useSyncQueue();
  
  if (loading) return <div className="text-slate-400 p-4">Loading queue...</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="flex justify-between p-4 border-b border-slate-800 items-center">
        <h3 className="text-white font-medium">Sync Queue</h3>
        <button onClick={clearSynced} className="text-xs text-slate-400 hover:text-white transition-colors">
          Clear Synced
        </button>
      </div>
      
      {items.length === 0 ? (
        <div className="p-8 text-center text-slate-500">Queue is empty</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Mutation</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Retries</th>
                <th className="px-4 py-3 font-medium">Created At</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3 text-slate-300 capitalize">{item.entityType}</td>
                  <td className="px-4 py-3 text-slate-300 uppercase text-xs">{item.mutationType}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-400">{item.retryCount} / {item.maxRetries}</td>
                  <td className="px-4 py-3 text-slate-400">{format(new Date(item.createdAt), "MMM d, HH:mm")}</td>
                  <td className="px-4 py-3 text-right">
                    {item.status === "failed" && (
                      <button onClick={() => retryItem(item.id)} className="p-1.5 text-blue-400 hover:bg-blue-400/10 rounded">
                        <RefreshCcw className="w-4 h-4" />
                      </button>
                    )}
                    {item.status === "conflict" && (
                      <ConflictResolver itemId={item.id} resolveConflict={resolveConflict} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: SyncQueueItem["status"] }) {
  return (
    <span className={cn(
      "px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider",
      status === "pending" ? "bg-slate-700/50 text-slate-300" :
      status === "syncing" ? "bg-blue-500/20 text-blue-300 animate-pulse" :
      status === "synced" ? "bg-emerald-500/20 text-emerald-300" :
      status === "conflict" ? "bg-amber-500/20 text-amber-300" :
      "bg-red-500/20 text-red-300"
    )}>
      {status}
    </span>
  );
}

function ConflictResolver({ itemId, resolveConflict }: { itemId: string, resolveConflict: any }) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button onClick={() => resolveConflict(itemId, "local")} className="text-xs bg-violet-600 hover:bg-violet-500 px-2 py-1 rounded text-white" title="Keep Local">
        Local
      </button>
      <button onClick={() => resolveConflict(itemId, "remote")} className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-white" title="Use Remote">
        Remote
      </button>
    </div>
  );
}
