/**
 * StatCard — A summary metric card for the dashboard.
 * Displays a label, value, optional trend indicator, and icon.
 */

import { cn, formatCurrency } from "@/lib/utils/helpers";
import React, { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import CountUp from "react-countup";
import { Card } from "@/components/ui/Card";

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
    up: "text-emerald-600",
    down: "text-red-600",
    neutral: "text-gray-500",
  }[trendDirection];

  const decorativeIcon = icon && React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, {
        className: "w-full h-full stroke-[1.2]",
      })
    : icon;

  return (
    <Card className={cn("group p-4 sm:p-6 flex flex-col justify-between min-h-[100px] sm:min-h-[120px] relative overflow-hidden transition-all duration-300", className)}>
      {/* Decorative inner borders or harsh lines could go here */}
      
      {/* Decorative partially clipped icon */}
      {icon && (
        <div className="absolute -top-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 text-black/[0.05] pointer-events-none transition-transform duration-500 group-hover:scale-105 group-hover:translate-x-1 group-hover:-translate-y-1">
          {decorativeIcon}
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-between h-full flex-1">
        {/* Label */}
        <div>
          <p className="text-xs font-black text-black uppercase tracking-widest leading-none text-balance">
            {label}
          </p>
        </div>

        {/* Value */}
        <div className="mt-2 sm:mt-4 mb-1 sm:mb-2 flex items-baseline">
          <p className="text-xl sm:text-3xl font-black text-black tracking-tight whitespace-nowrap tabular-nums leading-none">
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
          <div className={cn("flex items-center gap-1.5 text-sm font-semibold mt-1", trendColor)}>
            <TrendIcon className="h-4 w-4" />
            <span>{trend}</span>
          </div>
        ) : (
          <div className="h-4" />
        )}
      </div>
    </Card>
  );
}
