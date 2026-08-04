"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/utils/helpers";
import { TrendingDown, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function AnalyticsPage() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  
  const loading = txLoading || catLoading;

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Analytics" subtitle="Loading insights..." />
        <div className="animate-pulse flex flex-col gap-6">
          <div className="h-40 bg-[var(--color-surfaceHover)] border-4 border-gray-300 rounded-[24px]" />
          <div className="h-64 bg-[var(--color-surfaceHover)] border-4 border-gray-300 rounded-[24px]" />
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);

  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce(
    (s, t) => s + (t.netAmount !== undefined ? t.netAmount : t.amount),
    0
  );

  const netCashFlow = totalIncome - totalExpenses;

  // Group expenses by category
  const groupedExpenses = expenses.reduce((acc, t) => {
    const catId = t.categoryId || "other";
    if (!acc[catId]) acc[catId] = 0;
    acc[catId] += t.netAmount !== undefined ? t.netAmount : t.amount;
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
          <Button variant="secondary" size="sm" className="gap-1.5 uppercase tracking-widest">
            <Filter className="h-4 w-4 stroke-[2.5px]" />
            All Time
          </Button>
        }
      />

      {/* Cash Flow Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card variant="surface" className="flex flex-col justify-center p-4 min-h-[100px] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-success,#10b981)]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] ">
              <TrendingUp className="h-4 w-4 stroke-[3px] text-emerald-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none">Total Income</span>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-[var(--color-text)] tabular-nums tracking-tighter leading-none">{formatCurrency(totalIncome)}</p>
        </Card>

        <Card variant="surface" className="flex flex-col justify-center p-4 min-h-[100px] border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-danger,#ef4444)]">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)] ">
              <TrendingDown className="h-4 w-4 stroke-[3px] text-red-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none">Total Expenses</span>
          </div>
          <p className="text-2xl sm:text-3xl font-display font-black text-[var(--color-text)] tabular-nums tracking-tighter leading-none">{formatCurrency(totalExpenses)}</p>
        </Card>
      </div>

      <Card variant="surface" className="p-4 flex items-center justify-between border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-primary,#facc15)]">
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Net Cash Flow</span>
        <span className={`text-xl font-display font-black tabular-nums tracking-tighter px-3 py-1 border-2 border-[var(--color-border)] rounded-xl  ${netCashFlow >= 0 ? 'bg-emerald-400 text-black' : 'bg-red-400 text-black'}`}>
          {netCashFlow > 0 ? "+" : ""}{formatCurrency(netCashFlow)}
        </span>
      </Card>

      {/* Spending Breakdown */}
      <Card variant="surface" className="p-4 sm:p-6 border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-border)]">
        <div className="flex items-center justify-between mb-6 pb-3 border-b-2 border-dashed border-[var(--color-border)]">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none">Spending Breakdown</h3>
        </div>
        
        {totalExpenses === 0 ? (
          <div className="text-center py-10">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">No expenses recorded yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedCategories.map((cat) => (
              <div key={cat.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full border-[2px] border-[var(--color-border)]"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text)]">{cat.name}</span>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-500">{Math.round(cat.percentage)}%</span>
                    <span className="text-[15px] font-numbers font-black text-[var(--color-text)] tabular-nums tracking-tighter">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>
                </div>
                
                <div className="h-2 w-full bg-[var(--color-surface)] border-[2px] border-[var(--color-border)] rounded-full overflow-hidden shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                  <div
                    className="h-full border-r-[2px] border-[var(--color-border)] transition-all duration-1000 ease-out"
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
      </Card>
    </div>
  );
}
