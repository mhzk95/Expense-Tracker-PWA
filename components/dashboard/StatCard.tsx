/**
 * StatCard — A summary metric card for the dashboard.
 * Displays a label, value, optional trend indicator, and icon.
 */

import { cn, formatCurrency } from "@/lib/utils/helpers";
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import CountUp from "react-countup";
import { GlassCard } from "@/components/ui/GlassCard";

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
    <GlassCard className={cn("p-5 flex flex-col h-full", className)}>
      {/* Subtle gradient background glow */}
      <div className="absolute inset-0 opacity-5 bg-gradient-to-br from-violet-500 to-transparent pointer-events-none" />

      <div className="relative flex items-start justify-between gap-3 flex-1">
        {/* Text */}
        <div className="flex-1 min-w-0 flex flex-col h-full justify-between">
          <p className="text-[11px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
          <div className="mt-2 mb-1">
            <p className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">
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
          </div>
          {trend && (
            <div className={cn("flex items-center gap-1 text-[10px] sm:text-xs font-medium", trendColor)}>
              <TrendIcon className="h-3 w-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>

        {/* Icon */}
        {icon && (
          <div
            className={cn(
              "flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-[14px] bg-gradient-to-br flex items-center justify-center shadow-lg border border-white/5",
              iconColor
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
