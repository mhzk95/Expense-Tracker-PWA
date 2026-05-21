"use client";

import { useState, useEffect } from "react";
import { 
  getDropboxToken, 
  setDropboxToken, 
  removeDropboxToken,
  uploadBackupToDropbox,
  restoreBackupFromDropbox
} from "@/lib/services/dropbox";
import { Cloud, Save, Download, Trash2, CheckCircle2 } from "lucide-react";

export function DropboxSettings() {
  const [token, setToken] = useState("");
  const [hasToken, setHasToken] = useState(false);
  const [status, setStatus] = useState<"idle" | "syncing" | "restoring" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = getDropboxToken();
    if (saved) {
      setHasToken(true);
      setToken(saved);
    }
  }, []);

  const handleSaveToken = () => {
    if (!token.trim()) return;
    setDropboxToken(token.trim());
    setHasToken(true);
    setStatus("success");
    setMessage("Token saved successfully.");
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleRemoveToken = () => {
    removeDropboxToken();
    setHasToken(false);
    setToken("");
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
      setMessage("Failed to upload backup. Check token.");
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
      setMessage("Failed to restore data. Check token or file.");
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

      {!hasToken ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Paste your Dropbox Access Token here to enable automatic background backups of your local data.
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="sl.B... (Access Token)"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none"
            />
            <button
              onClick={handleSaveToken}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Save
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
              onClick={handleRemoveToken}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Remove Connection"
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

          {status !== "idle" && (
            <p className={`text-xs text-center font-medium ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
