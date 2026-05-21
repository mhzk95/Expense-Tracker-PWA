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
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/60">
        {icon ?? <PackageOpen className="h-9 w-9 text-slate-500" />}
      </div>

      <h3 className="text-lg font-semibold text-white">{title}</h3>

      {description && (
        <p className="mt-2 max-w-sm text-sm text-slate-400 leading-relaxed">
          {description}
        </p>
      )}

      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
