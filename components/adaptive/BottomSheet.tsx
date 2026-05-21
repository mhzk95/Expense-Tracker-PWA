"use client";

import { X } from "lucide-react";
import type { AdaptiveModalProps } from "./AdaptiveModal";
import { useEffect } from "react";

export function BottomSheet({ isOpen, onClose, title, children }: AdaptiveModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full rounded-t-3xl bg-slate-900 border-t border-slate-800 shadow-xl overflow-hidden animate-in slide-in-from-bottom duration-300 pb-safe">
        <div className="flex items-center justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-700" />
        </div>
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
}
