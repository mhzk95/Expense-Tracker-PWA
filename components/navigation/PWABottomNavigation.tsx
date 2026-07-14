"use client";

/**
 * PWABottomNavigation — App-like bottom tab bar for standalone PWA mode.
 * Neo-Brutalist Redesign: Floating pill, thick borders, solid colors.
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
  ChevronRight,
  Link2,
  Bell
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
  Link2,
  Bell
};

export function PWABottomNavigation() {
  const pathname = usePathname();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    setShowMoreMenu(false);
  }, [pathname]);

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
            className="fixed inset-0 z-30 bg-[var(--color-bg)]/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowMoreMenu(false)}
          />
          
          {/* Menu Sheet */}
          <div 
            className="fixed left-4 right-4 z-40 bg-white border-4 border-black rounded-[24px] shadow-[6px_6px_0px_0px_#000] overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-200"
            style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          >
            <div className="p-4 border-b-4 border-black flex items-center justify-between bg-white">
              <h3 className="font-black text-black uppercase tracking-wider text-lg">More Options</h3>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="h-10 w-10 rounded-full bg-white border-2 border-black flex items-center justify-center text-black hover:bg-[var(--color-primary)] hover:text-white transition-colors brutal-btn"
              >
                <X className="h-6 w-6 stroke-[3px]" />
              </button>
            </div>
            <div className="p-3 space-y-2 bg-[var(--color-bg)]">
              {moreItems.map((item) => {
                const Icon = ICON_MAP[item.icon];
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group border-2",
                      isActive 
                        ? "bg-[var(--color-primary)] border-black shadow-[4px_4px_0px_0px_#000] text-white" 
                        : "bg-white border-transparent text-black hover:border-black hover:shadow-[4px_4px_0px_0px_#000]"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border-2",
                      isActive ? "bg-white border-black text-black" : "bg-gray-100 border-transparent text-black group-hover:border-black"
                    )}>
                      {Icon && <Icon className="h-6 w-6 stroke-[2.5px]" />}
                    </div>
                    <div className="flex-1">
                      <div className={cn(
                        "text-base font-bold",
                        isActive ? "text-white" : "text-black"
                      )}>
                        {item.label}
                      </div>
                      <div className={cn(
                        "text-xs font-semibold mt-0.5",
                        isActive ? "text-white/80" : "text-gray-600"
                      )}>{item.description}</div>
                    </div>
                    <ChevronRight className={cn(
                      "h-6 w-6 stroke-[3px]",
                      isActive ? "text-white" : "text-black"
                    )} />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Bottom Navigation Bar ───────────────────────────────────────── */}
      <div 
        className="fixed bottom-4 left-4 right-4 z-40"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <nav
          className="bg-white border-4 border-black rounded-[28px] shadow-[6px_6px_0px_0px_#000] overflow-hidden"
          aria-label="Bottom navigation"
        >
          <div className="flex items-stretch h-16">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const Icon = ICON_MAP[item.icon];
              const isMoreBtn = item.id === "more";
              
              const isMoreItemActive = moreItems.some(mi => pathname.startsWith(mi.href));
              const isActive = isMoreBtn 
                ? (showMoreMenu || isMoreItemActive)
                : (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

              const content = (
                <>
                  <span
                    className={cn(
                      "flex items-center justify-center h-10 w-10 rounded-[14px] transition-all duration-200 border-2",
                      isActive 
                        ? "bg-[var(--color-primary)] border-black shadow-[2px_2px_0px_0px_#000] text-white" 
                        : "bg-transparent border-transparent text-black"
                    )}
                  >
                    {Icon && <Icon className="h-5 w-5 stroke-[2.5px]" />}
                  </span>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider mt-1 transition-colors",
                    isActive ? "text-black" : "text-gray-500"
                  )}>{item.label}</span>
                </>
              );

              const commonClasses = cn(
                "flex-1 flex flex-col items-center justify-center relative transition-transform duration-150 active:scale-95"
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
      </div>
    </>
  );
}
