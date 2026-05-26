"use client";

import { useState, useEffect } from "react";
import { 
  hasTelegramConnection,
  setTelegramAuth,
  removeTelegramAuth,
  uploadBackupToTelegram,
  restoreBackupFromTelegram,
  getAutoBackupSettings,
  setAutoBackupSettings,
  getLastBackupTime
} from "@/lib/services/telegram";
import { Send, Save, Download, Trash2, CheckCircle2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils/helpers";

export function TelegramSettings() {
  const [chatId, setChatId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState<"idle" | "authenticating" | "syncing" | "restoring" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupTime, setAutoBackupTime] = useState("23:00");
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  const hasToken = !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;

  useEffect(() => {
    setIsConnected(hasTelegramConnection());
    const settings = getAutoBackupSettings();
    setAutoBackupEnabled(settings.enabled);
    setAutoBackupTime(settings.time);
    setLastBackupTime(getLastBackupTime());
  }, []);

  const handleConnect = () => {
    if (!hasToken) {
      setStatus("error");
      setMessage("Bot token missing in .env file");
      return;
    }
    if (!chatId.trim()) return;
    setStatus("authenticating");
    setMessage("Connecting...");
    
    setTelegramAuth(chatId, "");
    setIsConnected(true);
    setStatus("success");
    setMessage("Telegram connected successfully!");
    
    setTimeout(() => setStatus("idle"), 3000);
  };

  const handleDisconnect = () => {
    removeTelegramAuth();
    setIsConnected(false);
    setChatId("");
  };

  const handleManualBackup = async () => {
    setStatus("syncing");
    setMessage("Uploading backup to Telegram...");
    const success = await uploadBackupToTelegram();
    if (success) {
      setStatus("success");
      setMessage("Backup uploaded successfully.");
      setLastBackupTime(getLastBackupTime());
    } else {
      setStatus("error");
      setMessage("Failed to upload backup.");
    }
    setTimeout(() => setStatus("idle"), 5000);
  };

  const handleManualRestore = async () => {
    if (!confirm("This will OVERWRITE your current local data. Are you sure?")) return;
    
    setStatus("restoring");
    setMessage("Downloading backup from Telegram...");
    const success = await restoreBackupFromTelegram();
    if (success) {
      setStatus("success");
      setMessage("Data restored successfully!");
    } else {
      setStatus("error");
      setMessage("Failed to restore data. Make sure you forwarded the backup.json to the bot!");
    }
    setTimeout(() => setStatus("idle"), 5000);
  };

  const toggleAutoBackup = () => {
    const newState = !autoBackupEnabled;
    setAutoBackupEnabled(newState);
    setAutoBackupSettings(newState, autoBackupTime);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value;
    setAutoBackupTime(newTime);
    setAutoBackupSettings(autoBackupEnabled, newTime);
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl border border-slate-800/60 bg-slate-900/60 mt-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <Send className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Telegram Auto-Backup</h3>
          <p className="text-xs text-slate-400">Unlimited free storage sync</p>
        </div>
      </div>

      {!isConnected ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            {hasToken 
              ? "Paste your Private Channel Chat ID to connect." 
              : "Warning: NEXT_PUBLIC_TELEGRAM_BOT_TOKEN is missing in your .env file."}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              placeholder="Chat ID (e.g. -100123...)"
              disabled={!hasToken}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500 outline-none disabled:opacity-50"
            />
            <button
              onClick={handleConnect}
              disabled={status === "authenticating" || !chatId.trim() || !hasToken}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              Connect
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5 pt-2">
          {/* Connection Status & Disconnect */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-sm text-emerald-300 font-medium leading-none mb-1">Connected</span>
                {lastBackupTime && (
                  <span className="text-[10px] text-emerald-400/70 leading-none">
                    Last: {formatDate(lastBackupTime, "short")} {new Date(lastBackupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={handleDisconnect}
              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Disconnect"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Auto Backup Settings */}
          <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800/60 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="text-sm font-medium text-white">Daily Auto-Backup</span>
              </div>
              <button 
                onClick={toggleAutoBackup}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${autoBackupEnabled ? "bg-violet-500" : "bg-slate-700"}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${autoBackupEnabled ? "translate-x-5" : "translate-x-1"}`} />
              </button>
            </div>
            
            {autoBackupEnabled && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                <span className="text-xs text-slate-400">Scheduled Time</span>
                <input 
                  type="time" 
                  value={autoBackupTime}
                  onChange={handleTimeChange}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white outline-none focus:border-violet-500"
                />
              </div>
            )}
          </div>

          {/* Manual Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleManualBackup}
              disabled={status !== "idle"}
              className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              Backup Now
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
          <p className="text-[10px] text-slate-500 text-center leading-relaxed">
            <strong>To Restore:</strong> Forward the latest <code className="text-slate-400">backup.json</code> file from your private channel directly to your Bot, then immediately click Restore.
          </p>
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
