/**
 * PageHeader — Consistent section header used at the top of each page.
 *
 * Renders a title, optional subtitle, and an optional action slot
 * (e.g., a button or badge) aligned to the right.
 */

import { cn } from "@/lib/utils/helpers";
import type { ReactNode } from "react";

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
        "flex items-start justify-between gap-4 mb-8",
        className
      )}
    >
      <div>
        <h1 className="text-3xl font-black text-[var(--color-text)] tracking-tight uppercase">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-xs font-bold text-gray-600 uppercase tracking-widest">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
