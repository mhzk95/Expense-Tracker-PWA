"use client";

import { useState, useEffect } from "react";
import { 
  hasDropboxConnection,
  initiateDropboxLogin,
  handleDropboxRedirect,
  removeDropboxAuth,
  uploadBackupToDropbox,
  restoreBackupFromDropbox
} from "@/lib/services/dropbox";
import { Cloud, Save, Download, Trash2, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export function DropboxSettings() {
  const [clientId, setClientId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<"idle" | "authenticating" | "syncing" | "restoring" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsConnected(hasDropboxConnection());

    const code = searchParams.get("code");
    if (code) {
      completeAuth(code);
    }
  }, [searchParams]);

  const completeAuth = async (code: string) => {
    setStatus("authenticating");
    setMessage("Connecting to Dropbox...");
    
    // The redirect URI must match exactly what was sent during authorization
    const redirectUri = window.location.origin + window.location.pathname;
    
    const success = await handleDropboxRedirect(code, redirectUri);
    if (success) {
      setIsConnected(true);
      setStatus("success");
      setMessage("Dropbox connected successfully!");
    } else {
      setStatus("error");
      setMessage("Failed to connect to Dropbox.");
    }
    
    // Remove the ?code from URL
    router.replace(window.location.pathname);
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleConnect = () => {
    if (!clientId.trim()) return;
    const redirectUri = window.location.origin + window.location.pathname;
    initiateDropboxLogin(clientId.trim(), redirectUri);
  };

  const handleDisconnect = () => {
    removeDropboxAuth();
    setIsConnected(false);
    setClientId("");
  };

  const handleManualBackup = async () => {
    setStatus("syncing");
    setMessage("Uploading backup to Dropbox...");
    const success = await uploadBackupToDropbox();
    if (success) {
      setStatus("success");
      setMessage("Backup uploaded successfully.");
    } else {
      setStatus("error");
      setMessage("Failed to upload backup.");
    }
    setTimeout(() => setStatus("idle"), 5000);
  };

  const handleManualRestore = async () => {
    if (!confirm("This will OVERWRITE your current local data. Are you sure?")) return;
    
    setStatus("restoring");
    setMessage("Downloading backup from Dropbox...");
    const success = await restoreBackupFromDropbox();
    if (success) {
      setStatus("success");
      setMessage("Data restored successfully!");
    } else {
      setStatus("error");
      setMessage("Failed to restore data.");
    }
    setTimeout(() => setStatus("idle"), 5000);
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl border border-slate-800/60 bg-slate-900/60 mt-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <Cloud className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Dropbox Auto-Backup</h3>
          <p className="text-xs text-slate-400">Sync your data automatically</p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Paste your Dropbox <strong>App Key</strong> to connect. The app will securely get a refresh token so it never logs you out.
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="App Key (Client ID)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
            <button
              onClick={handleConnect}
              disabled={status === "authenticating" || !clientId.trim()}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Connect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-medium">Dropbox Connected</span>
            </div>
            <button 
              onClick={handleDisconnect}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Disconnect"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleManualBackup}
              disabled={status !== "idle"}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Force Backup
            </button>
            <button
              onClick={handleManualRestore}
              disabled={status !== "idle"}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Restore
            </button>
          </div>
        </div>
      )}

      {status !== "idle" && (
        <p className={`text-xs text-center font-medium ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
