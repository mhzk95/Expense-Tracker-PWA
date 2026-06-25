"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, hexToRgb, vibrate } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/helpers";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Filter } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { AddTransactionAction } from "@/components/dashboard/AddTransactionAction";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { motion, AnimatePresence } from "framer-motion";

export default function TransactionsPage() {
  const { transactions: rawTransactions, loading: txLoading, deleteTransaction } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const { accounts, loading: accLoading } = useAccounts();
  
  const loading = txLoading || catLoading || accLoading;
  
  const [editingTxn, setEditingTxn] = useState<TransactionEntity | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [expandedTxnId, setExpandedTxnId] = useState<string | null>(null);

  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMoving = useRef(false);

  const transactions = [...rawTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Collapse notes on scroll or click outside
  useEffect(() => {
    const handleCollapse = () => {
      setExpandedTxnId(null);
    };
    window.addEventListener("scroll", handleCollapse, { passive: true });
    document.addEventListener("click", handleCollapse);
    return () => {
      window.removeEventListener("scroll", handleCollapse);
      document.removeEventListener("click", handleCollapse);
    };
  }, []);

  const handleTouchStart = (txnId: string) => {
    isMoving.current = false;
    longPressTimeoutRef.current = setTimeout(() => {
      if (!isMoving.current) {
        vibrate([30]);
        setExpandedTxnId((prev) => (prev === txnId ? null : txnId));
      }
    }, 500);
  };

  const handleTouchMove = () => {
    isMoving.current = true;
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle={loading ? "Loading..." : `${transactions.length} transactions`}
        action={
          <div className="flex items-center gap-2">
            <button
              id="filter-transactions-btn"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all"
            >
              <Filter className="h-4 w-4" />
              Filter
            </button>
            <AddTransactionAction />
          </div>
        }
      />

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-4 flex items-center gap-4 animate-pulse">
              <div className="h-10 w-10 rounded-full bg-slate-800/60" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-24 bg-slate-800/60 rounded-full" />
                <div className="h-2.5 w-16 bg-slate-800/60 rounded-full" />
              </div>
              <div className="h-4 w-12 bg-slate-800/60 rounded-full" />
            </div>
          ))}
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Add your first income or expense to get started."
          action={<AddTransactionAction />}
        />
      ) : (
        <div className="space-y-3">
          {transactions.map((txn) => {
            const category = categories.find((c) => c.id === txn.categoryId);
            const isIncome = txn.type === "income";
            const isTransfer = txn.type === "transfer";
            const isExpanded = expandedTxnId === txn.id;

            const baseColor = category?.color || "#8b5cf6";

            return (
              <SwipeToDelete 
                key={txn.id} 
                onDelete={() => deleteTransaction(txn.id)}
                onEdit={() => {
                  setEditingTxn(txn);
                  setIsEditOpen(true);
                }}
                glowColor={baseColor}
                deleteMessage={`Delete "${txn.description}"?`}
                expanded={isExpanded}
              >
                <div 
                  className={cn(
                    "glass-card interactive flex flex-col px-5 py-4 w-full transition-all duration-300 select-none",
                    txn.needsReview && "needs-review-card",
                    isExpanded && "shadow-lg shadow-black/40 ring-1 ring-white/10"
                  )}
                  style={{ 
                    "--color-primary": baseColor,
                    "--color-primary-rgb": hexToRgb(baseColor),
                    "--color-primary-glow": "rgba(var(--color-primary-rgb), var(--card-glow-intensity))",
                    "--color-primary-glow-hover": "rgba(var(--color-primary-rgb), var(--card-glow-hover-intensity))",
                    "--glass-border-gradient": "linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.35) 0%, rgba(var(--color-primary-rgb), 0.05) 40%, rgba(var(--color-primary-rgb), 0.02) 60%, var(--color-primary) 100%)"
                  } as React.CSSProperties}
                  onTouchStart={() => handleTouchStart(txn.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={() => handleTouchStart(txn.id)}
                  onMouseMove={handleTouchMove}
                  onMouseUp={handleTouchEnd}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center gap-4 w-full">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
                        isIncome
                          ? "bg-emerald-500/15 text-emerald-400"
                          : isTransfer
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-red-500/15 text-red-400"
                      )}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="h-5 w-5" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="h-5 w-5" />
                      ) : (
                        <ArrowUpRight className="h-5 w-5" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{txn.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400">{category?.name ?? "Other"}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-400">{formatDate(txn.date, "medium")}</span>
                      </div>
                    </div>

                    {/* Amount + status */}
                    <div className="text-right">
                      <p
                        className={cn(
                          "text-sm font-semibold tabular-nums",
                          isIncome ? "text-emerald-400" : isTransfer ? "text-slate-300" : "text-white"
                        )}
                      >
                        {isIncome ? "+" : "−"}{formatCurrency(txn.amount, txn.currency)}
                      </p>
                      <span
                        className={cn(
                          "text-xs",
                          txn.status === "completed" ? "text-slate-500" : "text-amber-400"
                        )}
                      >
                        {txn.status}
                      </span>
                    </div>
                  </div>

                  {/* Expanded notes area */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4 pt-4 border-t border-white/5 space-y-3"
                      >
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Notes</span>
                          <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">
                            {txn.note || "No notes provided."}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 pt-1">
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Account</span>
                            <span className="text-xs text-slate-300 mt-1 block">
                              {accounts.find(a => a.id === txn.accountId)?.name || "Unknown Account"}
                            </span>
                          </div>
                          {txn.type === "transfer" && txn.toAccountId && (
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">To Account</span>
                              <span className="text-xs text-slate-300 mt-1 block">
                                {accounts.find(a => a.id === txn.toAccountId)?.name || "Unknown Account"}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block">Status</span>
                            <span className="text-xs text-slate-300 mt-1 block capitalize">
                              {txn.status || "completed"}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SwipeToDelete>
            );
          })}
        </div>
      )}

      {/* Edit transaction AdaptiveOverlay */}
      <AdaptiveOverlay 
        isOpen={isEditOpen} 
        onClose={() => {
          setIsEditOpen(false);
          setEditingTxn(null);
        }} 
        title="Edit Transaction"
      >
        {editingTxn && (
          <TransactionForm
            editingTransaction={editingTxn}
            onSuccess={() => {
              setIsEditOpen(false);
              setEditingTxn(null);
            }}
          />
        )}
      </AdaptiveOverlay>
    </div>
  );
}
