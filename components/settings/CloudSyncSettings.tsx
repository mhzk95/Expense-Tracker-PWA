"use client";

import { useState, useEffect } from "react";
import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import { syncWithCloud } from "@/lib/services/cloudSync";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import toast from "react-hot-toast";

export function CloudSyncSettings() {
  const { data: session, status } = useSession();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [showConfirmSignOut, setShowConfirmSignOut] = useState(false);

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

  const handleSignOut = async () => {
    setShowConfirmSignOut(false);
    localStorage.clear();
    sessionStorage.clear();
    try {
      const cacheKeys = await caches.keys();
      for (const key of cacheKeys) {
        await caches.delete(key);
      }
    } catch (e) {}
    
    const req = indexedDB.deleteDatabase("ExpenseTrackerDB");
    req.onsuccess = () => signOut();
    req.onerror = () => signOut();
    req.onblocked = () => signOut();
  };

  return (
    <div className="space-y-2 pt-4">
      <h2 className="text-[10px] font-black text-black uppercase tracking-widest px-1">
        Cloud Database
      </h2>
      <div className="bg-white border-[3px] border-black rounded-[16px] shadow-[4px_4px_0px_0px_#000] p-5 space-y-4">
        
        {/* Auth Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`h-10 w-10 rounded-[10px] bg-white border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_#000] ${session ? 'text-emerald-500' : 'text-black'}`}>
              {session ? <Cloud className="h-5 w-5 stroke-[2.5px]" /> : <CloudOff className="h-5 w-5 stroke-[2.5px]" />}
            </div>
            <div>
              <p className="font-black text-black text-sm uppercase tracking-widest">
                {status === "loading" ? "Checking status..." : session ? "Connected to Cloud" : "Local Only Mode"}
              </p>
              <p className="text-xs font-bold text-gray-500 mt-0.5">
                {session ? `Signed in as ${session.user?.name || session.user?.email}` : "Sign in to enable cloud sync"}
              </p>
            </div>
          </div>
          
          {status !== "loading" && (
            <button
              onClick={() => {
                if (session) {
                  setShowConfirmSignOut(true);
                } else {
                  signIn();
                }
              }}
              className="text-xs font-black text-black uppercase tracking-widest px-4 py-2 rounded-lg bg-gray-100 hover:bg-[var(--color-primary)] hover:text-white border-2 border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
            >
              {session ? "Sign Out" : "Sign In"}
            </button>
          )}
        </div>

        {/* Sync Controls */}
        {session && (
          <div className="pt-4 border-t-[3px] border-black">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-widest text-black">Migrate & Sync</p>
                <p className="text-xs font-bold text-gray-500 mt-0.5">
                  Last sync: {lastSync || "Never"}
                </p>
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] disabled:opacity-50 text-white rounded-lg border-2 border-black shadow-[4px_4px_0px_0px_#000] text-xs font-black uppercase tracking-widest transition-all"
              >
                <RefreshCw className={`h-4 w-4 stroke-[3px] ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          </div>
        )}
      </div>

      <AdaptiveOverlay
        isOpen={showConfirmSignOut}
        onClose={() => setShowConfirmSignOut(false)}
        title="Confirm Sign Out"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-700 font-bold leading-relaxed">
            Are you sure you want to sign out? This will completely clear all local database data, settings, and cache on this device. Any unsynced data will be lost.
          </p>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={handleSignOut}
              className="w-full py-3 bg-red-500 hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] text-white rounded-xl text-xs font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_#000] transition-all"
            >
              Sign Out & Delete Local Data
            </button>
            <button
              onClick={() => setShowConfirmSignOut(false)}
              className="w-full py-3 bg-white hover:bg-gray-100 text-black border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0px_0px_#000] rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Keep Me Connected
            </button>
          </div>
        </div>
      </AdaptiveOverlay>
    </div>
  );
}
