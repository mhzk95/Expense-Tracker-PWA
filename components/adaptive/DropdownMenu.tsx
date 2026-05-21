"use client";

import { useEffect, useRef } from "react";
import type { AdaptiveActionMenuProps } from "./AdaptiveActionMenu";
import { cn } from "@/lib/utils/helpers";

export function DropdownMenu({ isOpen, onClose, items, triggerRef }: AdaptiveActionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen || !triggerRef?.current) return null;

  const rect = triggerRef.current.getBoundingClientRect();
  const top = rect.bottom + 8;
  const right = window.innerWidth - rect.right;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ top, right }}
    >
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
              "w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-slate-800",
              item.destructive ? "text-red-400 hover:text-red-300" : "text-slate-300 hover:text-white"
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
