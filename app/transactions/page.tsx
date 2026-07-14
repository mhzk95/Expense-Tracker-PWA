"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, hexToRgb, vibrate, cn, getCategoryIcon } from "@/lib/utils/helpers";
import { ArrowLeftRight, Filter, MapPin, X, Check, Trash2, Tag, Calendar, ChevronDown } from "lucide-react";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { AddTransactionAction } from "@/components/dashboard/AddTransactionAction";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionEntity } from "@/lib/db/indexeddb";
import { MarqueeText } from "@/components/ui/MarqueeText";
import { FlashEntryModal } from "@/components/transactions/FlashEntryModal";
import { TransactionDetailSheet } from "@/components/transactions/TransactionDetailSheet";
import { motion, AnimatePresence } from "framer-motion";

export default function TransactionsPage() {
  const { transactions: rawTransactions, loading: txLoading, updateTransaction, deleteTransaction } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const { accounts, loading: accLoading } = useAccounts();
  
  const loading = txLoading || catLoading || accLoading;
  
  const [editingTxn, setEditingTxn] = useState<TransactionEntity | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<TransactionEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyNeedsReview, setShowOnlyNeedsReview] = useState(false);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);

  const [selectedTxIds, setSelectedTxIds] = useState<Set<string>>(new Set());
  const [showBulkCategoryPicker, setShowBulkCategoryPicker] = useState(false);
  const [showFlashEntry, setShowFlashEntry] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    const history = localStorage.getItem("search_history");
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch {}
    }
  }, []);

  const addSearchToHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchHistory((prev) => {
      const updated = [trimmed, ...prev.filter(q => q !== trimmed)].slice(0, 5);
      localStorage.setItem("search_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleBulkMarkReviewed = async () => {
    try {
      for (const id of selectedTxIds) {
        await updateTransaction(id, { needsReview: false });
      }
      setSelectedTxIds(new Set());
      vibrate([50]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkChangeCategory = async (catId: string) => {
    try {
      for (const id of selectedTxIds) {
        await updateTransaction(id, { categoryId: catId });
      }
      setSelectedTxIds(new Set());
      setShowBulkCategoryPicker(false);
      vibrate([50]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedTxIds) {
        await deleteTransaction(id);
      }
      setSelectedTxIds(new Set());
      vibrate([50]);
    } catch (e) {
      console.error(e);
    }
  };

  const getLocationDisplay = (locationStr?: string) => {
    if (!locationStr) return null;
    try {
      const loc = JSON.parse(locationStr);
      const name = loc.display || loc.city || loc.place_name;
      if (name) {
        if (loc.source === "google_link" || loc.source === "overpass") return `📍 ${name}`;
        return name;
      }
      if (loc.lat && loc.lon) {
        return `${Number(loc.lat).toFixed(5)}, ${Number(loc.lon).toFixed(5)}`;
      }
      return null;
    } catch {
      return locationStr;
    }
  };

  const needsReviewCount = rawTransactions.filter(t => t.needsReview).length;

  const now = new Date();
  
  const todayTxns = rawTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  
  const monthTxns = rawTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const getNetTotal = (txns: TransactionEntity[]) => {
    return txns.reduce((acc, t) => {
      if (t.type === "expense") return acc - t.amount;
      if (t.type === "income") return acc + t.amount;
      return acc;
    }, 0);
  };

  const todayTotal = getNetTotal(todayTxns);
  const monthTotal = getNetTotal(monthTxns);
  const currentMonthName = now.toLocaleString('default', { month: 'short' });

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
      // Intentionally left empty or remove event listeners entirely if we no longer need collapse on scroll
    };
    window.addEventListener("scroll", handleCollapse, { passive: true });
    document.addEventListener("click", handleCollapse);
    return () => {
      window.removeEventListener("scroll", handleCollapse);
      document.removeEventListener("click", handleCollapse);
    };
  }, []);



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

      {/* Top Cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3 px-4">
          {/* Today */}
          <button 
            type="button"
            onClick={() => setSelectedDateRange(prev => prev === 'today' ? null : 'today')}
            className={cn(
              "bg-slate-900/40 border rounded-2xl p-3 flex flex-col relative overflow-hidden group text-left transition-all active:scale-[0.98]",
              selectedDateRange === 'today' ? "border-emerald-500/50 bg-slate-900/80 ring-1 ring-emerald-500/20" : "border-emerald-500/10 hover:border-emerald-500/30"
            )}
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -ml-10 -mt-10 pointer-events-none" />
            <div className="flex flex-col justify-between h-full relative z-10 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                   <Calendar className="w-4 h-4" />
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", selectedDateRange === 'today' ? "text-emerald-400 rotate-180" : "text-slate-500")} />
              </div>
              <div className="flex flex-col mt-3">
                <span className="text-[10px] text-slate-400 font-medium">Today's total</span>
                <span className="text-lg font-extrabold text-white tracking-tight truncate">
                  {todayTotal < 0 ? "-" : ""}{formatCurrency(Math.abs(todayTotal), "INR")}
                </span>
              </div>
            </div>
            <div className="mt-1 text-[9px] text-slate-500 relative z-10">
              {todayTxns.length} transactions
            </div>
          </button>

          {/* Month */}
          <button 
            type="button"
            onClick={() => setSelectedDateRange(prev => prev === 'month' ? null : 'month')}
            className={cn(
              "bg-slate-900/40 border rounded-2xl p-3 flex flex-col relative overflow-hidden group text-left transition-all active:scale-[0.98]",
              selectedDateRange === 'month' ? "border-violet-500/50 bg-slate-900/80 ring-1 ring-violet-500/20" : "border-violet-500/10 hover:border-violet-500/30"
            )}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
            <div className="flex flex-col justify-between h-full relative z-10 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 shrink-0">
                   <Calendar className="w-4 h-4" />
                </div>
                <ChevronDown className={cn("w-3.5 h-3.5 shrink-0 transition-transform", selectedDateRange === 'month' ? "text-violet-400 rotate-180" : "text-slate-500")} />
              </div>
              <div className="flex flex-col mt-3">
                <span className="text-[10px] text-slate-400 font-medium">{currentMonthName} total</span>
                <span className="text-lg font-extrabold text-white tracking-tight truncate">
                  {monthTotal < 0 ? "-" : ""}{formatCurrency(Math.abs(monthTotal), "INR")}
                </span>
              </div>
            </div>
            <div className="mt-1 text-[9px] text-slate-500 relative z-10">
              {monthTxns.length} transactions
            </div>
          </button>
        </div>
      )}

      {/* Unified Search and filter toolbar + panel container to prevent layout jerking */}
      <div className="space-y-0">
        {/* Search and filter toolbar */}
        <div className="flex flex-col gap-2">
          {/* Search Row */}
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addSearchToHistory(searchQuery);
                  }
                }}
                placeholder="Search transactions..."
                className="w-full bg-slate-950/40 border border-slate-800/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-violet-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={cn(
                "flex items-center justify-center p-2.5 rounded-xl border transition-all select-none shrink-0",
                showFiltersPanel || selectedType || selectedCategory || selectedDateRange
                  ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                  : "bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white"
              )}
              title="Filter transactions"
              aria-label="Filter transactions"
            >
              <Filter className="h-4 w-4" />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 w-full">
            {(selectedType !== null || selectedCategory !== null || selectedDateRange !== null || showOnlyNeedsReview || selectedTxIds.size > 0) && (
              <button
                onClick={() => {
                  setSelectedType(null);
                  setSelectedCategory(null);
                  setSelectedDateRange(null);
                  setShowOnlyNeedsReview(false);
                  setSelectedTxIds(new Set());
                  setIsSelectMode(false);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 transition-all select-none whitespace-nowrap shrink-0"
                title="Clear all filters / selection"
              >
                <X className="h-3.5 w-3.5" />
                {selectedTxIds.size > 0 || isSelectMode ? "Deselect" : "Clear"}
              </button>
            )}

            <button
              onClick={() => {
                if (selectedTxIds.size > 0 || isSelectMode) {
                  setSelectedTxIds(new Set());
                  setIsSelectMode(false);
                } else {
                  setIsSelectMode(true);
                }
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all select-none whitespace-nowrap shrink-0",
                isSelectMode || selectedTxIds.size > 0
                  ? "bg-violet-500/20 text-violet-400 border-violet-500/30"
                  : "bg-slate-800/40 text-slate-400 border-slate-700/40 hover:text-white"
              )}
              title="Toggle bulk select"
            >
              <span>☑ Bulk</span>
            </button>

            <button
              onClick={() => setShowOnlyNeedsReview(!showOnlyNeedsReview)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all select-none whitespace-nowrap shrink-0",
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

            <button
              onClick={() => setShowFlashEntry(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 border border-violet-500/50 shadow-lg shadow-violet-600/20 transition-all select-none whitespace-nowrap shrink-0 ml-auto"
              title="Flash Entry"
            >
              <span>⚡ Flash</span>
            </button>
          </div>
        </div>

        {/* Search History Row */}
        {isSearchFocused && searchQuery === "" && searchHistory.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 pr-1 flex-shrink-0">Recent:</span>
            {searchHistory.map((q) => (
              <button
                key={q}
                onClick={() => setSearchQuery(q)}
                className="px-2.5 py-0.5 rounded-full text-[10px] bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all flex-shrink-0 active:scale-95 select-none"
              >
                {q}
              </button>
            ))}
            <button
              onClick={() => {
                setSearchHistory([]);
                localStorage.removeItem("search_history");
              }}
              className="text-[9px] font-medium text-red-500 hover:text-red-400 ml-auto flex-shrink-0 pl-2 select-none"
            >
              Clear
            </button>
          </div>
        )}

        {/* Advanced Filters Panel */}
        <AnimatePresence initial={false}>
          {showFiltersPanel && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="pt-3">
                <div className="bg-[#0c101c]/95 border border-slate-800/80 rounded-2xl p-4 space-y-4 shadow-xl">
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
        <div className="pb-8">
          {(() => {
            const groupedTransactions = transactions.reduce((acc, t) => {
              const d = new Date(t.date);
              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              
              let label = dateStr;
              const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              const yesterday = new Date(now.getTime() - 86400000);
              const isYesterday = yesterday.getDate() === d.getDate() && yesterday.getMonth() === d.getMonth() && yesterday.getFullYear() === d.getFullYear();
              
              if (isToday) label = `Today • ${dateStr}`;
              else if (isYesterday) label = `Yesterday • ${dateStr}`;
              else label = `Earlier • ${dateStr}`;
          
              const key = d.toDateString();
              
              if (!acc[key]) {
                acc[key] = { key, label, date: d, txns: [], total: 0 };
              }
              acc[key].txns.push(t);
              if (t.type === 'expense') acc[key].total -= t.amount;
              if (t.type === 'income') acc[key].total += t.amount;
              
              return acc;
            }, {} as Record<string, { key: string, label: string, date: Date, txns: TransactionEntity[], total: number }>);
          
            const sortedGroups = Object.values(groupedTransactions).sort((a, b) => b.date.getTime() - a.date.getTime());

            return sortedGroups.map((group) => (
              <div key={group.key} className="space-y-3 mb-6 last:mb-0">
                <div 
                  className="flex items-center justify-between px-2 cursor-pointer group/header select-none"
                  onClick={() => {
                    setCollapsedGroups(prev => {
                      const next = new Set(prev);
                      if (next.has(group.key)) next.delete(group.key);
                      else next.add(group.key);
                      return next;
                    });
                  }}
                >
                  <span className="text-[11px] font-bold text-slate-300">{group.label}</span>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[11px] font-bold", group.total < 0 ? "text-violet-400" : "text-emerald-400")}>
                      {group.total < 0 ? "-" : ""}{formatCurrency(Math.abs(group.total), "INR")}
                    </span>
                    <ChevronDown className={cn("w-3.5 h-3.5 text-slate-500 transition-transform", !collapsedGroups.has(group.key) ? "rotate-180 text-violet-400" : "")} />
                  </div>
                </div>
                
                <AnimatePresence initial={false}>
                  {!collapsedGroups.has(group.key) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3 overflow-hidden"
                    >
                      {group.txns.map((txn) => {
                        const category = categories.find((c) => c.id === txn.categoryId);
            const isIncome = txn.type === "income";
            const isTransfer = txn.type === "transfer";
            const baseColor = category?.color || "#8b5cf6";

            const isSelected = selectedTxIds.has(txn.id);

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
              >
                <div 
                  className={cn(
                    "glass-card interactive flex flex-col w-full transition-all duration-300 select-none border border-transparent active:scale-[0.98] active:bg-white/5",
                    txn.needsReview && "needs-review-card border-l-2 border-l-amber-500/60",
                    selectedTxn?.id === txn.id && "shadow-lg shadow-black/40 ring-1 ring-white/10",
                    isSelected && "ring-2 ring-violet-500/60 bg-violet-950/10"
                  )}
                  style={{ 
                    "--color-primary": baseColor,
                    "--color-primary-rgb": hexToRgb(baseColor),
                    "--color-primary-glow": "rgba(var(--color-primary-rgb), var(--card-glow-intensity))",
                    "--color-primary-glow-hover": "rgba(var(--color-primary-rgb), var(--card-glow-hover-intensity))",
                    "--glass-border-gradient": "linear-gradient(135deg, rgba(var(--color-primary-rgb), 0.35) 0%, rgba(var(--color-primary-rgb), 0.05) 40%, rgba(var(--color-primary-rgb), 0.02) 60%, var(--color-primary) 100%)",
                    borderColor: `${baseColor}20`,
                    boxShadow: `0 4px 15px -3px ${baseColor}10, inset 0 1px 0px rgba(255,255,255,0.05)`,
                    WebkitTouchCallout: "none",
                  } as React.CSSProperties}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSelectMode || selectedTxIds.size > 0) {
                      const newSelected = new Set(selectedTxIds);
                      if (newSelected.has(txn.id)) {
                        newSelected.delete(txn.id);
                      } else {
                        newSelected.add(txn.id);
                      }
                      setSelectedTxIds(newSelected);
                      vibrate([10]);
                    } else {
                      setSelectedTxn(txn);
                      vibrate([20]);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 w-full px-4 py-2.5">
                    {/* Checkbox (visible in select mode) */}
                    {(isSelectMode || selectedTxIds.size > 0) && (
                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <div className="h-5 w-5 rounded-full bg-violet-500 border border-violet-400 flex items-center justify-center text-white">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-5 w-5 rounded-full border border-slate-700 bg-slate-950/40" />
                        )}
                      </div>
                    )}

                    {/* Icon */}
                    <div
                      className="flex-shrink-0 min-h-tap-target min-w-tap-target rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: `${baseColor}20`,
                        color: baseColor 
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

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <MarqueeText 
                        text={txn.payee || txn.description || "No Payee"} 
                        className="text-body font-semibold text-white text-balance" 
                      />
                      <div className="flex flex-col mt-1 text-sm text-slate-400 min-w-0">
                        {txn.payee && txn.description !== "Quick Entry" ? (
                          <span className="text-slate-300 truncate">{txn.description}</span>
                        ) : null}
                        <span className="truncate text-slate-500">{txn.description || "No description"}</span>
                        <span className="whitespace-nowrap mt-0.5">{formatDate(txn.date, "medium")}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right flex flex-col justify-start pt-1 items-end flex-shrink-0 h-full">
                      <p
                        className={cn(
                          "text-body font-bold tabular-nums text-balance",
                          isIncome ? "text-emerald-400" : isTransfer ? "text-slate-300" : "text-white"
                        )}
                      >
                        {isIncome ? "+" : isTransfer ? "" : "−"}{formatCurrency(txn.amount, txn.currency)}
                      </p>
                    </div>
                  </div>

                </div>
              </SwipeToDelete>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ));
          })()}
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
        contentClassName="p-0 max-h-[90vh] md:max-h-[85vh] flex flex-col overflow-hidden"
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

      {/* Sticky Bottom Bulk Actions Bar */}
      <AnimatePresence>
        {selectedTxIds.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[84px] inset-x-4 z-40 bg-[#0c101c]/95 backdrop-blur-md border border-slate-800/80 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Selected</span>
              <span className="text-sm font-bold text-white mt-0.5">{selectedTxIds.size} items</span>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Mark as Reviewed */}
              <button
                onClick={handleBulkMarkReviewed}
                className="flex items-center justify-center p-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-all active:scale-95"
                title="Mark Reviewed"
              >
                <Check className="h-4 w-4" />
              </button>

              {/* Bulk Change Category */}
              <div className="relative">
                <button
                  onClick={() => setShowBulkCategoryPicker(!showBulkCategoryPicker)}
                  className="flex items-center justify-center p-2 rounded-xl bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/20 transition-all active:scale-95"
                  title="Change Category"
                >
                  <Tag className="h-4 w-4" />
                </button>
                {/* Popover for Category Picker */}
                <AnimatePresence>
                  {showBulkCategoryPicker && (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 10 }}
                      className="absolute bottom-12 right-0 bg-[#0c101c] border border-slate-800 rounded-xl p-2 shadow-xl w-48 max-h-48 overflow-y-auto space-y-1 z-50 scrollbar-none"
                    >
                      <div className="text-[9px] uppercase font-bold tracking-widest text-slate-500 p-1">Change Category</div>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleBulkChangeCategory(cat.id)}
                          className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-white hover:bg-slate-900 transition-colors flex items-center gap-2"
                        >
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bulk Delete */}
              <button
                onClick={() => {
                  if (confirm(`Delete the ${selectedTxIds.size} selected transactions?`)) {
                    handleBulkDelete();
                  }
                }}
                className="flex items-center justify-center p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all active:scale-95"
                title="Delete Selected"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Cancel Selection */}
              <button
                onClick={() => {
                  setSelectedTxIds(new Set());
                  setShowBulkCategoryPicker(false);
                  setIsSelectMode(false);
                }}
                className="flex items-center justify-center p-2 rounded-xl bg-slate-850 text-slate-400 hover:text-white border border-slate-700/40 transition-all active:scale-95"
                title="Clear Selection"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Flash Entry Modal */}
      <FlashEntryModal 
        isOpen={showFlashEntry} 
        onClose={() => setShowFlashEntry(false)} 
        defaultAccountId={accounts.find(a => a.isDefault)?.id || accounts[0]?.id || ""}
      />

      <TransactionDetailSheet 
        txn={selectedTxn} 
        onClose={() => setSelectedTxn(null)} 
      />
    </div>
  );
}
