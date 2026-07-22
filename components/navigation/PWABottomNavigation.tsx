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
import { Button } from "@/components/ui/Button";
import { useComponentStyle } from "@/hooks/useComponentStyle";
import { getGeometryClasses, getSurfaceClasses } from "@/lib/theme/style-mapper";
import { useTheme } from "@/components/providers/ThemeProvider";

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

  const navStyle = useComponentStyle("navigation");
  const cardStyle = useComponentStyle("card");
  const { manifest } = useTheme();

  const navAssetStyles: React.CSSProperties = {
    ...(navStyle.surface.maskAsset && manifest.assets?.[navStyle.surface.maskAsset] ? { WebkitMaskImage: `url('${manifest.assets[navStyle.surface.maskAsset].src}')`, maskImage: `url('${manifest.assets[navStyle.surface.maskAsset].src}')`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%', WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat' } : {}),
    ...(navStyle.surface.backgroundAsset && manifest.assets?.[navStyle.surface.backgroundAsset] ? { backgroundImage: `url('${manifest.assets[navStyle.surface.backgroundAsset].src}')`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
  };

  return (
    <>
      {/* ── "More" Overlay Menu ─────────────────────────────────────────── */}
      {showMoreMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30 bg-black/80 animate-in fade-in duration-200"
            onClick={() => setShowMoreMenu(false)}
          />
          
          {/* Menu Sheet */}
          <div 
            className={cn(
              "fixed left-4 right-4 z-40 overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-200",
              getGeometryClasses(cardStyle.geometry),
              getSurfaceClasses(cardStyle.surface)
            )}
            style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          >
            <div className="p-4 flex items-center justify-between border-b border-black/10 dark:border-white/10">
              <h3 className="font-black text-[var(--color-text)] uppercase tracking-wider text-lg">More Options</h3>
              <Button 
                onClick={() => setShowMoreMenu(false)}
                variant="ghost"
                size="icon"
                className="rounded-full"
              >
                <X className="h-6 w-6 stroke-[3px]" />
              </Button>
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
                        ? "bg-[var(--theme-primary,var(--color-primary))] border-[var(--color-border)] shadow-brutal text-white" 
                        : "bg-[var(--theme-surface,var(--color-surface))] border-transparent text-[var(--color-text)] hover:border-[var(--color-border)] hover:shadow-brutal"
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
        className={cn(
          "fixed bottom-4 left-4 right-4 z-40",
          navStyle.layout === "docked" && "bottom-0 left-0 right-0"
        )}
        style={{ paddingBottom: navStyle.layout === "docked" ? "env(safe-area-inset-bottom)" : 0 }}
      >
        <nav
          className={cn(
            getGeometryClasses(navStyle.geometry),
            getSurfaceClasses(navStyle.surface),
            "h-[68px] sm:h-[72px]"
          )}
          style={{
            ...navAssetStyles,
            padding: '4px' // Subtle padding inside nav to contain elements
          }}
          aria-label="Bottom navigation"
        >
          <div className="flex items-stretch h-full">
            {BOTTOM_NAV_ITEMS.map((item) => {
              const iconName = ICON_MAP[item.icon] as any;
              const isMoreBtn = item.id === "more";
              
              const isMoreItemActive = moreItems.some(mi => pathname.startsWith(mi.href));
              const isActive = isMoreBtn 
                ? (showMoreMenu || isMoreItemActive)
                : (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

              const content = (
                <>
                  {isActive && (
                    <>
                      <div 
                        className="absolute inset-y-1 inset-x-1 sm:inset-x-2 z-0 bg-[var(--color-border)] rounded-[14px] translate-x-1 translate-y-1"
                      />
                      <div 
                        className="absolute inset-y-1 inset-x-1 sm:inset-x-2 z-10 bg-[var(--color-primary)] border-2 sm:border-[3px] border-[var(--color-border)] rounded-[14px]"
                      />
                    </>
                  )}
                  <span
                    className={cn(
                      "flex items-center justify-center transition-all duration-200 z-10 relative",
                      isActive 
                        ? "text-black" 
                        : "text-gray-500"
                    )}
                  >
                    {iconName && <ThemeIcon name={iconName} className="h-5 w-5 sm:h-6 sm:w-6 stroke-[3px]" />}
                  </span>
                  <span className={cn(
                    "text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-0.5 sm:mt-1 transition-colors z-10 relative",
                    isActive ? "text-black" : "text-gray-500"
                  )}>{item.label}</span>
                </>
              );

              const commonClasses = cn(
                "flex-1 flex flex-col items-center justify-center relative transition-transform duration-150 active:scale-95 h-full"
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
