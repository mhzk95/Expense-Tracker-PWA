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
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FlashEntryModal } from "@/components/transactions/FlashEntryModal";
import { TransactionDetailSheet } from "@/components/transactions/TransactionDetailSheet";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function TransactionsPage() {
  const { transactions: rawTransactions, loading: txLoading, updateTransaction, deleteTransaction } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const { accounts, loading: accLoading } = useAccounts();
  const { manifest: activeManifest } = useTheme();

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
        subtitle={loading ? "Loading..." : `${transactions.length} Transactions`}
        action={<AddTransactionAction />}
      />

      {/* Top Cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          {/* Today */}
          <Card
            variant="surface"
            isInteractive
            onClick={() => setSelectedDateRange(prev => prev === 'today' ? null : 'today')}
            className={cn(
              "p-3 flex flex-col relative overflow-hidden group text-left transition-transform",
              selectedDateRange === 'today' ? "scale-[0.98]" : ""
            )}
            style={{ 
              borderColor: '#1f2937', 
              boxShadow: selectedDateRange === 'today' ? 'inset 0 0 0 2px #10b981' : '3px 3px 0px 0px #10b981',
              borderWidth: '2px'
            }}
          >
            <div className="flex flex-col gap-2.5 w-full relative z-10">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-[10px] bg-emerald-500 flex items-center justify-center text-black shrink-0">
                  <Calendar className="w-5 h-5 stroke-[2.5px]" />
                </div>
                <span className="text-emerald-500 font-bold opacity-60">--</span>
              </div>
              <div className="flex flex-col overflow-hidden mt-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500">Today</span>
                <span className="text-[28px] font-black tracking-tighter truncate leading-none mt-1 font-numbers text-white">
                  {todayTotal < 0 ? "-" : ""}₹{Math.abs(todayTotal).toFixed(2)}
                </span>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-widest text-gray-500">0 Spent</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-800 w-full flex justify-start relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center justify-center">
                {todayTxns.length} Expenses
              </span>
            </div>
          </Card>

          {/* Month */}
          <Card
            variant="surface"
            isInteractive
            onClick={() => setSelectedDateRange(prev => prev === 'month' ? null : 'month')}
            className={cn(
              "p-3 flex flex-col relative overflow-hidden group text-left transition-transform",
              selectedDateRange === 'month' ? "scale-[0.98]" : ""
            )}
            style={{ 
              borderColor: '#1f2937', 
              boxShadow: selectedDateRange === 'month' ? 'inset 0 0 0 2px #a855f7' : '3px 3px 0px 0px #a855f7',
              borderWidth: '2px'
            }}
          >
            <div className="flex flex-col gap-2.5 w-full relative z-10">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-[10px] bg-purple-500 flex items-center justify-center text-black shrink-0">
                  <Calendar className="w-5 h-5 stroke-[2.5px]" />
                </div>
                <span className="text-[10px] text-red-500 font-bold tracking-widest">↑ 12%</span>
              </div>
              <div className="flex flex-col overflow-hidden mt-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-purple-400">{currentMonthName} Total</span>
                <span className="text-[28px] font-black tracking-tighter truncate leading-none mt-1 font-numbers text-white">
                  {monthTotal < 0 ? "-" : ""}₹{Math.abs(monthTotal).toFixed(2)}
                </span>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-widest text-gray-500">Spent</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t-2 border-dashed border-gray-800 w-full flex justify-start relative z-10">
              <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded flex items-center justify-center">
                {monthTxns.length} Expenses
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Unified Search and filter toolbar + panel container to prevent layout jerking */}
      <div className="space-y-0">
        {/* Search and filter toolbar */}
        <div className="flex flex-col gap-3">
          {/* Search Row */}
          <div className="flex items-stretch gap-2 w-full h-[48px]">
            <div className="relative flex-1 h-full">
              <Input
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
                className="h-full px-10 text-[13px] font-bold border-2 border-gray-800 bg-[#16181d] text-white focus:border-gray-600 transition-all rounded-xl"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              </div>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4 stroke-[3px]" />
                </button>
              )}
            </div>

            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className={cn(
                "flex items-center justify-center w-[48px] h-full rounded-xl border-2 transition-all select-none shrink-0 font-bold",
                showFiltersPanel || selectedType || selectedCategory || selectedDateRange
                  ? "bg-emerald-500 text-black border-emerald-500"
                  : "bg-[#16181d] text-gray-400 border-gray-800 hover:border-gray-600"
              )}
              title="Filter transactions"
              aria-label="Filter transactions"
            >
              <Filter className="h-4 w-4 stroke-[2.5px]" />
            </button>
          </div>

          {/* Action Buttons Row */}
          <div className="grid grid-cols-2 gap-3 mt-1">
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
                "h-[48px] rounded-xl flex items-center justify-center gap-2 border-2 transition-all",
                isSelectMode ? "border-emerald-500 bg-emerald-500/10" : "border-gray-800 bg-[#16181d]"
              )}
            >
              <CheckSquare className="w-4 h-4 stroke-[2.5px] text-emerald-500" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white">
                Select Multiple
              </span>
            </button>

            <button
              onClick={() => setShowOnlyNeedsReview(!showOnlyNeedsReview)}
              className={cn(
                "h-[48px] rounded-xl flex items-center justify-center gap-2 border-2 transition-all",
                showOnlyNeedsReview ? "border-yellow-400 bg-yellow-400/10" : "border-gray-800 bg-[#16181d]"
              )}
            >
              <Zap className={cn("w-4 h-4 stroke-[2.5px]", showOnlyNeedsReview ? "text-yellow-400" : "text-yellow-500")} />
              <span className="text-[11px] font-black uppercase tracking-widest text-white">
                Needs Review
              </span>
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
                <div className="bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[20px] p-5 space-y-5 shadow-[4px_4px_0px_0px_var(--color-border)]">
                  {/* Type filter */}
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-3">Type</span>
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
                              ? "bg-[var(--color-primary)] border-[var(--color-border)] text-white shadow-[2px_2px_0px_0px_var(--color-border)]"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-gray-100"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date filter */}
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-3">Date Range</span>
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
                              ? "bg-[var(--color-primary)] border-[var(--color-border)] text-white shadow-[2px_2px_0px_0px_var(--color-border)]"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-gray-100"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category filter */}
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-3">Category</span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border-[2px] transition-all",
                          selectedCategory === null
                            ? "bg-[var(--color-primary)] border-[var(--color-border)] text-white shadow-[2px_2px_0px_0px_var(--color-border)]"
                            : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-gray-100"
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
                              ? "border-[var(--color-border)] text-[var(--color-text)] shadow-[2px_2px_0px_0px_var(--color-border)]"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-gray-100"
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
            <div key={i} className="brutal-card px-4 py-2.5 flex items-center gap-3 animate-pulse bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] shadow-[4px_4px_0px_0px_var(--color-border)]">
              <div className="h-12 w-12 rounded-xl bg-gray-200 border-2 border-[var(--color-border)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 bg-gray-200 border-2 border-[var(--color-border)] rounded-full" />
                <div className="h-3 w-16 bg-gray-200 border border-[var(--color-border)] rounded-full" />
              </div>
              <div className="h-4 w-12 bg-gray-200 border-2 border-[var(--color-border)] rounded-full" />
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
                  className="flex items-center justify-between px-2 cursor-pointer group/header select-none mb-4 mt-2"
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
                    <Calendar className={cn("w-5 h-5 stroke-[2.5px]", group.isToday ? "text-emerald-500" : group.isYesterday ? "text-blue-500" : "text-yellow-400")} />
                    <div className="flex flex-col">
                      <span className={cn("text-[11px] font-black uppercase tracking-widest", group.isToday ? "text-emerald-500" : group.isYesterday ? "text-blue-500" : "text-yellow-400")}>{group.label}</span>
                      <span className="text-[10px] font-bold text-gray-500 mt-0.5 uppercase tracking-widest">{group.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="text-[13px] font-black tracking-tighter text-white font-numbers">
                        {group.total < 0 ? "-" : ""}₹{Math.abs(group.total).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 text-gray-500">{group.txns.length} Transaction{group.txns.length !== 1 ? 's' : ''}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 stroke-[3px] transition-transform", !collapsedGroups.has(group.key) ? "rotate-180 text-white" : "text-gray-500")} />
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
                            <Card
                              variant={isSelected ? "primary" : "surface"}
                              isInteractive
                              className={cn(
                                "p-0 relative overflow-hidden transition-transform",
                                isSelected ? "scale-[0.98]" : "",
                                txn.needsReview && "needs-review-card bg-yellow-400/10"
                              )}
                              style={{ 
                                WebkitTouchCallout: "none"
                              }}
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
                              <div className="flex items-center w-full px-3 py-3 h-[68px] gap-3 relative z-10 text-left">
                                {/* Left Color Accent Strip */}
                                <div 
                                  className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md z-0" 
                                  style={{ backgroundColor: txn.needsReview ? '#facc15' : baseColor }} 
                                />
                                
                                {/* Checkbox (visible in select mode) */}
                                {(isSelectMode || selectedTxIds.size > 0) && (
                                  <div className="flex-shrink-0 ml-1 mr-1 relative z-10">
                                    {isSelected ? (
                                      <div className="h-6 w-6 rounded-lg bg-emerald-500 border-2 border-emerald-500 flex items-center justify-center text-black">
                                        <Check className="h-4 w-4 stroke-[4px]" />
                                      </div>
                                    ) : (
                                      <div className="h-6 w-6 rounded-lg border-2 border-gray-600 bg-transparent" />
                                    )}
                                  </div>
                                )}

                                {/* Icon */}
                                <div
                                  className={cn("flex-shrink-0 w-11 h-11 rounded-[10px] flex items-center justify-center relative z-10", !(isSelectMode || selectedTxIds.size > 0) && "ml-1")}
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

                                {/* Details */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10 h-full">
                                  <h3 className="text-[13px] font-black uppercase truncate leading-tight text-white pt-0.5">
                                    {txn.payee || txn.description || "No Title"}
                                  </h3>

                                  <div className="text-[10px] font-black uppercase tracking-widest leading-tight mt-0.5">
                                    <span className="truncate block" style={{ color: baseColor }}>{category?.name ?? "Uncategorized"}</span>
                                    <span className="truncate block text-gray-500 flex items-center gap-1 mt-0.5">
                                      <Clock className="w-3 h-3" />
                                      {timeStr}
                                    </span>
                                  </div>
                                </div>

                                {/* Amount & Review Badge */}
                                <div className="text-right flex flex-col items-end justify-center h-full relative z-10">
                                  <div className="flex items-center gap-1">
                                    <span
                                      className={cn(
                                        "text-[15px] font-black tracking-tighter text-right leading-none font-numbers",
                                        isIncome ? "text-emerald-500" : "text-white"
                                      )}
                                    >
                                      {isIncome ? "+" : isTransfer ? "" : "−"}₹{Math.abs(txn.amount).toFixed(2)}
                                    </span>
                                    <ChevronRight className="w-4 h-4 text-gray-500 stroke-[3px]" />
                                  </div>
                                  {txn.needsReview && (
                                    <span className="text-[9px] font-black uppercase tracking-wider text-black bg-yellow-400 border-2 border-black px-2 py-0.5 rounded flex items-center gap-1 mt-1">
                                      <Zap className="w-3 h-3" /> Review
                                    </span>
                                  )}
                                </div>
                              </div>
                            </Card>
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
            className="fixed bottom-[84px] inset-x-4 z-40 bg-[var(--color-primary)] border-4 border-[var(--color-border)] rounded-[24px] p-4 shadow-[6px_6px_0px_0px_var(--color-border)] flex items-center justify-between gap-3 max-w-md mx-auto"
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
                className="flex items-center justify-center p-3 rounded-xl bg-amber-400 text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-amber-300 shadow-[2px_2px_0px_0px_var(--color-border)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                title="Mark Reviewed"
              >
                <Check className="h-5 w-5 stroke-[3px]" />
              </button>

              {/* Bulk Change Category */}
              <div className="relative">
                <button
                  onClick={() => setShowBulkCategoryPicker(!showBulkCategoryPicker)}
                  className="flex items-center justify-center p-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-gray-100 shadow-[2px_2px_0px_0px_var(--color-border)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
                      className="absolute bottom-16 right-0 bg-[var(--color-surface)] border-[3px] border-[var(--color-border)] rounded-[20px] p-3 shadow-[6px_6px_0px_0px_var(--color-border)] w-56 max-h-56 overflow-y-auto space-y-2 z-50 scrollbar-none"
                    >
                      <div className="text-[10px] uppercase font-black tracking-widest text-gray-500 p-1 mb-1">Change Category</div>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleBulkChangeCategory(cat.id)}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-[var(--color-text)] border-2 border-transparent hover:border-[var(--color-border)] hover:shadow-[2px_2px_0px_0px_var(--color-border)] transition-all flex items-center gap-3"
                        >
                          <span className="w-3 h-3 rounded-full border-2 border-[var(--color-border)]" style={{ backgroundColor: cat.color }} />
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
                className="flex items-center justify-center p-3 rounded-xl bg-red-400 text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-red-300 shadow-[2px_2px_0px_0px_var(--color-border)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
                className="flex items-center justify-center px-4 py-3 rounded-xl bg-gray-200 text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-gray-300 shadow-[2px_2px_0px_0px_var(--color-border)] transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-bold uppercase tracking-wider ml-1"
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
