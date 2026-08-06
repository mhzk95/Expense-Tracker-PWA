"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAnalyticsEngine } from "@/hooks/useAnalyticsEngine";
import { AnalyticsTimeFilter } from "@/components/analytics/AnalyticsTimeFilter";
import { AnalyticsKpiGrid } from "@/components/analytics/AnalyticsKpiGrid";
import { CashFlowTrendChart } from "@/components/analytics/CashFlowTrendChart";
import { CategoryDonutChart } from "@/components/analytics/CategoryDonutChart";
import { MerchantParetoChart } from "@/components/analytics/MerchantParetoChart";
import { SpendingTimeMatrix } from "@/components/analytics/SpendingTimeMatrix";
import { SplitRecoveryAnalytics } from "@/components/analytics/SplitRecoveryAnalytics";
import { AnalyticsInsights } from "@/components/analytics/AnalyticsInsights";
import { AnalyticsDrillDownSheet } from "@/components/analytics/AnalyticsDrillDownSheet";
import { TransactionDetailSheet } from "@/components/transactions/TransactionDetailSheet";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { vibrate } from "@/lib/utils/helpers";
import { Download } from "lucide-react";
import toast from "react-hot-toast";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

export default function AnalyticsPage() {
  const {
    loading,
    timeRangeKey,
    setTimeRangeKey,
    isComparisonActive,
    setIsComparisonActive,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    selectedCategoryIds,
    toggleCategoryFilter,
    resetFilters,
    drillDownTarget,
    setDrillDownTarget,
    drillDownTransactions,
    summary,
    categories,
  } = useAnalyticsEngine();

  const [selectedTxnForDetails, setSelectedTxnForDetails] = useState<TransactionEntity | null>(null);

  // Handle Export CSV Snapshot
  const handleExportCSV = () => {
    vibrate([25]);
    try {
      const rows = [
        ["ExpenseTracker Analytics Snapshot"],
        [`Time Period: ${summary.currentRange.label} (${summary.currentRange.start.toISOString().split("T")[0]} to ${summary.currentRange.end.toISOString().split("T")[0]})`],
        [""],
        ["Executive Summary"],
        ["Total Income", summary.totalIncome.toString()],
        ["Total Expenses", summary.totalExpenses.toString()],
        ["Net Cash Flow", summary.netCashFlow.toString()],
        ["Savings Rate (%)", summary.savingsRate.toString()],
        ["Daily Average Burn", summary.dailyAverageExpense.toString()],
        ["Total Transactions", summary.txCount.toString()],
        [""],
        ["Category Breakdown", "Amount", "Share (%)", "Transaction Count"],
        ...summary.categories.map((c) => [c.name, c.amount.toString(), c.percentage.toFixed(1), c.txCount.toString()]),
        [""],
        ["Top Merchants", "Amount", "Share (%)", "Orders Count"],
        ...summary.merchants.map((m) => [m.name, m.amount.toString(), m.percentage.toFixed(1), m.txCount.toString()]),
      ];

      const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ExpenseTracker_Analytics_${timeRangeKey}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Analytics snapshot exported to CSV");
    } catch (e) {
      toast.error("Failed to export analytics snapshot");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 pb-16 sm:pb-20">
        <PageHeader title="Analytics" subtitle="Aggregating financial intelligence..." />
        <div className="space-y-4 animate-pulse">
          <div className="h-12 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl" />
            ))}
          </div>
          <div className="h-64 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-64 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl" />
            <div className="h-64 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4 sm:space-y-6 pb-20 sm:pb-24"
    >
      {/* Page Header with Export Action */}
      <motion.div variants={itemVariants}>
        <PageHeader
          title="Analytics"
          subtitle="Multi-dimensional financial intelligence & cash flow trends"
          action={
            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-[var(--color-surface)] border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] text-[var(--color-text)] transition-all cursor-pointer shadow-sm min-h-[36px]"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5px]" />
              <span className="hidden sm:inline">Export CSV</span>
            </motion.button>
          }
        />
      </motion.div>

      {/* 1. Time Horizon Filter & Period Switcher */}
      <motion.div variants={itemVariants}>
        <AnalyticsTimeFilter
          activeKey={timeRangeKey}
          onSelectKey={setTimeRangeKey}
          isComparisonActive={isComparisonActive}
          onToggleComparison={() => setIsComparisonActive(!isComparisonActive)}
          currentRange={summary.currentRange}
          prevRange={summary.prevRange}
          categories={categories}
          selectedCategoryIds={selectedCategoryIds}
          onToggleCategory={toggleCategoryFilter}
          onResetFilters={resetFilters}
          customStart={customStart}
          customEnd={customEnd}
          onSetCustomDates={(start, end) => {
            setCustomStart(start);
            setCustomEnd(end);
          }}
        />
      </motion.div>

      {/* 2. Executive KPI Bento Grid */}
      <motion.div variants={itemVariants}>
        <AnalyticsKpiGrid
          summary={summary}
          isComparisonActive={isComparisonActive}
          onSelectSplitShortcut={() => {
            setDrillDownTarget({
              type: "split",
              name: "Group Split Transactions",
              color: "#38bdf8",
            });
          }}
        />
      </motion.div>

      {/* 3. Interactive SVG Cash Flow Wave & Trendline */}
      <motion.div variants={itemVariants}>
        <CashFlowTrendChart
          data={summary.timeSeries}
          onSelectPoint={(point) => {
            setDrillDownTarget({
              type: "point",
              id: point.date,
              name: `Transactions on ${point.label}`,
              color: "#facc15",
            });
          }}
        />
      </motion.div>

      {/* 4. Category Donut & Merchant Pareto Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-7">
          <CategoryDonutChart
            categories={summary.categories}
            totalSpent={summary.totalExpenses}
            onSelectCategory={(cat) => {
              if (cat.id !== "others") {
                setDrillDownTarget({
                  type: "category",
                  id: cat.id,
                  name: cat.name,
                  color: cat.color,
                });
              }
            }}
          />
        </div>

        <div className="lg:col-span-5">
          <MerchantParetoChart
            merchants={summary.merchants}
            totalSpent={summary.totalExpenses}
            onSelectMerchant={(merchant) => {
              setDrillDownTarget({
                type: "merchant",
                name: merchant.name,
                color: "#10b981",
              });
            }}
          />
        </div>
      </motion.div>

      {/* 5. Temporal Rhythm Matrix & Split Debt Recovery Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        <div className="lg:col-span-6">
          <SpendingTimeMatrix
            dayOfWeek={summary.dayOfWeek}
            totalSpent={summary.totalExpenses}
            onSelectDay={(day) => {
              setDrillDownTarget({
                type: "day",
                id: day.dayIndex.toString(),
                name: `Expenses on ${day.dayName}s`,
                color: "#818cf8",
              });
            }}
          />
        </div>

        <div className="lg:col-span-6">
          <SplitRecoveryAnalytics
            splits={summary.splits}
            onSelectSplitFriend={(friendName) => {
              setDrillDownTarget({
                type: "split",
                name: `Splits with ${friendName}`,
                color: "#38bdf8",
              });
            }}
          />
        </div>
      </motion.div>

      {/* 6. Smart Financial Insights & Anomaly Alerts */}
      <motion.div variants={itemVariants}>
        <AnalyticsInsights insights={summary.insights} />
      </motion.div>

      {/* 7. Interactive Drill-Down Bottom Sheet */}
      <AnalyticsDrillDownSheet
        filter={drillDownTarget}
        transactions={drillDownTransactions}
        categories={categories}
        onClose={() => setDrillDownTarget(null)}
        onSelectTransaction={(txn) => {
          setSelectedTxnForDetails(txn);
        }}
      />

      {/* 8. Transaction Detail Modal (if clicked from drill-down) */}
      {selectedTxnForDetails && (
        <TransactionDetailSheet
          txn={selectedTxnForDetails}
          onClose={() => setSelectedTxnForDetails(null)}
        />
      )}
    </motion.div>
  );
}
