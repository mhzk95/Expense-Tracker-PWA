"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, hexToRgb, vibrate, cn, getCategoryIcon } from "@/lib/utils/helpers";
import { ArrowLeftRight, Filter, MapPin, X, Check, Trash2, Tag, Calendar, ChevronDown, Clock, ChevronRight, CheckSquare, Zap } from "lucide-react";
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
      } catch { }
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
        <div className="grid grid-cols-2 gap-3">
          {/* Today */}
          <button
            type="button"
            onClick={() => setSelectedDateRange(prev => prev === 'today' ? null : 'today')}
            className={cn(
              "bg-white border-[3px] sm:border-4 border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] rounded-[16px] sm:rounded-[24px] p-3 sm:p-5 flex flex-col relative overflow-hidden group text-left transition-all active:translate-x-1 active:translate-y-1 active:shadow-none",
              selectedDateRange === 'today' ? "bg-emerald-400" : ""
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 w-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-2 border-black bg-white flex items-center justify-center text-black shrink-0 shadow-[2px_2px_0px_0px_#000]">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5px]" />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden mt-1 sm:mt-0">
                <span className="text-[9px] sm:text-[10px] uppercase font-black tracking-widest text-black">Today</span>
                <span className="text-lg sm:text-2xl font-black text-black tracking-tight truncate mt-0.5">
                  {todayTotal < 0 ? "-" : ""}{formatCurrency(Math.abs(todayTotal), "INR")}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-700 mt-0.5 uppercase tracking-wider">Spent</span>
              </div>
            </div>
            <div className="mt-2 sm:mt-4 pt-2 sm:pt-4 border-t-[3px] border-black w-full flex justify-center">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-black">{todayTxns.length} Transactions</span>
            </div>
          </button>

          {/* Month */}
          <button
            type="button"
            onClick={() => setSelectedDateRange(prev => prev === 'month' ? null : 'month')}
            className={cn(
              "bg-white border-[3px] sm:border-4 border-black shadow-[4px_4px_0px_0px_#000] sm:shadow-[6px_6px_0px_0px_#000] rounded-[16px] sm:rounded-[24px] p-3 sm:p-5 flex flex-col relative overflow-hidden group text-left transition-all active:translate-x-1 active:translate-y-1 active:shadow-none",
              selectedDateRange === 'month' ? "bg-[var(--color-primary)] text-white" : ""
            )}
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 w-full">
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl border-2 border-black bg-white flex items-center justify-center text-black shrink-0 shadow-[2px_2px_0px_0px_#000]">
                <Calendar className="w-4 h-4 sm:w-6 sm:h-6 stroke-[2.5px]" />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden mt-1 sm:mt-0">
                <span className={cn("text-[9px] sm:text-[10px] uppercase font-black tracking-widest", selectedDateRange === 'month' ? "text-white" : "text-black")}>{currentMonthName} Total</span>
                <span className={cn("text-lg sm:text-2xl font-black tracking-tight truncate mt-0.5", selectedDateRange === 'month' ? "text-white" : "text-black")}>
                  {monthTotal < 0 ? "-" : ""}{formatCurrency(Math.abs(monthTotal), "INR")}
                </span>
                <span className={cn("text-[10px] sm:text-xs font-bold mt-0.5 uppercase tracking-wider", selectedDateRange === 'month' ? "text-white/80" : "text-gray-700")}>Spent</span>
              </div>
            </div>
            <div className={cn("mt-2 sm:mt-4 pt-2 sm:pt-4 border-t-[3px] border-black w-full flex justify-center", selectedDateRange === 'month' ? "border-white" : "border-black")}>
              <span className={cn("text-[10px] sm:text-xs font-black uppercase tracking-wider", selectedDateRange === 'month' ? "text-white" : "text-black")}>{monthTxns.length} Transactions</span>
            </div>
          </button>
        </div>
      )}

      {/* Unified Search and filter toolbar + panel container to prevent layout jerking */}
      <div className="space-y-0">
        {/* Search and filter toolbar */}
        <div className="flex flex-col gap-2">
          {/* Search Row */}
          <div className="flex items-stretch gap-2 w-full h-[52px]">
            <div className="relative flex-1 h-full">
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
                className="w-full h-full bg-white border-[3px] border-black rounded-[16px] px-4 text-sm text-black placeholder-gray-500 outline-none shadow-[4px_4px_0px_0px_#000] focus:shadow-[6px_6px_0px_0px_#000] focus:-translate-x-0.5 focus:-translate-y-0.5 transition-all font-bold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-black p-1 bg-gray-200 border-2 border-black rounded-lg hover:bg-gray-300"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 stroke-[3px]" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={cn(
                "flex items-center justify-center w-[52px] h-full rounded-[16px] border-[3px] transition-all select-none shrink-0 font-bold active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_#000]",
                showFiltersPanel || selectedType || selectedCategory || selectedDateRange
                  ? "bg-[var(--color-primary)] text-white border-black"
                  : "bg-white text-black border-black hover:bg-gray-100"
              )}
              title="Filter transactions"
              aria-label="Filter transactions"
            >
              <Filter className="h-5 w-5 stroke-[2.5px]" />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-4 w-full mt-2">
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
                "flex items-center justify-center py-3.5 px-2 rounded-[16px] border-[3px] border-black transition-all text-xs sm:text-sm font-black uppercase tracking-wider active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_#000]",
                isSelectMode || selectedTxIds.size > 0
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-white text-black hover:bg-gray-100"
              )}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5px] flex-shrink-0" />
                <span className="text-center leading-tight">Select<br className="sm:hidden" /> Multiple</span>
              </div>
            </button>

            <button
              onClick={() => setShowOnlyNeedsReview(!showOnlyNeedsReview)}
              className={cn(
                "flex items-center justify-center py-3.5 px-2 rounded-[16px] border-[3px] border-black transition-all text-xs sm:text-sm font-black uppercase tracking-wider active:translate-x-1 active:translate-y-1 active:shadow-none shadow-[4px_4px_0px_0px_#000]",
                showOnlyNeedsReview
                  ? "bg-amber-400 text-black"
                  : "bg-white text-black hover:bg-amber-50"
              )}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Zap className={cn("w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5px] flex-shrink-0", !showOnlyNeedsReview && "text-amber-500")} />
                <span className="text-center leading-tight">Needs<br className="sm:hidden" /> Review</span>
              </div>
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
                <div className="bg-white border-[3px] border-black rounded-[20px] p-5 space-y-5 shadow-[4px_4px_0px_0px_#000]">
                  {/* Type filter */}
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-black block mb-3">Type</span>
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
                            "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border-[2px] transition-all",
                            selectedType === opt.value
                              ? "bg-[var(--color-primary)] border-black text-white shadow-[2px_2px_0px_0px_#000]"
                              : "bg-white border-black text-black hover:bg-gray-100"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date filter */}
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-black block mb-3">Date Range</span>
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
                            "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border-[2px] transition-all",
                            selectedDateRange === opt.value
                              ? "bg-[var(--color-primary)] border-black text-white shadow-[2px_2px_0px_0px_#000]"
                              : "bg-white border-black text-black hover:bg-gray-100"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category filter */}
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-black block mb-3">Category</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border-[2px] transition-all",
                          selectedCategory === null
                            ? "bg-[var(--color-primary)] border-black text-white shadow-[2px_2px_0px_0px_#000]"
                            : "bg-white border-black text-black hover:bg-gray-100"
                        )}
                      >
                        All Categories
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border-[2px] transition-all",
                            selectedCategory === cat.id
                              ? "border-black text-black shadow-[2px_2px_0px_0px_#000]"
                              : "bg-white border-black text-black hover:bg-gray-100"
                          )}
                          style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}
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
                        className="text-[11px] font-black uppercase tracking-wider text-red-500 hover:text-red-700 transition-colors"
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
            <div key={i} className="brutal-card px-4 py-2.5 flex items-center gap-3 animate-pulse bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_#000]">
              <div className="h-12 w-12 rounded-xl bg-gray-200 border-2 border-black" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 bg-gray-200 border-2 border-black rounded-full" />
                <div className="h-3 w-16 bg-gray-200 border border-black rounded-full" />
              </div>
              <div className="h-4 w-12 bg-gray-200 border-2 border-black rounded-full" />
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
        <div className="pb-32">
          {(() => {
            const groupedTransactions = transactions.reduce((acc, t) => {
              const d = new Date(t.date);
              const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

              let label = dateStr;
              const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
              const yesterday = new Date(now.getTime() - 86400000);
              const isYesterday = yesterday.getDate() === d.getDate() && yesterday.getMonth() === d.getMonth() && yesterday.getFullYear() === d.getFullYear();

              if (isToday) label = `Today`;
              else if (isYesterday) label = `Yesterday`;
              else label = `Earlier`;

              const key = d.toDateString();

              if (!acc[key]) {
                acc[key] = { key, label, date: d, txns: [], total: 0, isToday, isYesterday };
              }
              acc[key].txns.push(t);
              if (t.type === 'expense') acc[key].total -= t.amount;
              if (t.type === 'income') acc[key].total += t.amount;

              return acc;
            }, {} as Record<string, { key: string, label: string, date: Date, txns: TransactionEntity[], total: number, isToday: boolean, isYesterday: boolean }>);

            const sortedGroups = Object.values(groupedTransactions).sort((a, b) => b.date.getTime() - a.date.getTime());

            return sortedGroups.map((group) => (
              <div key={group.key} className="space-y-3 mb-6 last:mb-0">
                <div
                  className="flex items-center justify-between px-2 cursor-pointer group/header select-none mb-4"
                  onClick={() => {
                    setCollapsedGroups(prev => {
                      const next = new Set(prev);
                      if (next.has(group.key)) next.delete(group.key);
                      else next.add(group.key);
                      return next;
                    });
                  }}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className={cn("w-6 h-6 stroke-[2.5px]", group.isToday ? "text-emerald-500" : group.isYesterday ? "text-blue-500" : "text-black")} />
                    <div className="flex flex-col">
                      <span className="text-[12px] font-black text-black uppercase tracking-widest">{group.label}</span>
                      <span className="text-xs font-bold text-gray-500 mt-0.5">{group.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className={cn("text-[14px] font-black tracking-tight", group.isToday ? "text-emerald-500" : group.isYesterday ? "text-blue-500" : "text-black")}>
                        {group.total < 0 ? "-" : ""}{formatCurrency(Math.abs(group.total), "INR")}
                      </span>
                      <span className={cn("text-[10px] font-black uppercase tracking-widest mt-0.5", group.isToday ? "text-emerald-500" : group.isYesterday ? "text-blue-500" : "text-gray-500")}>{group.txns.length} Transaction{group.txns.length !== 1 ? 's' : ''}</span>
                    </div>
                    <ChevronDown className={cn("w-5 h-5 stroke-[3px] transition-transform", !collapsedGroups.has(group.key) ? "rotate-180 text-black" : "text-gray-400")} />
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {!collapsedGroups.has(group.key) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-3 overflow-hidden px-2 -mx-2 py-2 -my-2"
                    >
                      {group.txns.map((txn) => {
                        let category = categories.find((c) => c.id === txn.categoryId);
                        if (!category && (txn as any).category) {
                          category = categories.find((c) => c.name.toLowerCase() === (txn as any).category?.toLowerCase());
                        }

                        const isIncome = txn.type === "income";
                        const isTransfer = txn.type === "transfer";
                        const baseColor = category?.color || "#8b5cf6";

                        const isSelected = selectedTxIds.has(txn.id);

                        let locDisplay = txn.location;
                        try {
                          if (txn.location) {
                            const loc = JSON.parse(txn.location);
                            locDisplay = loc.display || loc.place_name || "Location saved";
                          }
                        } catch { }

                        const txDate = new Date(txn.date);
                        const timeStr = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

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
                                "bg-white rounded-[16px] flex items-center w-full transition-all duration-300 select-none border-[3px] border-black active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0px_0px_#000] active:shadow-none hover:bg-gray-50 px-4 py-3 gap-3 sm:gap-4",
                                txn.needsReview && "border-l-[6px] border-l-amber-400 bg-amber-50 hover:bg-amber-100",
                                selectedTxn?.id === txn.id && "shadow-[6px_6px_0px_0px_#000] ring-4 ring-black",
                                isSelected && "bg-[var(--color-primary)] ring-4 ring-black"
                              )}
                              style={{ WebkitTouchCallout: "none" }}
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
                              {/* Checkbox (visible in select mode) */}
                              {(isSelectMode || selectedTxIds.size > 0) && (
                                <div className="flex-shrink-0 mr-1">
                                  {isSelected ? (
                                    <div className="h-6 w-6 rounded-lg bg-black border-[3px] border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_#000]">
                                      <Check className="h-4 w-4 stroke-[4px]" />
                                    </div>
                                  ) : (
                                    <div className="h-6 w-6 rounded-lg border-[3px] border-black bg-white shadow-[2px_2px_0px_0px_#000]" />
                                  )}
                                </div>
                              )}

                              {/* Icon */}
                              <div
                                className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center border-[3px] border-black shadow-[2px_2px_0px_0px_#000] bg-white"
                                style={{
                                  backgroundColor: baseColor,
                                  color: "#000"
                                }}
                              >
                                {(() => {
                                  if (isTransfer) {
                                    return <ArrowLeftRight className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px]" />;
                                  }
                                  const IconComp = getCategoryIcon(category?.icon);
                                  return <IconComp className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3px]" />;
                                })()}
                              </div>

                              {/* Details */}
                              <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                                <h3 className={cn("text-[13px] sm:text-[14px] font-black tracking-wide uppercase truncate leading-tight", isSelected ? "text-white" : "text-black")}>
                                  {txn.payee || txn.description || "No Title"}
                                </h3>

                                <div className={cn("text-[10px] font-black uppercase tracking-widest leading-tight", isSelected ? "text-white/80" : "text-gray-500")}>
                                  <span className="truncate block">{category?.name ?? "Uncategorized"}</span>
                                  <span className="truncate block">{timeStr}</span>
                                </div>
                              </div>

                              {/* Amount & Review Badge */}
                              <div className="text-right flex flex-col items-end justify-start h-full pt-1">
                                <span
                                  className={cn(
                                    "text-[15px] sm:text-lg font-black tabular-nums text-right text-balance leading-tight mt-0.5",
                                    isIncome ? (isSelected ? "text-white" : "text-emerald-600") : isTransfer ? (isSelected ? "text-white" : "text-gray-500") : (isSelected ? "text-white" : "text-black")
                                  )}
                                >
                                  {isIncome ? "+" : isTransfer ? "" : "−"}
                                  {formatCurrency(txn.amount, txn.currency)}
                                </span>
                                {txn.needsReview && (
                                  <span className="text-[9px] font-black uppercase tracking-wider text-black bg-amber-400 border-2 border-black px-2 py-0.5 rounded-md leading-none mt-1">
                                    Review
                                  </span>
                                )}
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
            className="fixed bottom-[84px] inset-x-4 z-40 bg-[var(--color-primary)] border-4 border-black rounded-[24px] p-4 shadow-[6px_6px_0px_0px_#000] flex items-center justify-between gap-3 max-w-md mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-widest text-white/80">Selected</span>
              <span className="text-base font-black text-white mt-0.5">{selectedTxIds.size} items</span>
            </div>

            <div className="flex items-center gap-3">
              {/* Mark as Reviewed */}
              <button
                onClick={handleBulkMarkReviewed}
                className="flex items-center justify-center p-3 rounded-xl bg-amber-400 text-black border-2 border-black hover:bg-amber-300 shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                title="Mark Reviewed"
              >
                <Check className="h-5 w-5 stroke-[3px]" />
              </button>

              {/* Bulk Change Category */}
              <div className="relative">
                <button
                  onClick={() => setShowBulkCategoryPicker(!showBulkCategoryPicker)}
                  className="flex items-center justify-center p-3 rounded-xl bg-white text-black border-2 border-black hover:bg-gray-100 shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                  title="Change Category"
                >
                  <Tag className="h-5 w-5 stroke-[2.5px]" />
                </button>
                {/* Popover for Category Picker */}
                <AnimatePresence>
                  {showBulkCategoryPicker && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0, y: 10 }}
                      animate={{ scale: 1, opacity: 1, y: 0 }}
                      exit={{ scale: 0.95, opacity: 0, y: 10 }}
                      className="absolute bottom-16 right-0 bg-white border-[3px] border-black rounded-[20px] p-3 shadow-[6px_6px_0px_0px_#000] w-56 max-h-56 overflow-y-auto space-y-2 z-50 scrollbar-none"
                    >
                      <div className="text-[10px] uppercase font-black tracking-widest text-gray-500 p-1 mb-1">Change Category</div>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleBulkChangeCategory(cat.id)}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-black border-2 border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_#000] transition-all flex items-center gap-3"
                        >
                          <span className="w-3 h-3 rounded-full border-2 border-black" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Bulk Delete */}
              <button
                onClick={handleBulkDelete}
                className="flex items-center justify-center p-3 rounded-xl bg-red-400 text-black border-2 border-black hover:bg-red-300 shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                title="Delete Selected"
              >
                <Trash2 className="h-5 w-5 stroke-[2.5px]" />
              </button>

              {/* Cancel Selection */}
              <button
                onClick={() => {
                  setSelectedTxIds(new Set());
                  setIsSelectMode(false);
                }}
                className="flex items-center justify-center px-4 py-3 rounded-xl bg-gray-200 text-black border-2 border-black hover:bg-gray-300 shadow-[2px_2px_0px_0px_#000] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-bold uppercase tracking-wider ml-1"
              >
                Cancel
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
