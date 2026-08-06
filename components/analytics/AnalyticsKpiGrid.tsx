"use client";

import React from "react";
import { motion } from "framer-motion";
import { AnalyticsSummary } from "@/lib/analytics/engine";
import { formatCurrency } from "@/lib/utils/helpers";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Flame, 
  Users, 
  ShieldCheck, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Minus
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
    totalIncome,
    totalExpenses,
    netCashFlow,
    savingsRate,
    incomeGrowthPercent,
    expenseGrowthPercent,
    dailyAverageExpense,
    avgTransactionSize,
    projectedMonthEndExpense,
    splits,
  } = summary;

  const isNetPositive = netCashFlow >= 0;

  // Savings Rate Status Badge
  const getSavingsStatus = (rate: number) => {
    if (rate >= 35) return { label: "Elite Saver", color: "bg-emerald-400 text-black", icon: ShieldCheck };
    if (rate >= 20) return { label: "Healthy", color: "bg-emerald-400/20 text-emerald-400 border border-emerald-500", icon: ShieldCheck };
    if (rate >= 5) return { label: "Modest", color: "bg-amber-400/20 text-amber-400 border border-amber-500", icon: Minus };
    if (rate >= 0) return { label: "Break-even", color: "bg-yellow-400/20 text-yellow-400 border border-yellow-500", icon: Minus };
    return { label: "Deficit", color: "bg-rose-500 text-white", icon: AlertTriangle };
  };

  const savingsStatus = getSavingsStatus(savingsRate);
  const StatusIcon = savingsStatus.icon;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Net Cash Flow Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_${
          isNetPositive ? "var(--color-success,#10b981)" : "var(--color-danger,#ef4444)"
        }] flex flex-col justify-between relative overflow-hidden`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-xl border border-black/20 ${isNetPositive ? "bg-emerald-400 text-black" : "bg-red-400 text-black"}`}>
              <Wallet className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Net Cash Flow
            </span>
          </div>

          {isComparisonActive && (
            <span
              className={`inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-md border ${
                netCashFlow >= summary.prevNetCashFlow
                  ? "bg-emerald-400/15 border-emerald-500 text-emerald-400"
                  : "bg-rose-500/15 border-rose-500 text-rose-400"
              }`}
            >
              {netCashFlow >= summary.prevNetCashFlow ? (
                <ArrowUpRight className="w-3 h-3 stroke-[3px]" />
              ) : (
                <ArrowDownRight className="w-3 h-3 stroke-[3px]" />
              )}
              {isNetPositive ? "+" : ""}
              ₹{Math.abs(summary.netCashFlowDelta).toFixed(0)}
            </span>
          )}
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-display font-black text-[var(--color-text)] tracking-tight leading-none">
            <AnimatedNumber
              value={netCashFlow}
              formatFn={(val) => `${val >= 0 ? "+" : ""}${formatCurrency(val)}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[var(--color-border)] text-[10px] font-bold text-gray-400">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="truncate">In: {formatCurrency(totalIncome)}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate justify-end">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
              <span className="truncate">Out: {formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. Savings Rate & Financial Health Meter */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-primary,#facc15)] flex flex-col justify-between relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl border border-black/20 bg-amber-400 text-black">
              <TrendingUp className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Savings Rate
            </span>
          </div>

          <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${savingsStatus.color}`}>
            <StatusIcon className="w-2.5 h-2.5" />
            {savingsStatus.label}
          </span>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-display font-black text-[var(--color-text)] tracking-tight leading-none flex items-baseline gap-1">
            <AnimatedNumber
              value={savingsRate}
              formatFn={(val) => `${val.toFixed(1)}%`}
            />
            <span className="text-xs font-bold text-gray-500">saved</span>
          </div>

          {/* Progress Bar of Savings */}
          <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] space-y-1">
            <div className="h-2 w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full"
              />
            </div>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider flex justify-between">
              <span>Goal: 20%+</span>
              <span>{savingsRate >= 20 ? "Target Met" : "Below Target"}</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* 3. Daily Burn Velocity & Outlay Pace */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] flex flex-col justify-between relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl border border-black/20 bg-rose-400 text-black">
              <Flame className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Daily Burn Pace
            </span>
          </div>

          {isComparisonActive && (
            <span
              className={`inline-flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-md border ${
                expenseGrowthPercent <= 0
                  ? "bg-emerald-400/15 border-emerald-500 text-emerald-400"
                  : "bg-rose-500/15 border-rose-500 text-rose-400"
              }`}
            >
              {expenseGrowthPercent > 0 ? `+${expenseGrowthPercent}%` : `${expenseGrowthPercent}%`}
            </span>
          )}
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-display font-black text-[var(--color-text)] tracking-tight leading-none">
            <AnimatedNumber
              value={dailyAverageExpense}
              formatFn={(val) => `${formatCurrency(val)}`}
            />
            <span className="text-xs font-bold text-gray-500 ml-1">/day</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-[var(--color-border)] text-[10px] font-bold text-gray-400">
            <div className="truncate">
              <span>Avg Tx: </span>
              <span className="text-[var(--color-text)]">{formatCurrency(avgTransactionSize)}</span>
            </div>
            {projectedMonthEndExpense !== undefined ? (
              <div className="truncate text-right">
                <span>Proj: </span>
                <span className="text-amber-400">{formatCurrency(projectedMonthEndExpense)}</span>
              </div>
            ) : (
              <div className="truncate text-right">
                <span>{summary.txCount} txns</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* 4. Split Recovery & Pending Receivables */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        onClick={onSelectSplitShortcut}
        className="p-4 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)] flex flex-col justify-between relative overflow-hidden cursor-pointer hover:border-[var(--color-primary)] transition-all group"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl border border-black/20 bg-blue-400 text-black">
              <Users className="w-4 h-4 stroke-[2.5px]" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Split Recovery
            </span>
          </div>

          <span
            className={`inline-flex items-center text-[9.5px] font-black px-2 py-0.5 rounded-full border ${
              splits.totalPendingReceivables === 0
                ? "bg-emerald-400/20 border-emerald-500 text-emerald-400"
                : "bg-amber-400/20 border-amber-500 text-amber-400"
            }`}
          >
            {splits.totalPendingReceivables === 0 ? "100% Settled" : `${Math.round(splits.recoveryPercentage)}% Rec.`}
          </span>
        </div>

        <div>
          <div className="text-2xl sm:text-3xl font-display font-black text-[var(--color-text)] tracking-tight leading-none flex items-baseline gap-1">
            <AnimatedNumber
              value={splits.totalPendingReceivables}
              formatFn={(val) => formatCurrency(val)}
            />
            <span className="text-xs font-bold text-gray-500">pending</span>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[var(--color-border)] text-[10px] font-bold text-gray-400">
            <span>
              {splits.unsettledFriendsCount} friend{splits.unsettledFriendsCount === 1 ? "" : "s"} owe
            </span>
            <span className="text-[var(--color-primary)] group-hover:underline flex items-center gap-0.5">
              View Splits <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
