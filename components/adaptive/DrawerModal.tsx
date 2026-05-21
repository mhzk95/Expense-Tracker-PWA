"use client";

import { X } from "lucide-react";
import type { AdaptiveModalProps } from "./AdaptiveModal";
import { useEffect } from "react";

export function DrawerModal({ isOpen, onClose, title, children }: AdaptiveModalProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/80 backdrop-blur-sm justify-end">
      <div className="w-full max-w-sm h-full bg-slate-900 border-l border-slate-800 shadow-xl overflow-y-auto animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
