"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import {
  TimeRangeKey,
  computeAnalytics,
  AnalyticsSummary,
  getTimeRangeDates,
} from "@/lib/analytics/engine";
import { TransactionEntity } from "@/lib/db/indexeddb";

export interface DrillDownFilter {
  type: "category" | "merchant" | "day" | "split" | "point";
  id?: string;
  name: string;
  color?: string;
}

export function useAnalyticsEngine() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const { accounts, loading: accLoading } = useAccounts();

  const [timeRangeKey, setTimeRangeKey] = useState<TimeRangeKey>("THIS_MONTH");
  const [isComparisonActive, setIsComparisonActive] = useState(true);
  const [customStart, setCustomStart] = useState<Date | undefined>(undefined);
  const [customEnd, setCustomEnd] = useState<Date | undefined>(undefined);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [drillDownTarget, setDrillDownTarget] = useState<DrillDownFilter | null>(null);

  const loading = txLoading || catLoading || accLoading;

  // Memoized Full Summary Computation
  const summary: AnalyticsSummary = useMemo(() => {
    return computeAnalytics(
      transactions,
      categories,
      accounts,
      timeRangeKey,
      customStart,
      customEnd,
      selectedCategoryIds,
      selectedAccountIds
    );
  }, [
    transactions,
    categories,
    accounts,
    timeRangeKey,
    customStart,
    customEnd,
    selectedCategoryIds,
    selectedAccountIds,
  ]);

  // Compute Drill-down Transactions
  const drillDownTransactions = useMemo(() => {
    if (!drillDownTarget) return [];

    const startMs = summary.currentRange.start.getTime();
    const endMs = summary.currentRange.end.getTime();

    return transactions.filter((t) => {
      if (t.isDeleted) return false;
      const txTime = new Date(t.date).getTime();
      if (txTime < startMs || txTime > endMs) return false;

      // Apply base account/category filters if any
      if (selectedAccountIds.length > 0) {
        const matchAcc = (t.accountId && selectedAccountIds.includes(t.accountId)) ||
          (t.toAccountId && selectedAccountIds.includes(t.toAccountId));
        if (!matchAcc) return false;
      }

      switch (drillDownTarget.type) {
        case "category":
          return (t.categoryId || "unassigned") === drillDownTarget.id;

        case "merchant":
          return (t.payee || t.description || "Various Outlays").trim().toLowerCase() === drillDownTarget.name.toLowerCase();

        case "day": {
          const dayIdx = new Date(t.date).getDay();
          const targetDayIdx = parseInt(drillDownTarget.id || "0", 10);
          return t.type === "expense" && dayIdx === targetDayIdx;
        }

        case "split":
          return Boolean(t.splits && t.splits.length > 0);

        case "point": {
          // Drill down into specific date or month
          const dStr = t.date.split("T")[0];
          return dStr === drillDownTarget.id || t.date.startsWith(drillDownTarget.id || "");
        }

        default:
          return true;
      }
    });
  }, [transactions, drillDownTarget, summary.currentRange, selectedAccountIds]);

  const toggleCategoryFilter = useCallback((catId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  }, []);

  const toggleAccountFilter = useCallback((accId: string) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accId) ? prev.filter((id) => id !== accId) : [...prev, accId]
    );
  }, []);

  const resetFilters = useCallback(() => {
    setSelectedCategoryIds([]);
    setSelectedAccountIds([]);
    setDrillDownTarget(null);
  }, []);

  return {
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
    selectedAccountIds,
    toggleAccountFilter,
    resetFilters,
    drillDownTarget,
    setDrillDownTarget,
    drillDownTransactions,
    summary,
    categories,
    accounts,
  };
}
