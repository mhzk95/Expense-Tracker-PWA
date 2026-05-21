"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { SyncSummaryCard } from "@/components/sync/SyncSummaryCard";
import { SyncQueueTable } from "@/components/sync/SyncQueueTable";
import { useSyncEngine } from "@/hooks/useSyncEngine";

export default function SyncPage() {
  const { syncNow, isSyncing, lastSyncAt } = useSyncEngine();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Sync Management" 
        subtitle={lastSyncAt ? `Last synced: ${new Date(lastSyncAt).toLocaleTimeString()}` : "Not synced yet"}
        action={
          <button 
            onClick={syncNow} 
            disabled={isSyncing}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        }
      />
      
      <SyncSummaryCard />
      <SyncQueueTable />
    </div>
  );
}
