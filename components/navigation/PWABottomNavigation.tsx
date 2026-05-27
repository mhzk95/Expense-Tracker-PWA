"use client";

/**
 * PWABottomNavigation — App-like bottom tab bar for standalone PWA mode.
 *
 * Features:
 * - 5 primary tabs (subset of full nav)
 * - Safe-area-aware padding (env(safe-area-inset-bottom))
 * - Active tab highlight with animated indicator
 * - Haptic-ready design (visual feedback optimized for touch)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS, NAV_ITEMS } from "@/lib/constants/app";
import { cn } from "@/lib/utils/helpers";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Wallet,
  BookImage,
  ShieldAlert,
  Settings,
  Menu,
  X,
  ChevronRight
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Wallet,
  BookImage,
  ShieldAlert,
  Settings,
  Menu,
};

export function PWABottomNavigation() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setShowMoreMenu(false);
  }, [pathname]);

  // Items to show in the "More" overlay
  const moreItems = NAV_ITEMS.filter(
    (navItem) => !BOTTOM_NAV_ITEMS.some((bottomItem) => bottomItem.id === navItem.id)
  );

  return (
    <>
      {/* ── "More" Overlay Menu ─────────────────────────────────────────── */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ bottom: "calc(4rem + env(safe-area-inset-bottom))" }}
            onClick={() => setShowMoreMenu(false)}
          />
          
          {/* Menu Sheet */}
          <div 
            className="fixed left-4 right-4 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-800/60 rounded-3xl shadow-2xl shadow-black/50 overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-200"
            style={{ bottom: "calc(5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="p-4 border-b border-slate-800/60 flex items-center justify-between">
              <h3 className="font-semibold text-white">More Options</h3>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="h-8 w-8 rounded-full bg-slate-800/60 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-2 space-y-1">
              {moreItems.map((item) => {
                const Icon = ICON_MAP[item.icon];
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-colors group active:scale-[0.98]",
                      isActive ? "bg-violet-500/15" : "hover:bg-slate-800/40"
                    )}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                      isActive ? "bg-violet-500/20 text-violet-400" : "bg-slate-800/60 text-slate-400 group-hover:text-white"
                    )}>
                      {Icon && <Icon className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className={cn(
                        "text-sm font-medium",
                        isActive ? "text-violet-300" : "text-slate-200"
                      )}>
                        {item.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.description}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Bottom Navigation Bar ───────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800/60 shadow-[0_-8px_30px_rgb(0,0,0,0.12)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Bottom navigation"
      >
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const Icon = ICON_MAP[item.icon];
            const isMoreBtn = item.id === "more";
            
            // "More" button is active if the menu is open, OR if the current route is one of the "more" items.
            const isMoreItemActive = moreItems.some(mi => pathname.startsWith(mi.href));
            const isActive = isMoreBtn 
              ? (showMoreMenu || isMoreItemActive)
              : (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

            const content = (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full bg-violet-400" />
                )}
                <span
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-xl transition-all duration-150",
                    isActive ? "bg-violet-500/15" : ""
                  )}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                </span>
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </>
            );

            const commonClasses = cn(
              "flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-150 active:scale-95",
              isActive ? "text-violet-400" : "text-slate-500"
            );

            if (isMoreBtn) {
              return (
                <button
                  key={item.id}
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={commonClasses}
                  aria-label="More options"
                  aria-expanded={showMoreMenu}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className={commonClasses}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
