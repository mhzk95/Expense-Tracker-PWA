"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { useTransactions } from "@/hooks/useTransactions";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils/helpers";
import { TrendingDown, TrendingUp, Filter } from "lucide-react";

export default function AnalyticsPage() {
  const { transactions, loading } = useTransactions();

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Loading insights..." />
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-40 bg-slate-900/60 rounded-2xl" />
          <div className="h-64 bg-slate-900/60 rounded-2xl" />
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;

  // Group expenses by category
  const groupedExpenses = expenses.reduce((acc, t) => {
    const catId = t.categoryId || "other";
    if (!acc[catId]) acc[catId] = 0;
    acc[catId] += t.amount;
    return acc;
  }, {} as Record<string, number>);

  const sortedCategories = Object.entries(groupedExpenses)
    .sort(([, a], [, b]) => b - a)
    .map(([catId, amount]) => {
      const categoryInfo = MOCK_CATEGORIES.find((c) => c.id === catId);
      return {
        id: catId,
        name: categoryInfo?.name || "Other",
        color: categoryInfo?.color || "#94a3b8",
        icon: categoryInfo?.icon,
        amount,
        percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
      };
    });

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        title="Analytics"
        subtitle="Insights based on your local cash flow"
        action={
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all">
            <Filter className="h-4 w-4" />
            All Time
          </button>
        }
      />

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">Total Income</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-500/20 rounded-lg">
              <TrendingDown className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-sm font-medium text-slate-300">Total Expenses</span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6 flex items-center justify-between">
        <span className="text-slate-300 font-medium">Net Cash Flow</span>
        <span className={`text-xl font-bold tabular-nums ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {netCashFlow > 0 ? "+" : ""}{formatCurrency(netCashFlow)}
        </span>
      </div>

      {/* Spending Breakdown */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Spending Breakdown</h3>
        
        {totalExpenses === 0 ? (
          <div className="text-center py-8 text-slate-500">
            No expenses recorded yet.
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-medium text-slate-200">{cat.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-semibold text-white block tabular-nums">
                      {formatCurrency(cat.amount)}
                    </span>
                    <span className="text-xs text-slate-500">{Math.round(cat.percentage)}%</span>
                  </div>
                </div>
                
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${cat.percentage}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
