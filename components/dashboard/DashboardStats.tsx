"use client";

import { useTransactions } from "@/hooks/useTransactions";
import { MOCK_ACCOUNTS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils/helpers";
import { StatCard } from "./StatCard";
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from "lucide-react";

export function DashboardStats() {
  const { transactions, loading } = useTransactions();

  // Compute summary stats from mock accounts but REAL transactions
  const totalAssets = MOCK_ACCOUNTS.filter((a) => a.balance > 0).reduce(
    (s, a) => s + a.balance,
    0
  );
  const totalLiabilities = Math.abs(
    MOCK_ACCOUNTS.filter((a) => a.balance < 0).reduce((s, a) => s + a.balance, 0)
  );
  const netWorth = totalAssets - totalLiabilities;

  const monthlyIncome = transactions.filter((t) => t.type === "income").reduce(
    (s, t) => s + t.amount,
    0
  );
  const monthlyExpenses = transactions.filter((t) => t.type === "expense").reduce(
    (s, t) => s + t.amount,
    0
  );

  if (loading) {
    return <div className="animate-pulse bg-slate-900/60 h-32 rounded-2xl" />;
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Net Worth"
        value={formatCurrency(netWorth)}
        trend="+4.2% this month"
        trendDirection="up"
        icon={<Wallet className="h-5 w-5 text-white" />}
        iconColor="from-violet-500 to-indigo-600"
      />
      <StatCard
        label="Monthly Income"
        value={formatCurrency(monthlyIncome)}
        trend="+0% vs last month"
        trendDirection="neutral"
        icon={<TrendingUp className="h-5 w-5 text-white" />}
        iconColor="from-emerald-500 to-teal-600"
      />
      <StatCard
        label="Monthly Expenses"
        value={formatCurrency(monthlyExpenses)}
        trend="+8.1% vs last month"
        trendDirection="down"
        icon={<TrendingDown className="h-5 w-5 text-white" />}
        iconColor="from-red-500 to-rose-600"
      />
      <StatCard
        label="Total Savings"
        value={formatCurrency(totalAssets)}
        trend="+2.3% this month"
        trendDirection="up"
        icon={<PiggyBank className="h-5 w-5 text-white" />}
        iconColor="from-amber-500 to-orange-600"
      />
    </div>
  );
}
