/**
 * PageHeader — Consistent section header used at the top of each page.
 *
 * Renders a title, optional subtitle, and an optional action slot
 * (e.g., a button or badge) aligned to the right.
 */

import { cn } from "@/lib/utils/helpers";
import type { ReactNode } from "react";
import { ThemeDecal } from "@/components/ui/ThemeDecal";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 mb-8 relative",
        className
      )}
    >
      <ThemeDecal slot="header-bg" />
      <div>
        <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tighter leading-none font-display text-[var(--color-text)] transform -rotate-2 origin-left mb-1">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
