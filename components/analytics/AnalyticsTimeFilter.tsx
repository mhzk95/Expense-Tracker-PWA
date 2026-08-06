"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TimeRangeKey, DateRange } from "@/lib/analytics/engine";
import { CategoryEntity } from "@/lib/db/indexeddb";
import { vibrate, getCategoryIcon } from "@/lib/utils/helpers";
import { 
  Calendar, 
  ArrowLeftRight, 
  Filter, 
  X, 
  Check, 
  ChevronDown,
  Sparkles
} from "lucide-react";

interface AnalyticsTimeFilterProps {
  activeKey: TimeRangeKey;
  onSelectKey: (key: TimeRangeKey) => void;
  isComparisonActive: boolean;
  onToggleComparison: () => void;
  currentRange: DateRange;
  prevRange: DateRange;
  categories: CategoryEntity[];
  selectedCategoryIds: string[];
  onToggleCategory: (id: string) => void;
  onResetFilters: () => void;
  customStart?: Date;
  customEnd?: Date;
  onSetCustomDates: (start: Date, end: Date) => void;
}

const TIME_RANGES: { key: TimeRangeKey; label: string; shortLabel: string }[] = [
  { key: "7D", label: "7 Days", shortLabel: "7D" },
  { key: "30D", label: "30 Days", shortLabel: "30D" },
  { key: "THIS_MONTH", label: "This Month", shortLabel: "Month" },
  { key: "LAST_MONTH", label: "Last Month", shortLabel: "Prior" },
  { key: "3M", label: "Quarter (3M)", shortLabel: "3M" },
  { key: "YTD", label: "Year to Date", shortLabel: "YTD" },
  { key: "1Y", label: "12 Months", shortLabel: "1Y" },
  { key: "ALL", label: "All Time", shortLabel: "All" },
];

export function AnalyticsTimeFilter({
  activeKey,
  onSelectKey,
  isComparisonActive,
  onToggleComparison,
  currentRange,
  prevRange,
  categories,
  selectedCategoryIds,
  onToggleCategory,
  onResetFilters,
  customStart,
  customEnd,
  onSetCustomDates,
}: AnalyticsTimeFilterProps) {
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [tempStart, setTempStart] = useState(
    customStart ? customStart.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [tempEnd, setTempEnd] = useState(
    customEnd ? customEnd.toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  );

  const handleRangeClick = (key: TimeRangeKey) => {
    vibrate([15]);
    if (key === "CUSTOM") {
      setShowCustomModal(true);
    } else {
      onSelectKey(key);
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempStart || !tempEnd) return;
    vibrate([25]);
    onSetCustomDates(new Date(tempStart), new Date(tempEnd));
    onSelectKey("CUSTOM");
    setShowCustomModal(false);
  };

  const activeFiltersCount = selectedCategoryIds.length;

  return (
    <div className="space-y-3">
      {/* Top Bar: Time Range Pills & Quick Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Horizontal Scrollable Time Range Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl overflow-x-auto scrollbar-none shadow-sm">
          {TIME_RANGES.map((item) => {
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleRangeClick(item.key)}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 cursor-pointer ${
                  isActive
                    ? "text-black"
                    : "text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] opacity-75 hover:opacity-100"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTimeRange"
                    className="absolute inset-0 bg-[var(--color-primary)] rounded-xl border border-black/20 shadow-sm"
                    transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{item.shortLabel}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => handleRangeClick("CUSTOM")}
            className={`relative px-2.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shrink-0 cursor-pointer flex items-center gap-1 ${
              activeKey === "CUSTOM"
                ? "text-black"
                : "text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] opacity-75 hover:opacity-100"
            }`}
          >
            {activeKey === "CUSTOM" && (
              <motion.div
                layoutId="activeTimeRange"
                className="absolute inset-0 bg-[var(--color-primary)] rounded-xl border border-black/20 shadow-sm"
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}
            <Calendar className="w-3 h-3 relative z-10" />
            <span className="relative z-10">Custom</span>
          </button>
        </div>

        {/* Right Actions: Comparison Toggle & Category Filter Button */}
        <div className="flex items-center gap-2">
          {/* Comparison Mode Toggle */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              vibrate([15]);
              onToggleComparison();
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer shadow-sm ${
              isComparisonActive
                ? "bg-amber-400/15 border-amber-500 text-amber-500 dark:text-amber-400"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-gray-500 hover:text-[var(--color-text)]"
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 stroke-[2.5px]" />
            <span className="hidden sm:inline">Compare</span>
            <span className="text-[10px] opacity-75">{isComparisonActive ? "ON" : "OFF"}</span>
          </motion.button>

          {/* Category Filter Trigger */}
          <motion.button
            type="button"
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              vibrate([15]);
              setShowCategoryDrawer(!showCategoryDrawer);
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider border-2 transition-all cursor-pointer shadow-sm ${
              activeFiltersCount > 0
                ? "bg-[var(--color-primary)] text-black border-[var(--color-border)] font-black"
                : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
            }`}
          >
            <Filter className="w-3.5 h-3.5 stroke-[2.5px]" />
            <span>Categories</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-black text-white text-[10px] flex items-center justify-center font-black">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showCategoryDrawer ? "rotate-180" : ""}`} />
          </motion.button>
        </div>
      </div>

      {/* Active Date Range Sub-label & Comparison Window Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
          <span>
            {currentRange.start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} —{" "}
            {currentRange.end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>

        {isComparisonActive && activeKey !== "ALL" && (
          <div className="text-[10px] text-amber-500/90 dark:text-amber-400/90 flex items-center gap-1">
            <span>vs</span>
            <span>
              {prevRange.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} —{" "}
              {prevRange.end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
        )}
      </div>

      {/* Expandable Category Multi-Select Filter Tray */}
      <AnimatePresence>
        {showCategoryDrawer && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl p-3 shadow-md space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Filter by Category ({selectedCategoryIds.length > 0 ? `${selectedCategoryIds.length} active` : "All Selected"})
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    vibrate([15]);
                    onResetFilters();
                  }}
                  className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
              {categories.map((cat) => {
                const isSelected = selectedCategoryIds.includes(cat.id);
                const CatIcon = getCategoryIcon(cat.icon);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      vibrate([15]);
                      onToggleCategory(cat.id);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                      isSelected
                        ? "border-black shadow-sm"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surfaceHover)] opacity-70 hover:opacity-100"
                    }`}
                    style={{
                      backgroundColor: isSelected ? cat.color || "#facc15" : "transparent",
                      color: isSelected ? "#000" : "var(--color-text)",
                    }}
                  >
                    <CatIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
                    <span className="truncate max-w-[120px]">{cat.name}</span>
                    {isSelected && <Check className="w-3 h-3 stroke-[3px]" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Date Range Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-xs"
              onClick={() => setShowCustomModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded-2xl p-5 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-[var(--color-text)]">
                  Custom Date Range
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="p-1 rounded-lg text-gray-500 hover:text-[var(--color-text)]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleApplyCustom} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={tempStart}
                    onChange={(e) => setTempStart(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl text-xs font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={tempEnd}
                    onChange={(e) => setTempEnd(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-xl text-xs font-bold text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="flex-1 py-2 rounded-xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] text-xs font-black uppercase tracking-wider text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-[var(--color-primary)] text-black border-2 border-black text-xs font-black uppercase tracking-wider shadow-sm hover:opacity-95"
                  >
                    Apply Range
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
