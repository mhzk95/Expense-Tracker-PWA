/**
 * StatCard — A summary metric card for the dashboard.
 * Displays a label, value, optional trend indicator, and icon.
 */

import { cn, formatCurrency } from "@/lib/utils/helpers";
import React, { type ReactNode } from "react";
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
  className,
}: StatCardProps) {
  const TrendIcon =
    trendDirection === "up"
      ? TrendingUp
      : trendDirection === "down"
        ? TrendingDown
        : Minus;

  const trendColor = {
    up: "text-emerald-400/90",
    down: "text-red-400/90",
    neutral: "text-slate-400",
  }[trendDirection];

  const decorativeIcon = icon && React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, {
        className: "w-full h-full stroke-[1.2]",
      })
    : icon;

  return (
    <GlassCard className={cn("group p-6 flex flex-col justify-between min-h-[120px] relative overflow-hidden transition-all duration-300", className)}>
      {/* Subtle decorative inner overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      
      {/* Decorative partially clipped icon */}
      {icon && (
        <div className="absolute -top-3 -right-3 w-20 h-20 sm:w-24 sm:h-24 text-white/[0.08] pointer-events-none transition-transform duration-500 group-hover:scale-105 group-hover:translate-x-1 group-hover:-translate-y-1">
          {decorativeIcon}
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between h-full flex-1">
        {/* Label */}
        <div>
          <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none">
            {label}
          </p>
        </div>

        {/* Value */}
        <div className="mt-3.5 mb-1 flex items-baseline">
          <p className="text-xl sm:text-2xl font-bold text-white tracking-tight whitespace-nowrap tabular-nums leading-none">
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

        {/* Trend */}
        {trend ? (
          <div className={cn("flex items-center gap-1 text-[10px] sm:text-xs font-semibold mt-1", trendColor)}>
            <TrendIcon className="h-3 w-3" />
            <span>{trend}</span>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </GlassCard>
  );
}
