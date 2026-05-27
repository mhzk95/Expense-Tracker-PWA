"use client";

/**
 * MobileWebHeader — Compact header for mobile browser view.
 *
 * Features:
 * - App title / current page name
 * - Hamburger menu button → full-screen slide-over menu
 * - Online/offline indicator dot
 * - Closes on navigation change
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV_ITEMS } from "@/lib/constants/app";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { cn } from "@/lib/utils/helpers";
import {
  Menu,
  X,
  TrendingUp,
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Wallet,
  RefreshCw,
  Settings,
  Stethoscope,
  BookImage,
  ShieldAlert,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Wallet,
  RefreshCw,
  Settings,
  BookImage,
  ShieldAlert,
};

/** Find the display label for the current route */
function usePageTitle(pathname: string): string {
  const match = NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  if (pathname === "/pwa-diagnostics") return "PWA Diagnostics";
  if (pathname === "/offline") return "Offline";
  return match?.label ?? "ExpenseTracker";
}

export function MobileWebHeader() {
  const pathname = usePathname();
  const pageTitle = usePageTitle(pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isOnline } = useNetworkStatus();

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-14 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        {/* Brand + page title */}
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
            <img src="/icon-192x192.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-white font-semibold text-sm">{pageTitle}</span>
        </div>

        {/* Right side: status + menu */}
        <div className="flex items-center gap-3">
          {/* Network indicator */}
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isOnline ? "bg-emerald-400" : "bg-red-400"
            )}
            title={isOnline ? "Online" : "Offline"}
          />

          {/* Hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center justify-center h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* ── Full-screen slide-over menu ──────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-950 animate-in slide-in-from-right duration-200">
          {/* Menu header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                <img src="/icon-192x192.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-white font-semibold text-sm">Menu</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon];
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-violet-500/15 text-violet-300 border border-violet-500/25"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? "text-violet-400" : "text-slate-500"
                      )}
                    />
                  )}
                  <div>
                    <div>{item.label}</div>
                    <div className="text-xs text-slate-500 font-normal">{item.description}</div>
                  </div>
                </Link>
              );
            })}

            {/* Diagnostics */}
            <Link
              href="/pwa-diagnostics"
              className={cn(
                "flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-medium transition-all",
                pathname === "/pwa-diagnostics"
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 border border-transparent"
              )}
            >
              <Stethoscope className="h-5 w-5" />
              <div>
                <div>PWA Diagnostics</div>
                <div className="text-xs text-slate-600 font-normal">Runtime info</div>
              </div>
            </Link>
          </nav>

          {/* Status footer */}
          <div className="px-4 py-4 border-t border-slate-800/60">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  isOnline ? "bg-emerald-400" : "bg-red-400"
                )}
              />
              {isOnline ? "Connected" : "No internet connection"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
