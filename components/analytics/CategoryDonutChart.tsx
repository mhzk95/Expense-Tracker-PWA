"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CategoryAnalyticsItem } from "@/lib/analytics/engine";
import { formatCurrency, vibrate, getCategoryIcon } from "@/lib/utils/helpers";
import { PieChart, ArrowUpRight, ArrowDownRight, Tag } from "lucide-react";

interface CategoryDonutChartProps {
  categories: CategoryAnalyticsItem[];
  totalSpent: number;
  onSelectCategory?: (cat: CategoryAnalyticsItem) => void;
}

export function CategoryDonutChart({
  categories,
  totalSpent,
  onSelectCategory,
}: CategoryDonutChartProps) {
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null);

  // Group top 6 categories + combine others if > 6
  const { displayCategories, donutSegments } = useMemo(() => {
    if (!categories || categories.length === 0) {
      return { displayCategories: [], donutSegments: [] };
    }

    const topList = categories.slice(0, 6);
    const others = categories.slice(6);

    let display = [...topList];
    if (others.length > 0) {
      const otherAmount = others.reduce((s, c) => s + c.amount, 0);
      const otherTxCount = others.reduce((s, c) => s + c.txCount, 0);
      display.push({
        id: "others",
        name: `Other (${others.length})`,
        color: "#64748b",
        amount: otherAmount,
        percentage: totalSpent > 0 ? (otherAmount / totalSpent) * 100 : 0,
        txCount: otherTxCount,
        avgTxAmount: otherTxCount > 0 ? otherAmount / otherTxCount : 0,
        prevAmount: 0,
        changePercent: 0,
      });
    }

    // Compute SVG donut arcs
    const radius = 68;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    const segments = display.map((cat) => {
      const segmentRatio = totalSpent > 0 ? cat.amount / totalSpent : 0;
      const strokeDasharray = `${segmentRatio * circumference} ${circumference}`;
      const strokeDashoffset = -accumulatedOffset;
      accumulatedOffset += segmentRatio * circumference;

      return {
        ...cat,
        radius,
        circumference,
        strokeDasharray,
        strokeDashoffset,
      };
    });

    return { displayCategories: display, donutSegments: segments };
  }, [categories, totalSpent]);

  const activeCategory = useMemo(() => {
    if (hoveredCatId) {
      return displayCategories.find((c) => c.id === hoveredCatId) || null;
    }
    return null;
  }, [hoveredCatId, displayCategories]);

  const handleCategoryClick = (cat: CategoryAnalyticsItem) => {
    vibrate([15]);
    if (hoveredCatId === cat.id) {
      if (onSelectCategory) onSelectCategory(cat);
    } else {
      setHoveredCatId(cat.id);
    }
  };

  const CenterIcon = activeCategory?.icon
    ? getCategoryIcon(activeCategory.icon)
    : PieChart;

  return (
    <div className="p-3.5 sm:p-5 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-dashed border-[var(--color-border)]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-400 text-black border border-black/20 shrink-0">
              <PieChart className="w-3.5 h-3.5 stroke-[2.5px]" />
            </span>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              Category Allocation
            </h3>
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            Spending distribution by bucket
          </p>
        </div>

        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[var(--color-bg)] border border-[var(--color-border)] text-gray-400 shrink-0">
          {categories.length} Buckets
        </span>
      </div>

      {totalSpent === 0 ? (
        <div className="py-12 text-center text-gray-400 font-black uppercase text-xs">
          No expense transactions recorded in this period.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Donut Chart Ring */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-1">
            <div className="relative w-44 h-44 sm:w-52 sm:h-52">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
                {/* Background Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r="68"
                  fill="transparent"
                  stroke="var(--color-bg)"
                  strokeWidth="16"
                />

                {/* Donut Segments with Morphing Pop Animation */}
                {donutSegments.map((segment) => {
                  const isHovered = hoveredCatId === segment.id;
                  return (
                    <motion.circle
                      key={segment.id}
                      cx="90"
                      cy="90"
                      r={segment.radius}
                      fill="transparent"
                      stroke={segment.color}
                      strokeWidth={isHovered ? "22" : "16"}
                      strokeDasharray={segment.strokeDasharray}
                      strokeDashoffset={segment.strokeDashoffset}
                      strokeLinecap="round"
                      className="cursor-pointer transition-all duration-200"
                      onMouseEnter={() => setHoveredCatId(segment.id)}
                      onMouseLeave={() => setHoveredCatId(null)}
                      onClick={() => handleCategoryClick(segment)}
                      initial={{ strokeDasharray: `0 ${segment.circumference}` }}
                      animate={{ 
                        strokeDasharray: segment.strokeDasharray,
                        scale: isHovered ? 1.04 : 1,
                        originX: "90px",
                        originY: "90px"
                      }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  );
                })}
              </svg>

              {/* Dynamic Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2 pointer-events-none">
                <AnimatePresence mode="wait">
                  {activeCategory ? (
                    <motion.div
                      key={activeCategory.id}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-0.5 max-w-[110px]"
                    >
                      <div className="flex justify-center mb-0.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-black border border-black/20 shrink-0"
                          style={{ backgroundColor: activeCategory.color }}
                        >
                          <CenterIcon className="w-3 h-3 stroke-[2.5px]" />
                        </div>
                      </div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 truncate">
                        {activeCategory.name}
                      </p>
                      <p className="text-xs sm:text-sm font-display font-black text-[var(--color-text)] truncate">
                        {formatCurrency(activeCategory.amount)}
                      </p>
                      <p className="text-[10px] font-black text-amber-400 font-numbers">
                        {activeCategory.percentage.toFixed(1)}%
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="default"
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-0.5 max-w-[110px]"
                    >
                      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                        Total Spend
                      </p>
                      <p className="text-xs sm:text-sm font-display font-black text-[var(--color-text)] truncate">
                        {formatCurrency(totalSpent)}
                      </p>
                      <p className="text-[8px] font-bold text-gray-500 uppercase">
                        Tap slice to inspect
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Category List Breakdown */}
          <div className="lg:col-span-7 space-y-2">
            {displayCategories.map((cat, idx) => {
              const isHovered = hoveredCatId === cat.id;
              const CatIcon = cat.icon ? getCategoryIcon(cat.icon) : Tag;

              return (
                <motion.div
                  key={cat.id}
                  onMouseEnter={() => setHoveredCatId(cat.id)}
                  onMouseLeave={() => setHoveredCatId(null)}
                  onClick={() => {
                    vibrate([15]);
                    if (onSelectCategory && cat.id !== "others") {
                      onSelectCategory(cat);
                    }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                    isHovered
                      ? "bg-[var(--color-surfaceHover)] border-[var(--color-primary)] shadow-sm"
                      : "bg-[var(--color-bg)] border-[var(--color-border)] hover:border-gray-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[10px] font-black text-gray-500 w-3.5 shrink-0">
                        #{idx + 1}
                      </span>
                      <div
                        className="w-5 h-5 rounded-lg flex items-center justify-center text-black shrink-0 border border-black/20"
                        style={{ backgroundColor: cat.color }}
                      >
                        <CatIcon className="w-3 h-3 stroke-[2.5px]" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text)] truncate min-w-0">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {cat.changePercent !== 0 && cat.prevAmount > 0 && (
                        <span
                          className={`text-[8px] sm:text-[9px] font-black px-1 sm:px-1.5 py-0.5 rounded border flex items-center gap-0.5 ${
                            cat.changePercent > 0
                              ? "bg-rose-500/15 border-rose-500 text-rose-400"
                              : "bg-emerald-400/15 border-emerald-500 text-emerald-400"
                          }`}
                        >
                          {cat.changePercent > 0 ? (
                            <ArrowUpRight className="w-2 h-2" />
                          ) : (
                            <ArrowDownRight className="w-2 h-2" />
                          )}
                          {Math.abs(cat.changePercent)}%
                        </span>
                      )}

                      <span className="text-xs font-display font-black text-[var(--color-text)]">
                        {formatCurrency(cat.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar & Sub-metrics */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.percentage}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    </div>

                    <div className="flex justify-between text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                      <span className="truncate">{cat.txCount} txns · Avg {formatCurrency(cat.avgTxAmount)}</span>
                      <span className="font-numbers shrink-0">{cat.percentage.toFixed(1)}% share</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
