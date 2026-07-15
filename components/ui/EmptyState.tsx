/**
 * EmptyState — Shown when a list/collection has no items to display.
 *
 * Provides a centered illustration area, title, description,
 * and an optional call-to-action button.
 */

import { cn } from "@/lib/utils/helpers";
import type { ReactNode } from "react";
import { PackageOpen } from "lucide-react";

interface EmptyStateProps {
  /** Large icon rendered above the title */
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className
      )}
    >
      {/* Icon area */}
      <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]">
        {icon ?? <PackageOpen className="h-10 w-10 text-[var(--color-text)] stroke-[2.5px]" />}
      </div>

      <h3 className="text-xl font-black text-[var(--color-text)] uppercase tracking-tight">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm font-bold text-gray-600 uppercase tracking-widest leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-8">{action}</div>}
    </div>
  );
}
