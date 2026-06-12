"use client";

/**
 * WebSidebarNavigation — Desktop sidebar used in browser mode.
 *
 * Features:
 * - Full-height left sidebar with brand logo
 * - Active route highlighting
 * - Collapsible (icon-only) mode
 * - Navigation items from constants
 * - Bottom settings & diagnostics links
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
  TrendingUp,
  Cloud,
  BookImage,
  ShieldAlert,
  Link2,
  Bell,
} from "lucide-react";

/** Map icon name strings to Lucide components */
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
        "flex flex-col h-full bg-slate-950 border-r border-slate-800/60 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64",
        className
      )}
      aria-label="Sidebar navigation"
    >
      {/* ── Brand ───────────────────────────────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-5 border-b border-slate-800/60",
          collapsed && "justify-center px-0"
        )}
      >
        {/* Logo mark */}
        <div className="flex-shrink-0 h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/20 bg-slate-900 border border-slate-800">
          <img src="/icon-192x192.png" alt="ExpenseTracker Logo" className="w-full h-full object-cover" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-white font-bold text-sm leading-tight block">
              ExpenseTracker
            </span>
            <span className="text-slate-500 text-xs">Personal Finance</span>
          </div>
        )}
      </div>

      {/* ── Navigation Items ─────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group",
                collapsed && "justify-center px-0 py-3",
                isActive
                  ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
              )}
              title={collapsed ? item.label : undefined}
              aria-current={isActive ? "page" : undefined}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "flex-shrink-0 h-4.5 w-4.5",
                    isActive ? "text-violet-400" : "text-slate-500 group-hover:text-slate-300"
                  )}
                />
              )}
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* ── Diagnostics shortcut ─────────────────────────────────────────── */}
      {!collapsed && (
        <div className="px-3 pb-2">
          <Link
            href="/pwa-diagnostics"
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150",
              pathname === "/pwa-diagnostics"
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "text-slate-600 hover:text-slate-400 border border-transparent"
            )}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>PWA Diagnostics</span>
          </Link>
        </div>
      )}

      {/* ── Collapse toggle ──────────────────────────────────────────────── */}
      <div className="p-3 border-t border-slate-800/60">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 text-xs font-medium transition-all",
            collapsed && "justify-center px-0"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
