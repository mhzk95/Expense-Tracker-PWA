/**
 * PageHeader — Consistent section header used at the top of each page.
 *
 * Renders a title, optional subtitle, and an optional action slot
 * (e.g., a button or badge) aligned to the right.
 */

"use client";

import { cn } from "@/lib/utils/helpers";
import type { ReactNode } from "react";
import { ThemeDecal } from "@/components/ui/ThemeDecal";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 mb-6 sm:mb-8 relative",
        className
      )}
    >
      <ThemeDecal slot="header-bg" />
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight sm:tracking-tighter leading-none font-display text-[var(--color-text)] mb-1 truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider sm:tracking-widest leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0 self-start sm:self-center">{action}</div>}
    </motion.div>
  );
}
