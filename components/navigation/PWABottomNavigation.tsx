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
import { X, ChevronRight, Bell } from "lucide-react";
import { ThemeIcon } from "@/components/ui/ThemeIcon";
import { ThemeDecal } from "@/components/ui/ThemeDecal";

const ICON_MAP: Record<string, string> = {
  LayoutDashboard: "nav-home",
  ArrowLeftRight: "nav-transactions",
  Target: "nav-research",
  BarChart3: "nav-research",
  Wallet: "action-add",
  BookImage: "nav-journal",
  ShieldAlert: "nav-journal",
  Settings: "action-settings",
  Menu: "nav-more",
  Link2: "nav-journal",
  Bell: "nav-journal"
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
            className="fixed left-4 right-4 z-40 bg-[var(--color-surface)] border-4 border-[var(--color-border)] rounded-[24px] shadow-brutal-lg overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-200"
            style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          >
            <div className="p-4 border-b-4 border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface)]">
              <h3 className="font-black text-[var(--color-text)] uppercase tracking-wider text-lg">More Options</h3>
              <button 
                onClick={() => setShowMoreMenu(false)}
                className="h-10 w-10 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] flex items-center justify-center text-[var(--color-text)] hover:bg-[var(--color-primary)] hover:text-[var(--color-surface)] transition-colors brutal-btn"
              >
                <X className="h-6 w-6 stroke-[3px]" />
              </button>
            </div>
            <div className="p-3 space-y-2 bg-[var(--color-bg)]">
              {moreItems.map((item) => {
                const iconName = ICON_MAP[item.icon] as any;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group border-2",
                      isActive 
                        ? "bg-[var(--color-primary)] border-[var(--color-border)] shadow-brutal text-white" 
                        : "bg-[var(--color-surface)] border-transparent text-[var(--color-text)] hover:border-[var(--color-border)] hover:shadow-brutal"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border-2",
                      isActive ? "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)]" : "bg-[var(--color-surface-hover)] border-transparent text-[var(--color-text)] group-hover:border-[var(--color-border)]"
                    )}>
                      {iconName && <ThemeIcon name={iconName} className="h-6 w-6 stroke-[2.5px]" />}
                    </div>
                    <div className="flex-1">
                      <div className={cn(
                        "text-base font-bold",
                        isActive ? "text-white" : "text-[var(--color-text)]"
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
                      isActive ? "text-white" : "text-[var(--color-text)]"
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
          className="bg-[var(--color-surface)] border-4 border-[var(--color-border)] rounded-[28px] shadow-brutal-lg overflow-hidden"
          aria-label="Bottom navigation"
        >
          <div className="flex items-stretch h-16">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const iconName = ICON_MAP[item.icon] as any;
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
                        ? "bg-[var(--color-primary)] border-[var(--color-border)] shadow-brutal-sm text-white" 
                        : "bg-transparent border-transparent text-[var(--color-text)]"
                    )}
                  >
                    {iconName && <ThemeIcon name={iconName} className="h-5 w-5 stroke-[2.5px]" />}
                  </span>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider mt-1 transition-colors",
                    isActive ? "text-[var(--color-text)]" : "text-[var(--color-text)] opacity-60"
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
