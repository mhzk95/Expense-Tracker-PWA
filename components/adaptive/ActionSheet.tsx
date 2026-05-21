"use client";

import type { AdaptiveActionMenuProps } from "./AdaptiveActionMenu";
import { cn } from "@/lib/utils/helpers";
import { useEffect } from "react";

export function ActionSheet({ isOpen, onClose, title, items }: AdaptiveActionMenuProps) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-sm">
      <div className="w-full bg-slate-900 rounded-t-3xl border-t border-slate-800 animate-in slide-in-from-bottom duration-200 pb-safe">
        <div className="flex items-center justify-center pt-3 pb-2">
          <div className="w-10 h-1.5 rounded-full bg-slate-700" />
        </div>
        {title && (
          <div className="px-5 pb-3 text-center text-sm font-semibold text-slate-400 border-b border-slate-800/50">
            {title}
          </div>
        )}
        <div className="p-2 space-y-1">
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium transition-colors active:bg-slate-800",
                  item.destructive ? "text-red-400" : "text-slate-200"
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
                {item.label}
              </button>
            );
          })}
        </div>
        <div className="p-2 pt-0 mt-1">
          <button
            onClick={onClose}
            className="w-full flex justify-center py-4 rounded-xl text-base font-semibold text-white bg-slate-800 active:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
