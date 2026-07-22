"use client";

/**
 * WebSidebarNavigation — Desktop sidebar used in browser mode.
 * Neo-Brutalist Redesign
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_ITEMS } from "@/lib/constants/app";
import { cn } from "@/lib/utils/helpers";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Wallet,
  RefreshCw,
  Settings,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Cloud,
  BookImage,
  ShieldAlert,
  Link2,
  Bell,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Wallet,
  RefreshCw,
  Settings,
  Cloud,
  BookImage,
  ShieldAlert,
  Link2,
  Bell,
};

interface WebSidebarNavigationProps {
  className?: string;
}

export function WebSidebarNavigation({ className }: WebSidebarNavigationProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col h-full bg-[var(--color-surface)] border-r-4 border-[var(--color-border)] transition-all duration-300 shadow-[4px_0_0_0_var(--color-border)] z-20 relative",
        collapsed ? "w-[88px]" : "w-72",
        className
      )}
      aria-label="Sidebar navigation"
    >
      {/* ── Brand ───────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-3 px-6 py-6 border-b-4 border-[var(--color-border)]",
          collapsed && "justify-center px-0"
        )}
      >
        <div className="flex-shrink-0 h-12 w-12 rounded-xl overflow-hidden flex items-center justify-center bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)]">
          <img src="/icon-192x192.png" alt="ExpenseTracker Logo" className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-[var(--color-text)] font-black uppercase tracking-wider text-base leading-tight block">
              Expense
            </span>
            <span className="text-[var(--color-text)] font-bold uppercase tracking-wider text-base leading-tight block">
              Tracker
            </span>
          </div>
        )}
      </div>

      {/* ── Navigation Items ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-3" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-[16px] text-sm font-bold transition-all duration-150 border-2",
                collapsed && "justify-center px-0 py-3.5 mx-2",
                isActive
                  ? "bg-[var(--color-primary)] text-white border-[var(--color-border)]  translate-x-0 translate-y-0"
                  : "bg-[var(--color-surface)] text-[var(--color-text)] border-transparent hover:border-[var(--color-border)] hover:"
              )}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "flex-shrink-0 h-6 w-6 stroke-[2.5px]",
                    isActive ? "text-white" : "text-[var(--color-text)]"
                  )}
                />
              )}
              {!collapsed && (
                <span className="text-base truncate tracking-wide">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Diagnostics shortcut ─────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-4 pb-4">
          <Link
            href="/pwa-diagnostics"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-[16px] text-sm font-bold transition-all duration-150 border-2",
              pathname === "/pwa-diagnostics"
                ? "bg-emerald-400 text-[var(--color-text)] border-[var(--color-border)] "
                : "bg-[var(--color-surface)] text-[var(--color-text)] border-transparent hover:border-[var(--color-border)] hover:"
            )}
          >
            <Stethoscope className="h-5 w-5 stroke-[2.5px]" />
            <span className="tracking-wide">PWA Diagnostics</span>
          </Link>
        </div>
      )}

      {/* ── Collapse toggle ──────────────────────────────────────────────── */}
      <div className="p-4 border-t-4 border-[var(--color-border)] bg-[var(--color-surface)]">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 rounded-[16px] text-[var(--color-text)] font-bold transition-all border-2 border-transparent hover:border-[var(--color-border)] hover:",
            collapsed && "justify-center px-0 py-3 mx-1 w-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-6 w-6 stroke-[3px]" />
          ) : (
            <>
              <ChevronLeft className="h-6 w-6 stroke-[3px]" />
              <span className="tracking-wide uppercase text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
