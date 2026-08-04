"use client";

/**
 * RecentTransactions — Shows the latest 5 transactions on the dashboard.
 * Uses local IndexedDB data.
 */

import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { formatCurrency, formatDate, hexToRgb, getCategoryIcon } from "@/lib/utils/helpers";
import { ArrowLeftRight, ArrowRight, Zap, MapPin, FileText, Clock } from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import Link from "next/link";
import { useTransactions } from "@/hooks/useTransactions";
import { Card } from "@/components/ui/Card";
import { MarqueeText } from "@/components/ui/MarqueeText";
import { SplitDataIndicator } from "@/components/transactions/SplitDataIndicator";
import { useMemo } from "react";

export function RecentTransactions() {
  const { transactions, loading: txLoading } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const { accounts, loading: accLoading } = useAccounts();

  // Transactions are already sorted descending by date in the repository
  const recent = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const loading = txLoading || catLoading || accLoading;

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
                <div className="h-12 w-12 rounded-[var(--radius-theme-base)] border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] bg-[var(--color-surfaceHover)]" />
                <div className="flex-1 space-y-2 mt-1">
                  <div className="h-4 w-32 bg-[var(--color-surfaceHover)] border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] rounded-full" />
                  <div className="h-3 w-20 bg-[var(--color-surfaceHover)] border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] rounded-full" />
                  <div className="h-3 w-16 bg-[var(--color-surfaceHover)] border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] rounded-full" />
                </div>
                <div className="h-4 w-12 bg-[var(--color-surfaceHover)] border-[length:var(--theme-border-width)] border-[var(--theme-border-style)] border-[var(--color-border)] rounded-full" />
              </Card>
            ))}
          </>
        ) : recent.length === 0 ? (
          <Card className="p-5 text-sm font-bold text-gray-500 text-center uppercase tracking-wider border-dashed bg-[var(--color-surface)]">No transactions found.</Card>
        ) : (
          recent.map((txn) => {
            const category = categories.find((c) => c.id === txn.categoryId);
            const sourceAccount = accounts.find((a) => a.id === txn.accountId);
            const targetAccount = accounts.find((a) => a.id === txn.toAccountId);
            const isIncome = txn.type === "income";
            const isTransfer = txn.type === "transfer";

            const baseColor = category?.color || (isTransfer ? "#60a5fa" : "#8b5cf6");

            const hasDistinctPayeeAndDesc = Boolean(
              txn.payee && txn.description && txn.payee.toLowerCase().trim() !== txn.description.toLowerCase().trim()
            );
            const primaryTitle = txn.payee || txn.description || (isTransfer ? "Account Transfer" : "Transaction");
            const secondarySubtitle = hasDistinctPayeeAndDesc ? txn.description : null;
            const hasNote = Boolean(txn.note && txn.note.trim().length > 0);
            const hasLocation = Boolean(txn.location && txn.location.trim().length > 0);

            const isSplit = Boolean(txn.splits && txn.splits.length > 0);

            return (
              <Card
                key={txn.id}
                variant="surface"
                className={cn(
                  "group relative overflow-hidden transition-all duration-200 border-2 border-[var(--color-border)] rounded-[18px]",
                  txn.needsReview && "border-[#facc15]",
                  isSplit && "border-amber-500/50 bg-gradient-to-r from-amber-500/[0.05] via-transparent to-transparent"
                )}
              >
                <div className="flex items-center w-full px-3.5 py-3 h-[72px] gap-3 relative z-10 text-left">
                  {/* Left Color Accent Strip */}
                  <div 
                    className={cn(
                      "absolute left-0 top-3 bottom-3 w-1 rounded-r-md z-0",
                      isSplit && "w-1.5"
                    )}
                    style={{ 
                      backgroundColor: isSplit 
                        ? '#f59e0b' 
                        : txn.needsReview 
                        ? '#facc15' 
                        : baseColor 
                    }} 
                  />

                  {/* Type icon */}
                  <div
                    className="flex-shrink-0 w-11 h-11 rounded-[12px] flex items-center justify-center relative z-10 ml-0.5 border border-black/20"
                    style={{ 
                      backgroundColor: baseColor,
                      color: "#000"
                    }}
                  >
                    {(() => {
                      if (isTransfer) {
                        return <ArrowLeftRight className="w-5 h-5 stroke-[2.5px]" />;
                      }
                      const IconComp = getCategoryIcon(category?.icon);
                      return <IconComp className="w-5 h-5 stroke-[2.5px]" />;
                    })()}
                  </div>

                  {/* Description + category */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10 h-full">
                    <h3 className="text-[13px] font-black uppercase truncate leading-tight text-[var(--color-text)] pt-0.5">
                      {primaryTitle}
                    </h3>
                    
                    {secondarySubtitle && (
                      <p className="text-[10px] font-bold text-gray-400 uppercase truncate leading-tight mt-0.5">
                        {secondarySubtitle}
                      </p>
                    )}

                    <div className="text-[10px] font-black uppercase tracking-widest leading-tight mt-0.5 flex items-center gap-2">
                      {isTransfer ? (
                        <span className="truncate text-blue-400 flex items-center gap-1 font-bold">
                          {sourceAccount?.name || "Account"} <ArrowRight className="w-2.5 h-2.5 inline" /> {targetAccount?.name || "Target"}
                        </span>
                      ) : (
                        <span className="truncate block" style={{ color: baseColor }}>{category?.name ?? "Uncategorized"}</span>
                      )}

                      <div className="flex items-center gap-1.5 text-gray-500 font-bold shrink-0">
                        <span>{formatDate(txn.date, "medium")}</span>
                        {hasLocation && <MapPin className="w-2.5 h-2.5 text-amber-400/80" />}
                        {hasNote && <FileText className="w-2.5 h-2.5 text-purple-400/80" />}
                      </div>
                    </div>
                  </div>

                  {/* Amount + Review / Split Badges */}
                  <div className="text-right flex flex-col items-end justify-center h-full relative z-10">
                    <div className="flex items-center gap-1">
                      <span
                        className={cn(
                          "text-[15px] font-black tracking-tight text-right leading-none font-numbers tabular-nums",
                          isIncome ? "text-emerald-500" : isTransfer ? "text-blue-400" : "text-[var(--color-text)]"
                        )}
                      >
                        {isIncome ? "+" : isTransfer ? "" : "−"}{formatCurrency(txn.amount, txn.currency)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 mt-1">
                      {txn.needsReview && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-black bg-yellow-400 border border-black/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 fill-black" /> Review
                        </span>
                      )}

                      {txn.splits && txn.splits.length > 0 && (
                        <SplitDataIndicator
                          splits={txn.splits}
                          netAmount={txn.netAmount}
                          totalAmount={txn.amount}
                          currency={txn.currency}
                          variant="recovery-bar"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
