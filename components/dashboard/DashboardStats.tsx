"use client";

import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { formatCurrency } from "@/lib/utils/helpers";
import { StatCard } from "./StatCard";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

export function DashboardStats() {
  const { transactions, loading: txLoading } = useTransactions();
  const { accounts, loading: accLoading } = useAccounts();

  const loading = txLoading || accLoading;

  // Compute summary stats from real accounts and REAL transactions
  const totalAssets = accounts.filter((a) => a.balance > 0 && !a.excludeFromNetWorth).reduce(
    (s, a) => s + a.balance,
    0
  );
  const totalLiabilities = Math.abs(
    accounts.filter((a) => a.balance < 0 && !a.excludeFromNetWorth).reduce((s, a) => s + a.balance, 0)
  );
  const netWorth = totalAssets - totalLiabilities;

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Helper to filter transactions by month and year
  const getMonthlyTransactions = (month: number, year: number) => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      return d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const currentMonthTxns = getMonthlyTransactions(currentMonth, currentYear);
  const prevMonthTxns = getMonthlyTransactions(prevMonth, prevYear);

  const calculateTotal = (txns: any[], type: string) =>
    txns.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);

  const monthlyIncome = calculateTotal(currentMonthTxns, "income");
  const monthlyExpenses = calculateTotal(currentMonthTxns, "expense");

  const prevMonthlyIncome = calculateTotal(prevMonthTxns, "income");
  const prevMonthlyExpenses = calculateTotal(prevMonthTxns, "expense");

  const calculateTrend = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const incomeTrend = calculateTrend(monthlyIncome, prevMonthlyIncome);
  const expenseTrend = calculateTrend(monthlyExpenses, prevMonthlyExpenses);

  const formatTrend = (value: number) => {
    if (value === 0) return "0% vs last month";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}% vs last month`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="brutal-card p-5 h-28 flex flex-col justify-between animate-pulse">
            <div className="h-3 w-16 bg-gray-200 border border-black rounded-full" />
            <div className="h-6 w-24 bg-gray-200 border border-black rounded-full mt-2" />
            <div className="h-3 w-20 bg-gray-200 border border-black rounded-full mt-2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Net Worth"
        value={formatCurrency(netWorth)}
        rawValue={netWorth}
        trend={""}
        trendDirection="neutral"
        icon={<Wallet className="h-6 w-6 stroke-[2.5px] text-black" />}
      />
      <StatCard
        label="Monthly Income"
        value={formatCurrency(monthlyIncome)}
        rawValue={monthlyIncome}
        trend={formatTrend(incomeTrend)}
        trendDirection={incomeTrend > 0 ? "up" : incomeTrend < 0 ? "down" : "neutral"}
        icon={<TrendingUp className="h-6 w-6 stroke-[2.5px] text-black" />}
      />
      <StatCard
        label="Monthly Expenses"
        value={formatCurrency(monthlyExpenses)}
        rawValue={monthlyExpenses}
        trend={formatTrend(expenseTrend)}
        trendDirection={expenseTrend < 0 ? "up" : expenseTrend > 0 ? "down" : "neutral"}
        icon={<TrendingDown className="h-6 w-6 stroke-[2.5px] text-black" />}
      />
      <StatCard
        label="Total Savings"
        value={formatCurrency(totalAssets)}
        rawValue={totalAssets}
        trend={""}
        trendDirection="neutral"
        icon={<PiggyBank className="h-6 w-6 stroke-[2.5px] text-black" />}
      />
    </div>
  );
}
