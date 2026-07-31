"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BOTTOM_NAV_ITEMS, NAV_ITEMS } from "@/lib/constants/app";
import { cn } from "@/lib/utils/helpers";
import { X, ChevronRight } from "lucide-react";
import { ThemeIcon } from "@/components/ui/ThemeIcon";
import { motion, AnimatePresence } from "framer-motion";

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
      <AnimatePresence>
        {showMoreMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMoreMenu(false)}
            />

            {/* Slide-up Menu Sheet */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-4 right-4 z-40 overflow-hidden bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[8px_8px_0px_0px_var(--color-border)] rounded-[32px]"
              style={{ bottom: "calc(6rem + env(safe-area-inset-bottom))" }}
            >
              <div className="p-5 flex items-center justify-between border-b-[3px] border-[var(--color-border)] bg-[var(--color-primary)]">
                <h3 className="font-black text-black uppercase tracking-widest text-lg">More Options</h3>
                <motion.button
                  whileTap={{ scale: 0.9, rotate: 90 }}
                  onClick={() => setShowMoreMenu(false)}
                  className="h-10 w-10 rounded-full border-[3px] border-black bg-white flex items-center justify-center text-black hover:bg-gray-200 transition-colors"
                >
                  <X className="h-6 w-6 stroke-[4px]" />
                </motion.button>
              </div>
              <div className="p-4 space-y-3 bg-[var(--color-bg)] max-h-[50vh] overflow-y-auto">
                {moreItems.map((item, i) => {
                  const iconName = ICON_MAP[item.icon] as any;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3 rounded-[20px] border-[3px] border-[var(--color-border)] transition-colors group",
                          isActive
                            ? "bg-[var(--color-primary)] shadow-[4px_4px_0px_0px_var(--color-border)] text-black"
                            : "bg-[var(--color-surface)] shadow-[4px_4px_0px_0px_var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
                        )}
                      >
                        <div className={cn(
                          "h-12 w-12 rounded-full flex items-center justify-center shrink-0 border-[3px] border-[var(--color-border)]",
                          isActive ? "bg-white text-black" : "bg-[var(--color-surfaceHover)] text-[var(--color-text)]"
                        )}>
                          {iconName && <ThemeIcon name={iconName} className="h-6 w-6 stroke-[3px]" />}
                        </div>
                        <div className="flex-1">
                          <div className={cn(
                            "text-base font-black uppercase tracking-wider",
                            isActive ? "text-black" : "text-[var(--color-text)]"
                          )}>
                            {item.label}
                          </div>
                          <div className={cn(
                            "text-xs font-bold mt-0.5",
                            isActive ? "text-black/70" : "text-gray-500"
                          )}>{item.description}</div>
                        </div>
                        <ChevronRight className={cn(
                          "h-6 w-6 stroke-[4px]",
                          isActive ? "text-black" : "text-[var(--color-text)]"
                        )} />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Pill-Based Neo-Brutalist Bottom Navigation ───────────────────────────────────────── */}
      <div
        className="fixed bottom-4 left-0 right-0 z-40 pointer-events-none flex justify-center px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <motion.nav
          layout
          transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
          className="h-[60px] sm:h-[72px] w-auto max-w-[calc(100vw-1rem)] flex items-center justify-center gap-1.5 p-1.5 pointer-events-auto bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)] sm:shadow-[6px_6px_0px_0px_var(--color-border)] rounded-full"
          aria-label="Bottom navigation"
        >
          {BOTTOM_NAV_ITEMS.map((item) => {
            const iconName = ICON_MAP[item.icon] as any;
            const isMoreBtn = item.id === "more";

            const isMoreItemActive = moreItems.some(mi => pathname.startsWith(mi.href));
            const isActive = isMoreBtn
              ? (showMoreMenu || isMoreItemActive)
              : (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

            const InnerContent = () => (
              <AnimatePresence mode="wait">
                {isActive ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: "spring", bounce: 0.6, duration: 0.5 }}
                    className="flex items-center gap-1.5"
                  >
                    <span className="text-black font-black text-lg leading-none mt-[-2px]">•</span>
                    <span className="text-black font-black uppercase tracking-widest text-[10px] sm:text-[11px] whitespace-nowrap">
                      {item.label}
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="inactive"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ type: "spring", bounce: 0.6, duration: 0.5 }}
                    className="flex items-center justify-center w-full h-full"
                  >
                    {iconName && <ThemeIcon name={iconName} className="h-5 w-5 stroke-[3px]" />}
                  </motion.div>
                )}
              </AnimatePresence>
            );

            if (isMoreBtn) {
              return (
                <motion.button
                  layout
                  transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
                  key={item.id}
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: "0px 0px 0px 0px var(--color-border)" }}
                  className={cn(
                    "h-[44px] sm:h-[52px] flex items-center justify-center rounded-full border-[3px] border-[var(--color-border)] transition-colors duration-200 overflow-hidden shrink-0",
                    isActive
                      ? "bg-[var(--color-primary)] shadow-[2px_2px_0px_0px_var(--color-border)] sm:shadow-[3px_3px_0px_0px_var(--color-border)] px-3 sm:px-4"
                      : "w-[44px] sm:w-[52px] bg-[var(--color-surfaceHover)] text-[var(--color-text)] shadow-[2px_2px_0px_0px_var(--color-border)] sm:shadow-[3px_3px_0px_0px_var(--color-border)] hover:bg-[var(--color-bg)]"
                  )}
                  aria-label="More options"
                  aria-expanded={showMoreMenu}
                >
                  <InnerContent />
                </motion.button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                className="shrink-0"
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                passHref
              >
                <motion.div
                  layout
                  transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
                  whileTap={{ scale: 0.9, x: 2, y: 2, boxShadow: "0px 0px 0px 0px var(--color-border)" }}
                  className={cn(
                    "h-[44px] sm:h-[52px] flex items-center justify-center rounded-full border-[3px] border-[var(--color-border)] transition-colors duration-200 cursor-pointer overflow-hidden shrink-0",
                    isActive
                      ? "bg-[var(--color-primary)] shadow-[2px_2px_0px_0px_var(--color-border)] sm:shadow-[3px_3px_0px_0px_var(--color-border)] px-3 sm:px-4"
                      : "w-[44px] sm:w-[52px] bg-[var(--color-surfaceHover)] text-[var(--color-text)] shadow-[2px_2px_0px_0px_var(--color-border)] sm:shadow-[3px_3px_0px_0px_var(--color-border)] hover:bg-[var(--color-bg)]"
                  )}
                >
                  <InnerContent />
                </motion.div>
              </Link>
            );
          })}
        </motion.nav>
      </div>
    </>
  );
}
