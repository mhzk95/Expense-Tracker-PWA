"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DayOfWeekAnalytics } from "@/lib/analytics/engine";
import { formatCurrency, vibrate } from "@/lib/utils/helpers";
import { CalendarDays, ArrowUpRight, Sparkles } from "lucide-react";

interface SpendingTimeMatrixProps {
  dayOfWeek: DayOfWeekAnalytics[];
  totalSpent: number;
  onSelectDay?: (day: DayOfWeekAnalytics) => void;
}

export function SpendingTimeMatrix({
  dayOfWeek,
  totalSpent,
  onSelectDay,
}: SpendingTimeMatrixProps) {
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);

  // Re-order so Monday comes first (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
  const orderedDays = [
    dayOfWeek[1], // Mon
    dayOfWeek[2], // Tue
    dayOfWeek[3], // Wed
    dayOfWeek[4], // Thu
    dayOfWeek[5], // Fri
    dayOfWeek[6], // Sat
    dayOfWeek[0], // Sun
  ];

  const maxAmount = Math.max(...orderedDays.map((d) => d.amount), 1);

  // Compute Weekend vs Weekday breakdown
  const weekendTotal = (dayOfWeek[0]?.amount || 0) + (dayOfWeek[6]?.amount || 0);
  const weekdayTotal = totalSpent - weekendTotal;
  const weekendPct = totalSpent > 0 ? (weekendTotal / totalSpent) * 100 : 0;
  const weekdayPct = totalSpent > 0 ? (weekdayTotal / totalSpent) * 100 : 0;

  const handleDayClick = (day: DayOfWeekAnalytics) => {
    vibrate([15]);
    setSelectedDayIndex(day.dayIndex);
    if (onSelectDay) {
      onSelectDay(day);
    }
  };

  const formatCompactVal = (val: number) => {
    if (val === 0) return "";
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${Math.round(val)}`;
  };

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-400 text-black border border-black/20 shrink-0">
              <CalendarDays className="w-3.5 h-3.5 stroke-[2.5px]" />
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              Day-of-Week Rhythm
            </h3>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Cyclical spending patterns across the week
          </p>
        </div>

        {/* Weekend vs Weekday Ratio Pill */}
        <div className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 shrink-0">
          Weekend: {Math.round(weekendPct)}%
        </div>
      </div>

      {/* 7-Day Vertical Bar Matrix */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2 pt-1 items-end min-h-[140px]">
        {orderedDays.map((day) => {
          const isWeekend = day.dayIndex === 0 || day.dayIndex === 6;
          const heightRatio = day.amount / maxAmount;
          const isPeak = day.amount === maxAmount && day.amount > 0;
          const isSelected = selectedDayIndex === day.dayIndex;

          return (
            <motion.div
              key={day.dayName}
              onClick={() => handleDayClick(day)}
              whileTap={{ scale: 0.94 }}
              className="flex flex-col items-center gap-1.5 cursor-pointer group min-w-0"
            >
              {/* Tooltip amount on hover / peak indicator */}
              <div className="text-center min-h-[14px] w-full px-0.5">
                <span className="text-[8px] sm:text-[9px] font-black font-numbers text-gray-400 group-hover:text-[var(--color-primary)] truncate block">
                  {formatCompactVal(day.amount)}
                </span>
              </div>

              {/* Bar Container */}
              <div
                className={`w-full h-24 bg-[var(--color-bg)] border-2 rounded-xl relative overflow-hidden flex items-end p-0.5 sm:p-1 transition-colors ${
                  isSelected
                    ? "border-[var(--color-primary)] shadow-sm"
                    : "border-[var(--color-border)] group-hover:border-gray-500"
                }`}
              >
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(6, heightRatio * 100)}%` }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className={`w-full rounded-lg transition-colors ${
                    isPeak
                      ? "bg-[var(--color-primary)] border border-black/30 shadow-xs"
                      : isWeekend
                      ? "bg-indigo-400/80 group-hover:bg-indigo-400"
                      : "bg-emerald-400/80 group-hover:bg-emerald-400"
                  }`}
                />
              </div>

              {/* Day Name Label */}
              <div className="text-center w-full">
                <span
                  className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider block truncate ${
                    isPeak
                      ? "text-[var(--color-primary)] underline"
                      : isWeekend
                      ? "text-indigo-400"
                      : "text-gray-400"
                  }`}
                >
                  {day.dayName}
                </span>
                <span className="text-[8px] font-bold text-gray-500 block truncate">
                  {day.txCount} tx
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Weekend vs Weekday Mini Progress Bar */}
      <div className="pt-2 border-t border-[var(--color-border)] space-y-1.5">
        <div className="flex justify-between text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-gray-400">
          <span className="text-emerald-400 truncate">Weekdays: {formatCurrency(weekdayTotal)} ({weekdayPct.toFixed(0)}%)</span>
          <span className="text-indigo-400 truncate text-right">Weekends: {formatCurrency(weekendTotal)} ({weekendPct.toFixed(0)}%)</span>
        </div>
        <div className="h-2 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full overflow-hidden flex">
          <div
            style={{ width: `${weekdayPct}%` }}
            className="h-full bg-emerald-400 transition-all duration-500"
          />
          <div
            style={{ width: `${weekendPct}%` }}
            className="h-full bg-indigo-400 transition-all duration-500"
          />
        </div>
      </div>
    </div>
  );
}
