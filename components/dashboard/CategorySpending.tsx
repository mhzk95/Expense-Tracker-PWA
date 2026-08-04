"use client";

import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { formatCurrency } from "@/lib/utils/helpers";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { Card } from "@/components/ui/Card";

export function CategorySpending() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();

  const { sortedCategories, totalSpent } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expenses = transactions.filter((t) => {
      if (t.type !== "expense") return false;
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const total = expenses.reduce(
      (s, t) => s + (t.netAmount !== undefined ? t.netAmount : t.amount),
      0
    );

    // Group by category
    const grouped = expenses.reduce((acc, t) => {
      const catId = t.categoryId || "other";
      if (!acc[catId]) acc[catId] = 0;
      acc[catId] += t.netAmount !== undefined ? t.netAmount : t.amount;
      return acc;
    }, {} as Record<string, number>);

    // Sort by highest spending
    const sorted = Object.entries(grouped)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Top 5
      .map(([catId, amount]) => {
        const categoryInfo = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: categoryInfo?.name || "Other",
          color: categoryInfo?.color || "#94a3b8",
          amount,
          percentage: total > 0 ? (amount / total) * 100 : 0,
        };
      });

    return { sortedCategories: sorted, totalSpent: total };
  }, [transactions, categories]);

  if (txLoading || catLoading) {
    return (
      <Card variant="surface" className="flex flex-col h-full p-4 sm:p-5 border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-primary,#facc15)] animate-pulse">
        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-[var(--color-border)]">
          <div className="h-3 w-36 bg-[var(--color-border)] rounded-full" />
          <div className="h-2 w-24 bg-[var(--color-border)] rounded-full" />
        </div>
        <div className="flex-1 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center w-full px-3 py-3 h-[68px] gap-3 relative overflow-hidden border-2 border-[var(--color-border)] rounded-[16px]">
              <div className="h-10 w-10 bg-[var(--color-border)] rounded-[10px]" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-20 bg-[var(--color-border)] rounded-full" />
                  <div className="h-3 w-12 bg-[var(--color-border)] rounded-full" />
                </div>
                <div className="h-2 w-full bg-[var(--color-border)] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card variant="surface" className="flex flex-col h-full p-4 sm:p-5 border-2 border-[var(--color-border)] shadow-[3px_3px_0px_0px_var(--color-primary,#facc15)] overflow-hidden">
      <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-dashed border-[var(--color-border)]">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-none">Where your money goes</h2>
        <Link
          href="/analytics"
          className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary)] hover:opacity-80 transition-opacity flex items-center gap-1 leading-none"
        >
          Details <ArrowRight className="h-3 w-3 stroke-[3px]" />
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        {totalSpent === 0 ? (
          <div className="text-center font-black uppercase tracking-widest text-gray-500 text-[10px] py-4">
            No expenses recorded yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedCategories.map((cat) => (
              <div key={cat.id} className="flex items-center w-full px-3 py-3 h-[68px] gap-3 relative z-10 text-left overflow-hidden border-2 border-[var(--color-border)] bg-[var(--color-surface)]" style={{ borderRadius: '16px' }}>
                <div className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md z-0" style={{ backgroundColor: cat.color }} />
                
                <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10 ml-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-black text-[var(--color-text)] text-[13px] uppercase tracking-wide truncate">{cat.name}</span>
                    <span className="font-black text-[var(--color-text)] tabular-nums text-[15px] font-numbers tracking-tighter">
                      {formatCurrency(cat.amount)}
                    </span>
                  </div>

                  <div className="h-2 w-full bg-[var(--color-surface)] border-[2px] border-[var(--color-border)] rounded-full overflow-hidden mt-1.5 shadow-[inset_2px_2px_0px_0px_rgba(0,0,0,0.1)]">
                    <div
                      className="h-full border-r-[2px] border-[var(--color-border)]"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
