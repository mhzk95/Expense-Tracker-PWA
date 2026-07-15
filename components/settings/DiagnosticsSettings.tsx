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
  const [showAllLogs, setShowAllLogs] = useState(false);

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
        <h2 className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest">
          System Diagnostics
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDiagnostics}
            className="p-2 border-2 border-transparent hover:border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:bg-gray-100 transition-colors"
            title="Refresh Logs"
          >
            <RefreshCw className="h-4 w-4 stroke-[2.5px]" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg text-red-500 border-2 border-transparent hover:border-red-500 hover:bg-red-50 transition-colors"
            title="Clear Logs"
          >
            <Trash2 className="h-4 w-4 stroke-[2.5px]" />
          </button>
        </div>
      </div>

      {/* Overview Stat Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-red-50 border-[3px] border-[var(--color-border)] rounded-[16px] shadow-[4px_4px_0px_0px_var(--color-border)] p-4 flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute right-2 top-2 opacity-10">
            <ShieldAlert className="h-10 w-10 text-red-500 stroke-[3px]" />
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Logged</span>
          <span className="text-2xl font-black text-red-600">{logs.length}</span>
        </div>
        <div className="bg-amber-50 border-[3px] border-[var(--color-border)] rounded-[16px] shadow-[4px_4px_0px_0px_var(--color-border)] p-4 flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute right-2 top-2 opacity-10">
            <CloudLightning className="h-10 w-10 text-amber-500 stroke-[3px]" />
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Pending</span>
          <span className="text-2xl font-black text-amber-600">{syncQueueCount}</span>
        </div>
        <div className="bg-emerald-50 border-[3px] border-[var(--color-border)] rounded-[16px] shadow-[4px_4px_0px_0px_var(--color-border)] p-4 flex flex-col justify-between h-24 relative overflow-hidden">
          <div className="absolute right-2 top-2 opacity-10">
            <Activity className="h-10 w-10 text-emerald-500 stroke-[3px]" />
          </div>
          <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Failed</span>
          <span className="text-2xl font-black text-emerald-600">{failedSyncCount}</span>
        </div>
      </div>

      {/* Sync Actions */}
      {syncQueueCount > 0 && (
        <div className="bg-amber-100 border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] rounded-[16px] p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-black uppercase tracking-widest text-[var(--color-text)]">Sync Queue Suspended</p>
            <p className="text-xs font-bold text-gray-700">
              There are {syncQueueCount} operations pending cloud sync.
            </p>
          </div>
          <button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-400 hover:bg-amber-300 border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 text-[var(--color-text)] font-black uppercase tracking-widest text-xs rounded-[8px] transition-all"
          >
            <RefreshCw className={`h-4 w-4 stroke-[3px] ${isSyncing ? "animate-spin" : ""}`} />
            Sync Now
          </button>
        </div>
      )}

      {/* Error Logs Feed */}
      <div className="bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] rounded-[16px] overflow-hidden">
        <div className="px-4 py-3 bg-gray-100 border-b-[3px] border-[var(--color-border)] flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text)]">Operational Log Feed</span>
          {logs.length === 0 && (
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-100 border-2 border-emerald-500 px-2 py-0.5 rounded-[6px] shadow-[2px_2px_0px_0px_#10b981] flex items-center gap-1">
              <CheckCircle className="h-3 w-3 stroke-[3px]" /> System Stable
            </span>
          )}
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest">No diagnostic reports captured.</p>
            <p className="text-xs font-bold text-gray-500">
              Everything is operating smoothly offline and online.
            </p>
          </div>
        ) : (
          <div className="divide-y-2 divide-black">
            {(showAllLogs ? logs : logs.slice(0, 5)).map((log) => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div key={log.id} className="text-xs">
                  {/* Log Header Row */}
                  <button
                    onClick={() => toggleExpandLog(log.id)}
                    className="w-full px-4 py-3 flex items-start gap-3 hover:bg-[var(--color-bg)] text-left transition-colors"
                  >
                    <div className="mt-1">
                      {log.level === "error" ? (
                        <div className="h-3 w-3 rounded-full bg-red-500 border-2 border-[var(--color-border)] animate-pulse shadow-[1px_1px_0px_0px_var(--color-border)]" />
                      ) : log.level === "warning" ? (
                        <div className="h-3 w-3 rounded-full bg-amber-400 border-2 border-[var(--color-border)] shadow-[1px_1px_0px_0px_var(--color-border)]" />
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-blue-500 border-2 border-[var(--color-border)] shadow-[1px_1px_0px_0px_var(--color-border)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[var(--color-text)] uppercase tracking-widest">
                          {log.feature} <span className="text-gray-400 px-1">/</span> {log.operation}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          {formatDate(new Date(log.timestamp).toISOString())}
                        </span>
                      </div>
                      <p className="text-gray-700 font-bold truncate">{log.message}</p>
                    </div>
                    <div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 stroke-[3px] text-[var(--color-text)]" />
                      ) : (
                        <ChevronDown className="h-5 w-5 stroke-[3px] text-[var(--color-text)]" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Stacktrace Details */}
                  {isExpanded && (
                    <div className="px-9 pb-4 pt-3 bg-gray-100 text-[10px] font-mono font-bold text-gray-700 space-y-2 overflow-x-auto border-t-2 border-[var(--color-border)]">
                      <p className="font-black text-red-600">{log.message}</p>
                      {log.details && (
                        <pre className="whitespace-pre-wrap leading-relaxed break-all select-all">
                          {log.details}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {logs.length > 5 && (
              <div className="p-3 bg-[var(--color-bg)] flex justify-center border-t-2 border-[var(--color-border)]">
                <button
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="w-full py-2 text-xs font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-gray-200 rounded-[8px] flex items-center justify-center gap-1.5 transition-colors border-2 border-transparent hover:border-[var(--color-border)]"
                >
                  {showAllLogs ? (
                    <>
                      <ChevronUp className="h-4 w-4 stroke-[3px]" /> Collapse Logs
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 stroke-[3px]" /> Expand ({logs.length})
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
