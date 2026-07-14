"use client";

import { Send, CheckCircle2, AlertCircle } from "lucide-react";

export function TelegramSettings() {
  const hasToken = !!process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN;
  const hasChatId = !!process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID;
  const isConnected = hasToken && hasChatId;

  return (
    <div className="space-y-4 p-5 rounded-[16px] border-[3px] border-black shadow-[4px_4px_0px_0px_#000] bg-white mt-4">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-2.5 bg-blue-100 border-2 border-blue-500 rounded-[10px] shadow-[2px_2px_0px_0px_#3b82f6]">
          <Send className="h-5 w-5 text-blue-600 stroke-[2.5px]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-black uppercase tracking-widest">Telegram Image CDN</h3>
          <p className="text-xs font-bold text-gray-500 mt-0.5">Receipts and image storage</p>
        </div>
      </div>

      <div className={`flex items-center gap-3 p-4 rounded-[12px] border-2 shadow-[2px_2px_0px_0px_#000] ${isConnected ? 'bg-emerald-50 border-emerald-500 shadow-[2px_2px_0px_0px_#10b981]' : 'bg-red-50 border-red-500 shadow-[2px_2px_0px_0px_#ef4444]'}`}>
        {isConnected ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-600 stroke-[2.5px]" />
            <div className="flex flex-col">
              <span className="text-xs text-emerald-700 font-black uppercase tracking-widest mb-0.5">Connected</span>
              <span className="text-[10px] font-bold text-emerald-600">Images will securely sync to your private channel</span>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="h-5 w-5 text-red-600 stroke-[2.5px]" />
            <div className="flex flex-col">
              <span className="text-xs text-red-700 font-black uppercase tracking-widest mb-0.5">Disconnected</span>
              <span className="text-[10px] font-bold text-red-600">Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in environment</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
