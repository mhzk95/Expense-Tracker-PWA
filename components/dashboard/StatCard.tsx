/**
 * StatCard — A summary metric card for the dashboard.
 * Displays a label, value, optional trend indicator, and icon.
 */

import { cn, formatCurrency } from "@/lib/utils/helpers";
import React, { type ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import CountUp from "react-countup";
import { Card } from "@/components/ui/Card";
import { ThemeDecal } from "@/components/ui/ThemeDecal";

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
  variant?: "primary" | "secondary" | "danger" | "ghost" | "surface";
}

export function StatCard({
  label,
  value,
  rawValue,
  trend,
  trendDirection = "neutral",
  icon,
  className,
  variant = "surface",
}: StatCardProps) {
  const TrendIcon =
    trendDirection === "up"
      ? TrendingUp
      : trendDirection === "down"
        ? TrendingDown
        : Minus;

  const trendColor = {
    up: "text-emerald-500",
    down: "text-red-500",
    neutral: "text-gray-500",
  }[trendDirection];

  const shadowClass = {
    up: "shadow-[3px_3px_0px_0px_var(--color-success,#10b981)]",
    down: "shadow-[3px_3px_0px_0px_var(--color-danger,#ef4444)]",
    neutral: variant === "primary" ? "shadow-[3px_3px_0px_0px_var(--color-primary,#facc15)]" : "shadow-[3px_3px_0px_0px_var(--color-border)]",
  }[trendDirection];

  const decorativeIcon = icon && React.isValidElement(icon)
    ? React.cloneElement(icon as React.ReactElement<any>, {
        className: "w-full h-full stroke-[1.2]",
      })
    : icon;

  return (
    <Card variant={variant} className={cn("group px-4 py-3 flex flex-col justify-center min-h-[90px] border-2 border-[var(--color-border)] relative overflow-hidden transition-all duration-300", shadowClass, className)}>
      <ThemeDecal slot="stat-card-tr" />
      
      {/* Decorative partially clipped icon */}
      {icon && (
        <div className="absolute -top-2 -right-2 w-16 h-16 text-[var(--color-text)]/[0.05] pointer-events-none transition-transform duration-500 group-hover:scale-105 group-hover:translate-x-1 group-hover:-translate-y-1">
          {decorativeIcon}
        </div>
      )}

      <div className="relative z-10 flex flex-col justify-center h-full flex-1">
        {/* Label */}
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-0.5 leading-none">
            {label}
          </p>
        </div>

        {/* Value */}
        <div className="flex items-baseline">
          <p className="text-2xl sm:text-3xl font-display font-black leading-none tracking-tighter text-[var(--color-text)] tabular-nums">
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
          <div className={cn("flex items-center gap-1 text-[10px] font-black uppercase tracking-widest mt-1.5", trendColor)}>
            <TrendIcon className="h-3 w-3 stroke-[3px]" />
            <span>{trend}</span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
