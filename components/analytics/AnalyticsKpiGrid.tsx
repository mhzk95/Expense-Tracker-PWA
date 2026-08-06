"use client";

import React from "react";
import { motion } from "framer-motion";
import { AnalyticsSummary } from "@/lib/analytics/engine";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatCurrency } from "@/lib/utils/helpers";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Flame, 
  Users,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface AnalyticsKpiGridProps {
  summary: AnalyticsSummary;
  isComparisonActive: boolean;
  onSelectSplitShortcut?: () => void;
}

export function AnalyticsKpiGrid({
  summary,
  isComparisonActive,
  onSelectSplitShortcut,
}: AnalyticsKpiGridProps) {
  const {
    netCashFlow,
    totalIncome,
    totalExpenses,
    savingsRate,
    dailyAverageExpense,
    incomeGrowthPercent,
    expenseGrowthPercent,
    netCashFlowDelta,
    splits,
  } = summary;

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, delay: i * 0.06, ease: "easeOut" as const },
    }),
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
      {/* 1. Net Cash Flow Hero Bento */}
      <motion.div
        custom={0}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        whileTap={{ scale: 0.98, y: 1 }}
        className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] flex flex-col justify-between space-y-3 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-amber-400 text-black border border-black/20 shrink-0">
              <Wallet className="w-4 h-4 stroke-[2.5px]" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Net Cash Flow
            </span>
          </div>

          {isComparisonActive && netCashFlowDelta !== 0 && (
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 font-numbers shrink-0 ${
                netCashFlowDelta >= 0
                  ? "bg-emerald-400/20 text-emerald-400 border-emerald-500"
                  : "bg-rose-500/20 text-rose-400 border-rose-500"
              }`}
            >
              {netCashFlowDelta >= 0 ? (
                <ArrowUpRight className="w-2.5 h-2.5 stroke-[3px]" />
              ) : (
                <ArrowDownRight className="w-2.5 h-2.5 stroke-[3px]" />
              )}
              {netCashFlowDelta >= 0 ? "+" : ""}{formatCurrency(netCashFlowDelta)}
            </span>
          )}
        </div>

        <div>
          <p
            className={`text-xl sm:text-2xl lg:text-3xl font-display font-black tracking-tight ${
              netCashFlow >= 0 ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {netCashFlow < 0 ? "-" : "+"}
            <AnimatedNumber
              value={Math.abs(netCashFlow)}
              formatFn={(v) => formatCurrency(v)}
            />
          </p>
        </div>

        {/* Sub-metric Inflow vs Outflow bars */}
        <div className="pt-2 border-t border-[var(--color-border)] grid grid-cols-2 gap-2 text-[10px] font-bold">
          <div className="flex items-center gap-1.5 min-w-0">
            <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
            <span className="text-gray-400 truncate">
              {formatCurrency(totalIncome)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0 justify-end">
            <TrendingDown className="w-3 h-3 text-rose-400 shrink-0" />
            <span className="text-gray-400 truncate">
              {formatCurrency(totalExpenses)}
            </span>
          </div>
        </div>
      </motion.div>

      {/* 2. Savings Rate & Liquidity Metric */}
      <motion.div
        custom={1}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        whileTap={{ scale: 0.98, y: 1 }}
        className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] flex flex-col justify-between space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-400 text-black border border-black/20 shrink-0">
              <PiggyBank className="w-4 h-4 stroke-[2.5px]" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Savings Rate
            </span>
          </div>

          <span
            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
              savingsRate >= 20
                ? "bg-emerald-400/20 text-emerald-400 border-emerald-500"
                : savingsRate > 0
                ? "bg-amber-400/20 text-amber-400 border-amber-500"
                : "bg-rose-500/20 text-rose-400 border-rose-500"
            }`}
          >
            {savingsRate >= 20 ? "Optimal" : savingsRate > 0 ? "Moderate" : "Deficit"}
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-[var(--color-text)]">
              <AnimatedNumber
                value={Math.max(0, savingsRate)}
                formatFn={(v) => Math.max(0, v).toFixed(1)}
              />
            </span>
            <span className="text-sm sm:text-base font-bold text-gray-400 font-numbers">%</span>
          </div>
        </div>

        {/* Progress gauge bar */}
        <div className="pt-2 border-t border-[var(--color-border)] space-y-1">
          <div className="h-1.5 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-emerald-400 rounded-full"
            />
          </div>
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
            Target: 20%+ of gross inflow
          </p>
        </div>
      </motion.div>

      {/* 3. Daily Average Outlay & Burn Velocity */}
      <motion.div
        custom={2}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        whileTap={{ scale: 0.98, y: 1 }}
        className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] flex flex-col justify-between space-y-3"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-rose-400 text-black border border-black/20 shrink-0">
              <Flame className="w-4 h-4 stroke-[2.5px]" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Daily Burn Pace
            </span>
          </div>

          {isComparisonActive && expenseGrowthPercent !== 0 && (
            <span
              className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border flex items-center gap-0.5 font-numbers shrink-0 ${
                expenseGrowthPercent <= 0
                  ? "bg-emerald-400/20 text-emerald-400 border-emerald-500"
                  : "bg-rose-500/20 text-rose-400 border-rose-500"
              }`}
            >
              {expenseGrowthPercent <= 0 ? "-" : "+"}
              {Math.abs(expenseGrowthPercent)}%
            </span>
          )}
        </div>

        <div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-[var(--color-text)]">
            <AnimatedNumber
              value={dailyAverageExpense}
              formatFn={(v) => formatCurrency(v)}
            />
          </p>
        </div>

        <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] font-bold text-gray-400">
          <span>{summary.txCount} total txns</span>
          <span className="text-gray-500">
            Avg {formatCurrency(summary.txCount > 0 ? totalExpenses / summary.txCount : 0)}/tx
          </span>
        </div>
      </motion.div>

      {/* 4. Group Split & Debt Receivables Bento */}
      <motion.div
        custom={3}
        variants={cardVariants}
        initial="hidden"
        animate="show"
        whileTap={{ scale: 0.98, y: 1 }}
        onClick={onSelectSplitShortcut}
        className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] flex flex-col justify-between space-y-3 cursor-pointer hover:border-[var(--color-primary)] transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-blue-400 text-black border border-black/20 shrink-0">
              <Users className="w-4 h-4 stroke-[2.5px]" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Group Debt
            </span>
          </div>

          <span className="text-[9px] font-black uppercase text-[var(--color-primary)] group-hover:underline flex items-center gap-0.5">
            Inspect <ArrowUpRight className="w-2.5 h-2.5" />
          </span>
        </div>

        <div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-display font-black text-amber-400">
            <AnimatedNumber
              value={splits.totalPendingReceivables}
              formatFn={(v) => formatCurrency(v)}
            />
          </p>
        </div>

        <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[10px] font-bold text-gray-400">
          <span>{splits.unsettledFriendsCount} Unsettled</span>
          <span className="text-emerald-400">{splits.recoveryPercentage.toFixed(0)}% Settled</span>
        </div>
      </motion.div>
    </div>
  );
}
