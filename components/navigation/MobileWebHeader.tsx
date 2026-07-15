"use client";

/**
 * MobileWebHeader — Compact header for mobile browser view.
 * Neo-Brutalist Redesign
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

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <>
      {/* ── Header bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex items-center justify-between px-4 h-16 bg-[var(--color-bg)] border-b-[3px] border-[var(--color-border)]">
        {/* Brand + page title */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl overflow-hidden bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] flex items-center justify-center">
            <img src="/icon-192x192.png" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-[var(--color-text)] font-black uppercase tracking-wider text-sm">{pageTitle}</span>
        </div>

        {/* Right side: status + menu */}
        <div className="flex items-center gap-4">
          {/* Network indicator */}
          <span
            className={cn(
              "h-3 w-3 rounded-full border-2 border-[var(--color-border)] shadow-[1px_1px_0px_0px_var(--color-border)]",
              isOnline ? "bg-emerald-400" : "bg-red-400"
            )}
            title={isOnline ? "Online" : "Offline"}
          />

          {/* Hamburger */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center justify-center h-10 w-10 rounded-xl bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] text-[var(--color-text)] active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6 stroke-[3px]" /> : <Menu className="h-6 w-6 stroke-[3px]" />}
          </button>
        </div>
      </header>

      {/* ── Full-screen slide-over menu ──────────────────────────────────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-bg)] animate-in slide-in-from-right duration-200">
          {/* Menu header */}
          <div className="flex items-center justify-between px-4 h-16 border-b-[3px] border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl overflow-hidden bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] flex items-center justify-center">
                <img src="/icon-192x192.png" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-[var(--color-text)] font-black uppercase tracking-wider text-sm">Menu</span>
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-center h-10 w-10 rounded-xl bg-[var(--color-primary)] border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] text-white active:translate-y-0.5 active:translate-x-0.5 active:shadow-none transition-all"
              aria-label="Close menu"
            >
              <X className="h-6 w-6 stroke-[3px]" />
            </button>
          </div>

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-3">
            {NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon];
              const isActive =
                item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-4 py-4 rounded-[20px] transition-all duration-200 border-[3px] active:translate-y-1 active:translate-x-1 active:shadow-none",
                    isActive
                      ? "bg-[var(--color-primary)] text-white border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]"
                      : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        "h-6 w-6 stroke-[3px]",
                        isActive ? "text-white" : "text-[var(--color-text)]"
                      )}
                    />
                  )}
                  <div>
                    <div className="font-bold text-lg">{item.label}</div>
                    <div className={cn(
                      "text-xs font-semibold mt-0.5",
                      isActive ? "text-white/80" : "text-gray-600"
                    )}>{item.description}</div>
                  </div>
                </Link>
              );
            })}

            {/* Diagnostics */}
            <Link
              href="/pwa-diagnostics"
              className={cn(
                "flex items-center gap-4 px-4 py-4 rounded-[20px] transition-all duration-200 border-[3px] mt-6 active:translate-y-1 active:translate-x-1 active:shadow-none",
                pathname === "/pwa-diagnostics"
                  ? "bg-emerald-400 text-[var(--color-text)] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]"
                  : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]"
              )}
            >
              <Stethoscope className="h-6 w-6 stroke-[3px]" />
              <div>
                <div className="font-bold text-lg">PWA Diagnostics</div>
                <div className="text-xs font-semibold mt-0.5 text-gray-600">Runtime info</div>
              </div>
            </Link>
          </nav>

          {/* Status footer */}
          <div className="px-6 py-5 border-t-[3px] border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="flex items-center gap-3 text-sm font-bold text-[var(--color-text)] uppercase tracking-widest">
              <span
                className={cn(
                  "h-3 w-3 rounded-full border-2 border-[var(--color-border)]",
                  isOnline ? "bg-emerald-400 shadow-[2px_2px_0px_0px_var(--color-border)]" : "bg-red-400 shadow-[2px_2px_0px_0px_var(--color-border)]"
                )}
              />
              {isOnline ? "Connected" : "Offline"}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
