"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DrillDownFilter } from "@/hooks/useAnalyticsEngine";
import { TransactionEntity, CategoryEntity } from "@/lib/db/indexeddb";
import { formatCurrency, formatDate, getCategoryIcon } from "@/lib/utils/helpers";
import { X, Tag, Calendar, Users, Store, ArrowUpRight } from "lucide-react";

interface AnalyticsDrillDownSheetProps {
  filter: DrillDownFilter | null;
  transactions: TransactionEntity[];
  categories: CategoryEntity[];
  onClose: () => void;
  onSelectTransaction?: (txn: TransactionEntity) => void;
}

export function AnalyticsDrillDownSheet({
  filter,
  transactions,
  categories,
  onClose,
  onSelectTransaction,
}: AnalyticsDrillDownSheetProps) {
  // Lock body scroll when drawer is open
  useEffect(() => {
    if (filter) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [filter]);

  if (!filter) return null;

  const totalAmount = transactions.reduce(
    (s, t) => s + (t.netAmount !== undefined ? t.netAmount : t.amount),
    0
  );

  const getHeaderIcon = () => {
    switch (filter.type) {
      case "merchant":
        return Store;
      case "day":
      case "point":
        return Calendar;
      case "split":
        return Users;
      case "category":
      default:
        return Tag;
    }
  };

  const HeaderIcon = getHeaderIcon();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[120] flex items-end justify-center pointer-events-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Bottom Sheet Container */}
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", stiffness: 400, damping: 35 }}
          className="relative w-full max-w-xl max-h-[85vh] bg-[var(--color-bg)] border-t-2 sm:border-2 border-[var(--color-border)] sm:rounded-t-3xl rounded-t-2xl shadow-2xl flex flex-col z-10 overflow-hidden"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          {/* Drag Handle Bar */}
          <div className="flex justify-center pt-2.5 pb-1 cursor-grab">
            <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
          </div>

          {/* Header */}
          <div className="p-3.5 sm:p-5 border-b-2 border-[var(--color-border)] bg-[var(--color-surface)] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-black border border-black/20 shrink-0"
                  style={{ backgroundColor: filter.color || "var(--color-primary)" }}
                >
                  <HeaderIcon className="w-4 h-4 stroke-[2.5px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm sm:text-base font-display font-black text-[var(--color-text)] truncate">
                    {filter.name}
                  </h3>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block truncate">
                    Filtered History ({transactions.length} items)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 sm:p-2 rounded-xl bg-[var(--color-bg)] border-2 border-[var(--color-border)] text-gray-400 hover:text-[var(--color-text)] hover:border-gray-500 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-4 h-4 stroke-[2.5px]" />
                </button>
              </div>
            </div>

            {/* Sub-header metrics row */}
            <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)] text-xs font-bold">
              <span className="text-[10px] uppercase tracking-wider text-gray-400">Total Filtered Outlay</span>
              <span className="font-display font-black text-rose-400">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Scrollable Transaction List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2 max-h-[55vh]">
            {transactions.length === 0 ? (
              <div className="py-12 text-center text-gray-500 font-bold uppercase text-xs">
                No matching transactions found in this date window.
              </div>
            ) : (
              transactions.map((txn) => {
                const category = categories.find((c) => c.id === txn.categoryId);
                const CatIcon = category?.icon ? getCategoryIcon(category.icon) : Tag;
                const effectiveAmount = txn.netAmount !== undefined ? txn.netAmount : txn.amount;

                return (
                  <motion.div
                    key={txn.id}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      if (onSelectTransaction) onSelectTransaction(txn);
                    }}
                    className="p-2.5 sm:p-3 rounded-2xl bg-[var(--color-surface)] border-2 border-[var(--color-border)] hover:border-[var(--color-primary)] transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-black border border-black/20 shrink-0"
                        style={{ backgroundColor: category?.color || "#94a3b8" }}
                      >
                        <CatIcon className="w-3.5 h-3.5 stroke-[2.5px]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black uppercase tracking-wider text-[var(--color-text)] truncate">
                          {txn.description}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[9px] sm:text-[10px] font-bold text-gray-400 flex-wrap">
                          <span>{formatDate(txn.date, "short")}</span>
                          {txn.payee && <span className="truncate">· {txn.payee}</span>}
                          {txn.splits && txn.splits.length > 0 && (
                            <span className="px-1 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/40 rounded text-[8px] sm:text-[9px] shrink-0">
                              Split ({txn.splits.length})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-display font-black ${
                          txn.type === "income" ? "text-emerald-400" : "text-[var(--color-text)]"
                        }`}
                      >
                        {txn.type === "income" ? "+" : "-"}
                        {formatCurrency(effectiveAmount)}
                      </p>
                      {txn.netAmount !== undefined && (
                        <p className="text-[8px] font-bold text-gray-500">
                          (Net)
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
