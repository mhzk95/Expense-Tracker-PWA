"use client";

import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function TelegramSettings() {
  const hasToken = !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  const hasChatId = !!process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
  const isConnected = hasToken && hasChatId;

  return (
    <div className="space-y-4 p-5 rounded-2xl border border-slate-800/60 bg-slate-900/60 mt-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-500/20 rounded-xl">
          <Send className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white">Telegram Image CDN</h3>
          <p className="text-xs text-slate-400">Receipts and image storage</p>
        </div>
      </div>

      <div className={`flex items-center gap-2 p-3 rounded-xl border ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
        {isConnected ? (
          <>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-sm text-emerald-300 font-medium leading-none mb-1">Connected</span>
              <span className="text-[10px] text-emerald-400/70 leading-none">Images will securely sync to your private channel</span>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-red-400" />
            <div className="flex flex-col">
              <span className="text-sm text-red-300 font-medium leading-none mb-1">Disconnected</span>
              <span className="text-[10px] text-red-400/70 leading-none">Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
