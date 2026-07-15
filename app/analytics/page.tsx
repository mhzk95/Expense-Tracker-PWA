"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/utils/helpers";
import { TrendingDown, TrendingUp, Filter } from "lucide-react";

export default function AnalyticsPage() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  
  const loading = txLoading || catLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Loading insights..." />
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-40 bg-gray-200 border-4 border-gray-300 rounded-[24px]" />
          <div className="h-64 bg-gray-200 border-4 border-gray-300 rounded-[24px]" />
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
      const categoryInfo = categories.find((c) => c.id === catId);
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
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-[var(--color-text)] hover:bg-gray-100 bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all">
            <Filter className="h-4 w-4 stroke-[2.5px]" />
            All Time
          </button>
        }
      />

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-[24px] border-[3px] sm:border-[4px] border-[var(--color-border)] bg-emerald-400 shadow-[4px_4px_0px_0px_var(--color-border)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] rounded-xl">
              <TrendingUp className="h-5 w-5 text-[var(--color-text)] stroke-[3px]" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text)]">Total Income</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tabular-nums">{formatCurrency(totalIncome)}</p>
        </div>

        <div className="rounded-[24px] border-[3px] sm:border-[4px] border-[var(--color-border)] bg-red-400 shadow-[4px_4px_0px_0px_var(--color-border)] p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-[var(--color-surface)] border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)] rounded-xl">
              <TrendingDown className="h-5 w-5 text-[var(--color-text)] stroke-[3px]" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text)]">Total Expenses</span>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-[var(--color-text)] tabular-nums">{formatCurrency(totalExpenses)}</p>
        </div>
      </div>

      <div className="bg-[var(--color-surface)] border-[3px] sm:border-[4px] border-[var(--color-border)] rounded-[24px] shadow-[4px_4px_0px_0px_var(--color-border)] p-6 flex items-center justify-between">
        <span className="text-sm font-black uppercase tracking-widest text-[var(--color-text)]">Net Cash Flow</span>
        <span className={`text-2xl font-black tabular-nums px-3 py-1 border-2 border-[var(--color-border)] rounded-xl shadow-[2px_2px_0px_0px_var(--color-border)] ${netCashFlow >= 0 ? 'bg-emerald-300 text-[var(--color-text)]' : 'bg-red-300 text-[var(--color-text)]'}`}>
          {netCashFlow > 0 ? "+" : ""}{formatCurrency(netCashFlow)}
        </span>
      </div>

      {/* Spending Breakdown */}
      <div className="bg-[var(--color-surface)] border-[3px] sm:border-[4px] border-[var(--color-border)] rounded-[24px] shadow-[4px_4px_0px_0px_var(--color-border)] p-6 sm:p-8">
        <h3 className="text-xl font-black uppercase tracking-tight text-[var(--color-text)] mb-6">Spending Breakdown</h3>
        
        {totalExpenses === 0 ? (
          <div className="text-center py-10 border-4 border-dashed border-gray-300 rounded-[20px]">
            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">No expenses recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedCategories.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full border-2 border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-sm font-black uppercase tracking-widest text-[var(--color-text)]">{cat.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-sm font-black text-gray-500">{Math.round(cat.percentage)}%</span>
                    <span className="text-sm font-black text-[var(--color-text)] block tabular-nums">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                </div>
                
                <div className="h-4 w-full bg-gray-100 border-2 border-[var(--color-border)] rounded-full overflow-hidden shadow-inner">
                  <div
                    className="h-full border-r-2 border-[var(--color-border)] transition-all duration-1000 ease-out"
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
