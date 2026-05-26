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

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS } from "@/lib/constants/app";
import { cn } from "@/lib/utils/helpers";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Wallet,
  BookImage,
  ShieldAlert,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ArrowLeftRight,
  Target,
  BarChart3,
  Wallet,
  BookImage,
  ShieldAlert,
};

export function PWABottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800/60"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Bottom navigation"
    >
      <div className="flex items-stretch h-16">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = ICON_MAP[item.icon];
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 relative transition-all duration-150 active:scale-95",
                isActive ? "text-violet-400" : "text-slate-500"
              )}
              aria-current={isActive ? "page" : undefined}
              aria-label={item.label}
            >
              {/* Active indicator bar at top */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-b-full bg-violet-400" />
              )}

              {/* Icon with active background */}
              <span
                className={cn(
                  "flex items-center justify-center h-7 w-7 rounded-xl transition-all duration-150",
                  isActive ? "bg-violet-500/15" : ""
                )}
              >
                {Icon && <Icon className="h-5 w-5" />}
              </span>

              {/* Label */}
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
