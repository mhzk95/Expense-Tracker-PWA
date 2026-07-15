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
    const total = expenses.reduce((s, t) => s + t.amount, 0);

    // Group by category
    const grouped = expenses.reduce((acc, t) => {
      const catId = t.categoryId || "other";
      if (!acc[catId]) acc[catId] = 0;
      acc[catId] += t.amount;
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
      <Card className="flex flex-col h-full animate-pulse">
        <div className="flex items-center justify-between px-5 py-4 border-b-[3px] border-[var(--color-border)]">
          <div className="h-4 w-36 bg-gray-200 border-2 border-[var(--color-border)] rounded-full" />
          <div className="h-3 w-24 bg-gray-200 border-2 border-[var(--color-border)] rounded-full" />
        </div>
        <div className="p-5 flex-1 space-y-5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[var(--color-border)] bg-gray-200" />
                  <div className="h-4 w-20 bg-gray-200 border-2 border-[var(--color-border)] rounded-full" />
                </div>
                <div className="h-4 w-12 bg-gray-200 border-2 border-[var(--color-border)] rounded-full" />
              </div>
              <div className="h-3 w-full bg-gray-200 border-2 border-[var(--color-border)] rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b-[3px] border-[var(--color-border)] bg-[var(--color-primary)]">
        <h2 className="text-base font-black uppercase tracking-wider text-white">Where your money goes</h2>
        <Link
          href="/analytics"
          className="text-xs flex items-center gap-1 text-white hover:text-white/80 font-bold transition-colors uppercase tracking-wider"
        >
          Detailed Analytics
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-center">
        {totalSpent === 0 ? (
          <div className="text-center text-slate-500 text-sm py-4">
            No expenses recorded yet.
          </div>
        ) : (
          <div className="space-y-5">
            {sortedCategories.map((cat) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-4 h-4 rounded-full border-2 border-[var(--color-border)]"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-bold text-[var(--color-text)] text-base">{cat.name}</span>
                  </div>
                  <span className="font-black text-[var(--color-text)] tabular-nums text-lg">
                    {formatCurrency(cat.amount)}
                  </span>
                </div>

                <div className="h-3 w-full bg-gray-200 border-[3px] border-[var(--color-border)] rounded-full overflow-hidden">
                  <div
                    className="h-full border-r-[3px] border-[var(--color-border)]"
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
    </Card>
  );
}
