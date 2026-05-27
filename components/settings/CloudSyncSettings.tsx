"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { syncWithCloud } from "@/lib/services/cloudSync";
import toast from "react-hot-toast";

export function CloudSyncSettings() {
  const { data: session, status } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("et_last_cloud_sync");
    if (saved) {
      setLastSync(new Date(saved).toLocaleString());
    }
  }, []);

  const handleSync = async () => {
    if (!session) {
      toast.error("Please sign in first to sync data.");
      return;
    }
    
    setIsSyncing(true);
    const toastId = toast.loading("Syncing with cloud...");
    
    try {
      const res = await syncWithCloud();
      if (res.success) {
        toast.success("Sync complete!", { id: toastId });
        const saved = localStorage.getItem("et_last_cloud_sync");
        if (saved) setLastSync(new Date(saved).toLocaleString());
      } else {
        toast.error(`Sync failed: ${res.error}`, { id: toastId });
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`, { id: toastId });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        Cloud Database
      </h2>
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 space-y-4">
        
        {/* Auth Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${session ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-400'}`}>
              {session ? <Cloud className="h-5 w-5" /> : <CloudOff className="h-5 w-5" />}
            </div>
            <div>
              <p className="font-medium text-white text-sm">
                {status === "loading" ? "Checking status..." : session ? "Connected to Cloud" : "Local Only Mode"}
              </p>
              <p className="text-xs text-slate-400">
                {session ? `Signed in as ${session.user?.name || session.user?.email}` : "Sign in to enable cloud sync"}
              </p>
            </div>
          </div>
          
          {status !== "loading" && (
            <button
              onClick={() => session ? signOut() : signIn()}
              className="text-xs font-medium text-violet-400 hover:text-violet-300 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 transition-colors"
            >
              {session ? "Sign Out" : "Sign In"}
            </button>
          )}
        </div>

        {/* Sync Controls */}
        {session && (
          <div className="pt-4 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-300">Migrate & Sync</p>
                <p className="text-xs text-slate-500">
                  Last sync: {lastSync || "Never"}
                </p>
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
