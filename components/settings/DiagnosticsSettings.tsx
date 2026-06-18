"use client";

import { useEffect, useState } from "react";
import { getLogs, clearLogs, logMessage } from "@/lib/services/errorLogger";
import { getDB, ErrorLogEntity, SyncAction } from "@/lib/db/indexeddb";
import { syncWithCloud } from "@/lib/services/cloudSync";
import { formatDate } from "@/lib/utils/helpers";
import {
  ShieldAlert,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
  CloudLightning,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export function DiagnosticsSettings() {
  const [logs, setLogs] = useState<ErrorLogEntity[]>([]);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [failedSyncCount, setFailedSyncCount] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const loadDiagnostics = async () => {
    try {
      const dbLogs = await getLogs();
      setLogs(dbLogs);

      const db = await getDB();
      if (db) {
        const queue: SyncAction[] = await db.getAll("sync_queue");
        setSyncQueueCount(queue.length);
        setFailedSyncCount(queue.filter((q) => q.status === "failed").length);
      }
    } catch (e) {
      console.error("Failed to load diagnostics:", e);
    }
  };

  useEffect(() => {
    loadDiagnostics();

    const handleLogsUpdate = () => loadDiagnostics();
    const handleSyncUpdate = () => loadDiagnostics();

    window.addEventListener("logs:updated", handleLogsUpdate);
    window.addEventListener("sync:updated", handleSyncUpdate);

    return () => {
      window.removeEventListener("logs:updated", handleLogsUpdate);
      window.removeEventListener("sync:updated", handleSyncUpdate);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    toast.loading("Retrying cloud synchronization...", { id: "manual-sync" });
    try {
      const res = await syncWithCloud();
      if (res.success) {
        toast.success("Synchronization complete!", { id: "manual-sync" });
      } else {
        toast.error(`Sync failed: ${res.error}`, { id: "manual-sync" });
      }
    } catch (e: any) {
      toast.error(`Error initiating sync: ${e.message}`, { id: "manual-sync" });
    } finally {
      setIsSyncing(false);
      loadDiagnostics();
    }
  };

  const handleClear = async () => {
    if (confirm("Are you sure you want to clear all error logs?")) {
      await clearLogs();
      toast.success("Diagnostics logs cleared.");
    }
  };

  const toggleExpandLog = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-4 pt-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          System Diagnostics
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDiagnostics}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Overview Stat Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute right-2 top-2 opacity-10">
            <ShieldAlert className="h-10 w-10 text-rose-500" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Logged Errors</span>
          <span className="text-2xl font-bold text-rose-400">{logs.length}</span>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute right-2 top-2 opacity-10">
            <CloudLightning className="h-10 w-10 text-amber-500" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Pending Syncs</span>
          <span className="text-2xl font-bold text-amber-400">{syncQueueCount}</span>
        </div>
        <div className="glass-card p-4 flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute right-2 top-2 opacity-10">
            <Activity className="h-10 w-10 text-emerald-500" />
          </div>
          <span className="text-xs text-slate-400 font-medium">Failed Syncs</span>
          <span className="text-2xl font-bold text-emerald-400">{failedSyncCount}</span>
        </div>
      </div>

      {/* Sync Actions */}
      {syncQueueCount > 0 && (
        <div className="glass-card p-4 flex items-center justify-between border-amber-500/10 bg-amber-500/5">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-amber-400">Sync Queue Suspended</p>
            <p className="text-xs text-slate-400">
              There are {syncQueueCount} operations pending cloud sync.
            </p>
          </div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-semibold text-xs rounded-xl transition-colors shadow-lg shadow-amber-500/10"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            Sync Now
          </button>
        </div>
      )}

      {/* Error Logs Feed */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 bg-slate-900/40 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">Operational Log Feed</span>
          {logs.length === 0 && (
            <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> System Stable
            </span>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm text-slate-400">No diagnostic reports captured.</p>
            <p className="text-xs text-slate-500">
              Everything is operating smoothly offline and online.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="text-xs">
                  {/* Log Header Row */}
                  <button
                    onClick={() => toggleExpandLog(log.id)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-slate-800/20 text-left transition-colors"
                  >
                    <div className="mt-0.5">
                      {log.level === "error" ? (
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      ) : log.level === "warning" ? (
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                      ) : (
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 capitalize">
                          {log.feature} · {log.operation}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatDate(new Date(log.timestamp).toISOString())}
                        </span>
                      </div>
                      <p className="text-slate-400 truncate">{log.message}</p>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-slate-600" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-slate-600" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Stacktrace Details */}
                  {isExpanded && (
                    <div className="px-9 pb-3 pt-1 bg-slate-900/60 text-[10px] font-mono text-slate-400 space-y-1.5 overflow-x-auto border-t border-white/5">
                      <p className="font-semibold text-rose-400/95">{log.message}</p>
                      {log.details && (
                        <pre className="whitespace-pre-wrap leading-relaxed opacity-80 break-all select-all">
                          {log.details}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
