"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, hexToRgb, vibrate } from "@/lib/utils/helpers";
import { cn } from "@/lib/utils/helpers";
import { ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Filter, MapPin, X } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyNeedsReview, setShowOnlyNeedsReview] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);

  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMoving = useRef(false);

  const getLocationDisplay = (locationStr?: string) => {
    if (!locationStr) return null;
    try {
      const loc = JSON.parse(locationStr);
      const name = loc.display || loc.city || loc.place_name;
      if (name) return name;
      if (loc.lat && loc.lon) {
        return `${Number(loc.lat).toFixed(5)}, ${Number(loc.lon).toFixed(5)}`;
      }
      return null;
    } catch {
      return locationStr;
    }
  };

  const needsReviewCount = rawTransactions.filter(t => t.needsReview).length;

  const transactions = [...rawTransactions]
    .filter((t) => {
      if (showOnlyNeedsReview && !t.needsReview) return false;
      if (selectedType && t.type !== selectedType) return false;
      if (selectedCategory && t.categoryId !== selectedCategory) return false;
      if (selectedDateRange) {
        const now = new Date();
        const txDate = new Date(t.date);
        if (selectedDateRange === "today") {
          if (txDate.toDateString() !== now.toDateString()) return false;
        } else if (selectedDateRange === "week") {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          if (txDate < oneWeekAgo) return false;
        } else if (selectedDateRange === "month") {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          if (txDate < oneMonthAgo) return false;
        }
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = t.description?.toLowerCase().includes(query);
        const matchesPayee = t.payee?.toLowerCase().includes(query);
        const matchesNote = t.note?.toLowerCase().includes(query);
        return matchesDesc || matchesPayee || matchesNote;
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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

  const touchStartPos = useRef({ x: 0, y: 0 });
  const isTouchDevice = useRef(false);

  const startLongPress = (txnId: string, clientX: number, clientY: number) => {
    isMoving.current = false;
    touchStartPos.current = { x: clientX, y: clientY };
    
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    longPressTimeoutRef.current = setTimeout(() => {
      if (!isMoving.current) {
        vibrate([30]);
        setExpandedTxnId((prev) => (prev === txnId ? null : txnId));
      }
    }, 500);
  };

  const moveLongPress = (clientX: number, clientY: number) => {
    const deltaX = Math.abs(clientX - touchStartPos.current.x);
    const deltaY = Math.abs(clientY - touchStartPos.current.y);
    
    // Only cancel long press if finger moved more than 10 pixels (slop tolerance)
    if (deltaX > 10 || deltaY > 10) {
      isMoving.current = true;
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
      }
    }
  };

  const cancelLongPress = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
  };

  const handleTouchStart = (txnId: string, e: React.TouchEvent) => {
    isTouchDevice.current = true;
    const touch = e.touches[0];
    startLongPress(txnId, touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    moveLongPress(touch.clientX, touch.clientY);
  };

  const handleMouseDown = (txnId: string, e: React.MouseEvent) => {
    if (isTouchDevice.current) return;
    startLongPress(txnId, e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isTouchDevice.current) return;
    moveLongPress(e.clientX, e.clientY);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        subtitle={loading ? "Loading..." : `${transactions.length} transactions`}
        action={
          <div className="flex items-center gap-2">
            <AddTransactionAction />
          </div>
        }
      />

      {/* Search and filter toolbar */}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions..."
            className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFiltersPanel(!showFiltersPanel)}
          className={cn(
            "flex items-center justify-center p-2 rounded-xl border transition-all select-none",
            showFiltersPanel || selectedType || selectedCategory || selectedDateRange
              ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
              : "bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white"
          )}
          title="Filter transactions"
        >
          <Filter className="h-3.5 w-3.5" />
        </button>

        {(selectedType !== null || selectedCategory !== null || selectedDateRange !== null || showOnlyNeedsReview) && (
          <button
            onClick={() => {
              setSelectedType(null);
              setSelectedCategory(null);
              setSelectedDateRange(null);
              setShowOnlyNeedsReview(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-all select-none"
            title="Clear all filters"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}

        <button
          onClick={() => setShowOnlyNeedsReview(!showOnlyNeedsReview)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all select-none",
            showOnlyNeedsReview
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
              : "bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white"
          )}
        >
          <span>⚡ Review</span>
          {needsReviewCount > 0 && (
            <span className="h-4 min-w-[16px] px-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
              {needsReviewCount}
            </span>
          )}
        </button>
      </div>

      {/* Advanced Filters Panel */}
      {/* Advanced Filters Panel wrapper to prevent space-y jerking */}
      <div className="empty:hidden">
        <AnimatePresence initial={false}>
          {showFiltersPanel && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-4 bg-[#0c101c]/95 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-xl">
                {/* Type filter */}
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-2">Type</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "All", value: null },
                      { label: "Expense", value: "expense" },
                      { label: "Income", value: "income" },
                      { label: "Transfer", value: "transfer" }
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedType(opt.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                          selectedType === opt.value
                            ? "bg-violet-500/25 border-violet-500/50 text-white font-semibold"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date filter */}
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-2">Date Range</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "All Time", value: null },
                      { label: "Today", value: "today" },
                      { label: "Last 7 Days", value: "week" },
                      { label: "Last 30 Days", value: "month" }
                    ].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setSelectedDateRange(opt.value)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                          selectedDateRange === opt.value
                            ? "bg-violet-500/25 border-violet-500/50 text-white font-semibold"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category filter */}
                <div>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block mb-2">Category</span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                        selectedCategory === null
                          ? "bg-violet-500/25 border-violet-500/50 text-white font-semibold"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                      )}
                    >
                      All Categories
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-medium border transition-all",
                          selectedCategory === cat.id
                            ? "bg-white/10 border-white/20 text-white font-semibold"
                            : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white"
                        )}
                        style={selectedCategory === cat.id ? { borderColor: cat.color, backgroundColor: `${cat.color}25` } : {}}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear filters action */}
                {(selectedType !== null || selectedCategory !== null || selectedDateRange !== null) && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => {
                        setSelectedType(null);
                        setSelectedCategory(null);
                        setSelectedDateRange(null);
                      }}
                      className="text-[10px] font-semibold text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card px-4 py-2.5 flex items-center gap-3 animate-pulse">
              <div className="h-8 w-8 rounded-full bg-slate-800/60" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-24 bg-slate-800/60 rounded-full" />
                <div className="h-2 w-16 bg-slate-800/60 rounded-full" />
              </div>
              <div className="h-3.5 w-12 bg-slate-800/60 rounded-full" />
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
                    "glass-card interactive flex flex-col px-4 py-2.5 w-full transition-all duration-300 select-none",
                    txn.needsReview && "needs-review-card border-l-2 border-l-amber-500/60",
                    isExpanded && "shadow-lg shadow-black/40 ring-1 ring-white/10"
                  )}
                  style={{ 
                    "--color-primary": baseColor,
                    "--color-primary-rgb": hexToRgb(baseColor),
                    "--color-primary-glow": "rgba(var(--color-primary-rgb), var(--card-glow-intensity))",
                    "--color-primary-glow-hover": "rgba(var(--color-primary-rgb), var(--card-glow-hover-intensity))",
                    "--glass-border-gradient": "linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.35) 0%, rgba(var(--color-primary-rgb), 0.05) 40%, rgba(var(--color-primary-rgb), 0.02) 60%, var(--color-primary) 100%)",
                    WebkitTouchCallout: "none",
                  } as React.CSSProperties}
                  onTouchStart={(e) => handleTouchStart(txn.id, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={cancelLongPress}
                  onMouseDown={(e) => handleMouseDown(txn.id, e)}
                  onMouseMove={handleMouseMove}
                  onMouseUp={cancelLongPress}
                  onContextMenu={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                        isIncome
                          ? "bg-emerald-500/15 text-emerald-400"
                          : isTransfer
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-red-500/15 text-red-400"
                      )}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="h-4 w-4" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="h-4 w-4" />
                      ) : (
                        <ArrowUpRight className="h-4 w-4" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">
                        {txn.payee || "No Payee"}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400">
                        <span className="truncate">{txn.description || "No description"}</span>
                        <span className="text-slate-600">·</span>
                        <span>{formatDate(txn.date, "medium")}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex flex-col justify-center items-end flex-shrink-0">
                      <p
                        className={cn(
                          "text-xs font-bold tabular-nums",
                          isIncome ? "text-emerald-400" : isTransfer ? "text-slate-300" : "text-white"
                        )}
                      >
                        {isIncome ? "+" : "−"}{formatCurrency(txn.amount, txn.currency)}
                      </p>
                    </div>
                  </div>

                  {/* Expanded notes area */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-3 pt-3 border-t border-white/5 space-y-2.5"
                      >
                        {txn.payee && (
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Payee</span>
                            <span className="text-xs text-slate-300 mt-0.5 block font-medium">
                              {txn.payee}
                            </span>
                          </div>
                        )}
                        {txn.payee && txn.description !== "Quick Entry" && (
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Item Name</span>
                            <span className="text-xs text-slate-300 mt-0.5 block font-medium">
                              {txn.description}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Notes</span>
                          <p className="text-xs text-slate-300 mt-0.5 whitespace-pre-wrap leading-relaxed">
                            {txn.note || "No notes provided."}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 pt-0.5">
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Category</span>
                            <span className="text-xs text-slate-300 mt-0.5 block flex items-center gap-1.5">
                              {category && (
                                <span 
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              {category?.name ?? "Other"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Account</span>
                            <span className="text-xs text-slate-300 mt-0.5 block">
                              {accounts.find(a => a.id === txn.accountId)?.name || "Unknown Account"}
                            </span>
                          </div>
                          {txn.type === "transfer" && txn.toAccountId && (
                            <div>
                              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">To Account</span>
                              <span className="text-xs text-slate-300 mt-0.5 block">
                                {accounts.find(a => a.id === txn.toAccountId)?.name || "Unknown Account"}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Status</span>
                            <span className="text-xs text-slate-300 mt-0.5 block capitalize flex items-center gap-1.5">
                              {txn.status || "completed"}
                              {txn.needsReview && (
                                <span className="text-[8px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1 py-0.5 rounded leading-none">
                                  Review
                                </span>
                              )}
                            </span>
                          </div>
                          {getLocationDisplay(txn.location) && (
                            <div className="col-span-2">
                              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">Location</span>
                              <div className="mt-0.5">
                                <span className="text-xs text-slate-300 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-violet-400 flex-shrink-0" />
                                  {getLocationDisplay(txn.location)}
                                </span>
                                {(() => {
                                  try {
                                    const loc = JSON.parse(txn.location || "");
                                    if (loc.lat && loc.lon) {
                                      return (
                                        <a
                                          href={`https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lon}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[9px] text-violet-400 hover:text-violet-300 transition-colors mt-0.5 inline-block font-semibold"
                                        >
                                          View on Google Maps
                                        </a>
                                      );
                                    }
                                  } catch {}
                                  return null;
                                })()}
                              </div>
                            </div>
                          )}
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
