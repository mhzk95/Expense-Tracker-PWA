"use client";

/**
 * RecentTransactions — Shows the latest 5 transactions on the dashboard.
 * Uses local IndexedDB data.
 */

import { useCategories } from "@/hooks/useCategories";
import { formatCurrency, formatDate, hexToRgb, getCategoryIcon } from "@/lib/utils/helpers";
import { ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import Link from "next/link";
import { useTransactions } from "@/hooks/useTransactions";
import { Card } from "@/components/ui/Card";
import { MarqueeText } from "@/components/ui/MarqueeText";
import { useMemo } from "react";

export function RecentTransactions() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();

  // Transactions are already sorted descending by date in the repository
  const recent = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const loading = txLoading || catLoading;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-display font-black uppercase tracking-wider text-[var(--color-text)] text-balance">Recent Transactions</h2>
        <Link
          href="/transactions"
          className="text-sm text-[var(--color-text)] border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] bg-[var(--color-surface)] shadow-brutal-sm hover:bg-[var(--color-surface-hover)] font-bold transition-all active:translate-y-0.5 active:translate-x-0.5 active:shadow-none rounded-[var(--radius-theme-btn)] flex items-center justify-center -mr-1 px-3 py-1"
        >
          View all
        </Link>
      </div>



      {/* Transaction rows */}
      <div className="space-y-3 flex-1 flex flex-col justify-start">
        {loading ? (
          <>
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="p-4 flex items-start gap-4 animate-pulse">
                <div className="h-12 w-12 rounded-[var(--radius-theme-base)] border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] bg-gray-200" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-4 w-32 bg-gray-200 border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] rounded-full" />
                  <div className="h-3 w-20 bg-gray-200 border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] rounded-full" />
                  <div className="h-3 w-16 bg-gray-200 border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] rounded-full" />
                </div>
                <div className="h-4 w-12 bg-gray-200 border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] rounded-full" />
              </Card>
            ))}
          </>
        ) : recent.length === 0 ? (
          <Card className="p-5 text-sm font-bold text-gray-500 text-center uppercase tracking-wider border-dashed bg-[var(--color-surface)]">No transactions found.</Card>
        ) : (
          recent.map((txn) => {
            const category = categories.find((c) => c.id === txn.categoryId);
            const isIncome = txn.type === "income";
            const isTransfer = txn.type === "transfer";

            const baseColor = category?.color || "#8b5cf6";

            return (
              <Card
                key={txn.id}
                className={cn(
                  "flex items-center gap-4 px-4 py-3 transition-all duration-300",
                  txn.needsReview && "needs-review-card border-l-[6px] border-l-amber-400 bg-amber-50"
                )}
              >
                {/* Type icon */}
                <div
                  className="flex-shrink-0 h-12 w-12 rounded-[var(--radius-theme-base)] flex items-center justify-center border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] shadow-brutal-sm"
                  style={{ 
                    backgroundColor: baseColor,
                    color: "#fff"
                  }}
                >
                  {(() => {
                    if (isTransfer) {
                      return <ArrowLeftRight className="h-5 w-5" />;
                    }
                    const IconComp = getCategoryIcon(category?.icon);
                    return <IconComp className="h-5 w-5" />;
                  })()}
                </div>

                {/* Description + category */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <MarqueeText 
                    text={txn.payee ? txn.payee : txn.description} 
                    className="text-base font-black text-[var(--color-text)] text-balance uppercase tracking-wide" 
                  />
                  <div className="text-xs font-bold text-gray-600 mt-1 flex flex-col min-w-0 uppercase tracking-widest">
                    {txn.payee && txn.description !== "Quick Entry" ? (
                      <span className="text-[var(--color-text)] truncate">{txn.description}</span>
                    ) : null}
                    <span className="truncate">{category?.name ?? "Uncategorized"}</span>
                    <span className="whitespace-nowrap mt-0.5 text-gray-500">{formatDate(txn.date, "medium")}</span>
                  </div>
                </div>

                {/* Amount + Review Badge */}
                <div className="text-right flex flex-col items-end justify-start h-full pt-1">
                  <span
                    className={cn(
                      "text-lg font-numbers font-black tabular-nums text-balance",
                      isIncome ? "text-emerald-600" : isTransfer ? "text-gray-500" : "text-[var(--color-text)]"
                    )}
                  >
                    {isIncome ? "+" : isTransfer ? "" : "−"}
                    {formatCurrency(txn.amount, txn.currency)}
                  </span>
                  {txn.needsReview && (
                    <span className="text-[10px] font-black font-display uppercase tracking-wider text-amber-900 bg-amber-400 border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] shadow-brutal-sm px-2 py-1 rounded-[var(--radius-theme-base)] leading-none mt-2">
                      Review
                    </span>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
