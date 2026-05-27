/**
 * StatCard — A summary metric card for the dashboard.
 * Displays a label, value, optional trend indicator, and icon.
 */

import { cn, formatCurrency } from "@/lib/utils/helpers";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import CountUp from "react-countup";

type TrendDirection = "up" | "down" | "neutral";

interface StatCardProps {
  label: string;
  value: string;
  rawValue?: number;
  /** E.g. "+12.5% vs last month" */
  trend?: string;
  trendDirection?: TrendDirection;
  icon?: ReactNode;
  /** Tailwind gradient or color class for the icon background */
  iconColor?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  rawValue,
  trend,
  trendDirection = "neutral",
  icon,
  iconColor = "from-violet-500 to-indigo-600",
  className,
}: StatCardProps) {
  const TrendIcon =
    trendDirection === "up"
      ? TrendingUp
      : trendDirection === "down"
      ? TrendingDown
      : Minus;

  const trendColor = {
    up: "text-emerald-400",
    down: "text-red-400",
    neutral: "text-slate-500",
  }[trendDirection];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 hover:border-slate-700/60 transition-all duration-200",
        className
      )}
    >
      {/* Subtle gradient background glow */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-violet-500 to-transparent" />

      <div className="relative flex items-start justify-between gap-3">
        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="mt-1.5 text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
            {rawValue !== undefined ? (
              <CountUp 
                end={rawValue} 
                duration={1.5} 
                formattingFn={(val) => formatCurrency(val)}
              />
            ) : (
              value
            )}
          </p>
          {trend && (
            <div className={cn("mt-1.5 flex items-center gap-1 text-xs font-medium", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={cn(
              "flex-shrink-0 h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
              iconColor
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
