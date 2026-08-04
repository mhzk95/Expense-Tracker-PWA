"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate, hexToRgb, vibrate, cn, getCategoryIcon } from "@/lib/utils/helpers";
import { ArrowLeftRight, Filter, MapPin, X, Check, Trash2, Tag, Calendar, ChevronDown, Clock, ChevronRight, CheckSquare, Zap, FileText, ArrowRight, Users } from "lucide-react";
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
import { SplitDonutRing } from "@/components/transactions/SplitDataIndicator";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function TransactionsPage() {
  const { 
    transactions: rawTransactions, 
    loading: txLoading, 
    loadingMore,
    hasMore,
    loadMore,
    updateTransaction, 
    deleteTransaction 
  } = useTransactions();
  const { categories, loading: catLoading } = useCategories();
  const { accounts, loading: accLoading } = useAccounts();
  const { manifest: activeManifest } = useTheme();

  const loading = txLoading || catLoading || accLoading;

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore || loadingMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: "250px" }
    );

    const currentEl = observerRef.current;
    if (currentEl) {
      observer.observe(currentEl);
    }

    return () => {
      if (currentEl) {
        observer.unobserve(currentEl);
      }
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  const [editingTxn, setEditingTxn] = useState<TransactionEntity | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<TransactionEntity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyNeedsReview, setShowOnlyNeedsReview] = useState(false);
  const [showOnlySplits, setShowOnlySplits] = useState(false);
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

  const todayExpenses = todayTxns
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + (t.netAmount !== undefined ? t.netAmount : t.amount), 0);
  const todayIncomes = todayTxns.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const todayNet = todayIncomes - todayExpenses;

  const monthExpenses = monthTxns
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + (t.netAmount !== undefined ? t.netAmount : t.amount), 0);
  const monthIncomes = monthTxns.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amount, 0);
  const monthNet = monthIncomes - monthExpenses;
  const currentMonthName = now.toLocaleString("default", { month: "short" });

  // Group Split Metrics
  const splitTxns = rawTransactions.filter((t) => t.splits && t.splits.length > 0);
  const totalPendingReceivables = splitTxns.reduce((acc, t) => {
    const pending = t.splits?.filter((p) => !p.isSettled).reduce((s, p) => s + p.amount, 0) || 0;
    return acc + pending;
  }, 0);
  const pendingSplitsCount = splitTxns.filter((t) => t.splits?.some((p) => !p.isSettled)).length;

  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || selectedType || selectedDateRange || showOnlyNeedsReview || showOnlySplits
  );

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setSelectedType(null);
    setSelectedDateRange(null);
    setShowOnlyNeedsReview(false);
    setShowOnlySplits(false);
  };

  const transactions = [...rawTransactions]
    .filter((t) => {
      if (showOnlyNeedsReview && !t.needsReview) return false;
      if (showOnlySplits && (!t.splits || t.splits.length === 0)) return false;
      if (selectedType && t.type !== selectedType) return false;
      if (selectedCategory && t.categoryId !== selectedCategory) return false;
      if (selectedDateRange) {
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
        const matchesParticipant = t.splits?.some((p) => p.name.toLowerCase().includes(query));
        return matchesDesc || matchesPayee || matchesNote || Boolean(matchesParticipant);
      }
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Collapse notes on scroll or click outside
  useEffect(() => {
    const handleCollapse = () => {
      // Intentionally left empty
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

      {/* Top Summary Cards */}
      {!loading && (
        <div className="grid grid-cols-2 gap-3">
          {/* Today Card */}
          <Card
            variant="surface"
            isInteractive
            onClick={() => setSelectedDateRange(prev => prev === 'today' ? null : 'today')}
            className={cn(
              "p-3.5 flex flex-col relative overflow-hidden group text-left transition-all border-2 border-[var(--color-border)] rounded-[20px]",
              selectedDateRange === 'today' 
                ? "ring-2 ring-emerald-500 bg-emerald-500/10 shadow-brutal-sm" 
                : "bg-[var(--color-surface)] hover:bg-[var(--color-surfaceHover)]"
            )}
          >
            <div className="flex flex-col gap-2 w-full relative z-10">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-black shrink-0 border border-black/20">
                  <Calendar className="w-4 h-4 stroke-[2.5px]" />
                </div>
                {selectedDateRange === 'today' ? (
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {todayTxns.length} txns
                  </span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden mt-0.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-500">Today</span>
                <span className="text-[24px] font-black tracking-tight truncate leading-none mt-1 font-numbers tabular-nums text-[var(--color-text)]">
                  {todayNet < 0 ? "−" : todayNet > 0 ? "+" : ""}₹{Math.abs(todayNet).toFixed(2)}
                </span>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-widest text-gray-500">
                  ₹{todayExpenses.toFixed(2)} spent
                </span>
              </div>
            </div>
          </Card>

          {/* Month Card */}
          <Card
            variant="surface"
            isInteractive
            onClick={() => setSelectedDateRange(prev => prev === 'month' ? null : 'month')}
            className={cn(
              "p-3.5 flex flex-col relative overflow-hidden group text-left transition-all border-2 border-[var(--color-border)] rounded-[20px]",
              selectedDateRange === 'month' 
                ? "ring-2 ring-purple-500 bg-purple-500/10 shadow-brutal-sm" 
                : "bg-[var(--color-surface)] hover:bg-[var(--color-surfaceHover)]"
            )}
          >
            <div className="flex flex-col gap-2 w-full relative z-10">
              <div className="flex items-start justify-between">
                <div className="w-9 h-9 rounded-xl bg-purple-500 flex items-center justify-center text-white shrink-0 border border-black/20">
                  <Calendar className="w-4 h-4 stroke-[2.5px]" />
                </div>
                {selectedDateRange === 'month' ? (
                  <span className="text-[9px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded-full">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    {monthTxns.length} txns
                  </span>
                )}
              </div>
              <div className="flex flex-col overflow-hidden mt-0.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-purple-400">{currentMonthName} Net</span>
                <span className="text-[24px] font-black tracking-tight truncate leading-none mt-1 font-numbers tabular-nums text-[var(--color-text)]">
                  {monthNet < 0 ? "−" : monthNet > 0 ? "+" : ""}₹{Math.abs(monthNet).toFixed(2)}
                </span>
                <span className="text-[10px] font-bold mt-1 uppercase tracking-widest text-gray-500">
                  ₹{monthExpenses.toFixed(2)} spent
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Pending Group Receivables Banner */}
      {!loading && totalPendingReceivables > 0 && (
        <div 
          onClick={() => {
            setShowOnlySplits(!showOnlySplits);
            vibrate([15]);
          }}
          className={cn(
            "p-4 rounded-[20px] border-2 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-brutal-sm",
            showOnlySplits
              ? "bg-amber-400 border-[var(--color-border)] text-black"
              : "bg-amber-400/10 border-amber-400 text-[var(--color-text)] hover:bg-amber-400/20"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400 border border-black/30 flex items-center justify-center text-black shrink-0">
              <Users className="w-5 h-5 stroke-[2.5px]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest block text-amber-500">
                Pending Group Receivables
              </span>
              <p className="text-sm font-black uppercase tracking-tight truncate">
                ₹{totalPendingReceivables.toFixed(2)} to collect ({pendingSplitsCount} {pendingSplitsCount === 1 ? 'split' : 'splits'})
              </p>
            </div>
          </div>

          <span className={cn(
            "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border shrink-0",
            showOnlySplits 
              ? "bg-black text-white border-black" 
              : "bg-amber-400 text-black border-black/30"
          )}>
            {showOnlySplits ? "Active" : "View"}
          </span>
        </div>
      )}

      {/* Unified Search and filter toolbar */}
      <div className="space-y-3">
        {/* Search Row */}
        <div className="flex items-stretch gap-2 w-full h-[48px]">
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
              placeholder="Search by payee, note, or friend name..."
              className="w-full h-full pl-10 pr-10 text-xs font-bold border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:border-[var(--color-primary)] outline-none transition-all rounded-xl placeholder:text-gray-500"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--color-text)] transition-colors p-1"
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
                ? "bg-[var(--color-primary)] text-white border-[var(--color-border)]"
                : "bg-[var(--color-surface)] text-[var(--color-text)] border-[var(--color-border)] hover:bg-[var(--color-surfaceHover)]"
            )}
            title="Filter transactions"
            aria-label="Filter transactions"
          >
            <Filter className="h-4 w-4 stroke-[2.5px]" />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => {
              if (selectedTxIds.size > 0 || isSelectMode) {
                setSelectedTxIds(new Set());
                setIsSelectMode(false);
              } else {
                setIsSelectMode(true);
              }
            }}
            aria-label={isSelectMode ? "Exit selection mode" : "Select multiple transactions"}
            className={cn(
              "h-[42px] rounded-xl flex items-center justify-center gap-1.5 border-2 transition-all px-2",
              isSelectMode 
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" 
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
            )}
          >
            <CheckSquare className="w-3.5 h-3.5 stroke-[2.5px] text-emerald-500 shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider truncate">
              Select
            </span>
          </button>

          <button
            onClick={() => setShowOnlyNeedsReview(!showOnlyNeedsReview)}
            aria-label={showOnlyNeedsReview ? "Show all transactions" : "Filter needs review only"}
            className={cn(
              "h-[42px] rounded-xl flex items-center justify-center gap-1.5 border-2 transition-all px-2",
              showOnlyNeedsReview 
                ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" 
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
            )}
          >
            <Zap className={cn("w-3.5 h-3.5 stroke-[2.5px] shrink-0", showOnlyNeedsReview ? "text-yellow-400" : "text-yellow-500")} />
            <span className="text-[10px] font-black uppercase tracking-wider truncate">
              Review {needsReviewCount > 0 && `(${needsReviewCount})`}
            </span>
          </button>

          <button
            onClick={() => setShowOnlySplits(!showOnlySplits)}
            aria-label={showOnlySplits ? "Show all transactions" : "Filter group splits only"}
            className={cn(
              "h-[42px] rounded-xl flex items-center justify-center gap-1.5 border-2 transition-all px-2",
              showOnlySplits 
                ? "border-amber-400 bg-amber-400/10 text-amber-400" 
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
            )}
          >
            <Users className={cn("w-3.5 h-3.5 stroke-[2.5px] shrink-0", showOnlySplits ? "text-amber-400" : "text-amber-500")} />
            <span className="text-[10px] font-black uppercase tracking-wider truncate">
              Splits {splitTxns.length > 0 && `(${splitTxns.length})`}
            </span>
          </button>
        </div>

        {/* Active Filters Bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none flex-wrap">
            <span className="text-[9px] uppercase font-black tracking-widest text-gray-500 mr-1">Active:</span>

            {showOnlySplits && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-400/20 border border-amber-400 text-amber-500">
                Group Splits
                <button onClick={() => setShowOnlySplits(false)} aria-label="Remove splits filter" className="hover:text-red-500">
                  <X className="w-3 h-3 stroke-[3px]" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]">
                "{searchQuery}"
                <button onClick={() => setSearchQuery("")} aria-label="Remove search filter" className="hover:text-red-500">
                  <X className="w-3 h-3 stroke-[3px]" />
                </button>
              </span>
            )}

            {selectedType && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] capitalize">
                {selectedType}
                <button onClick={() => setSelectedType(null)} aria-label="Remove type filter" className="hover:text-red-500">
                  <X className="w-3 h-3 stroke-[3px]" />
                </button>
              </span>
            )}

            {selectedCategory && (() => {
              const cat = categories.find(c => c.id === selectedCategory);
              return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]">
                  {cat?.name || "Category"}
                  <button onClick={() => setSelectedCategory(null)} aria-label="Remove category filter" className="hover:text-red-500">
                    <X className="w-3 h-3 stroke-[3px]" />
                  </button>
                </span>
              );
            })()}

            {selectedDateRange && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]">
                {selectedDateRange === "today" ? "Today" : selectedDateRange === "week" ? "Last 7 Days" : "Last 30 Days"}
                <button onClick={() => setSelectedDateRange(null)} aria-label="Remove date filter" className="hover:text-red-500">
                  <X className="w-3 h-3 stroke-[3px]" />
                </button>
              </span>
            )}

            {showOnlyNeedsReview && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-yellow-400/20 border border-yellow-400/50 text-yellow-400">
                Needs Review
                <button onClick={() => setShowOnlyNeedsReview(false)} aria-label="Remove needs review filter" className="hover:text-red-500">
                  <X className="w-3 h-3 stroke-[3px]" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAllFilters}
              className="text-[10px] font-black uppercase tracking-wider text-red-500 hover:text-red-400 ml-1 py-1"
            >
              Reset All
            </button>
          </div>
        )}

        {/* Search History Row */}
        {isSearchFocused && searchQuery === "" && searchHistory.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
            <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500 pr-1 flex-shrink-0">Recent:</span>
            {searchHistory.map((q) => (
              <button
                key={q}
                onClick={() => setSearchQuery(q)}
                className="px-2.5 py-0.5 rounded-full text-[10px] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] transition-all flex-shrink-0 active:scale-95 select-none font-bold"
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
              <div className="pt-1">
                <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[20px] p-4 space-y-4">
                  {/* Type filter */}
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-2">Type</span>
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
                            "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 transition-all",
                            selectedType === opt.value
                              ? "bg-[var(--color-primary)] border-[var(--color-border)] text-white"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date filter */}
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-2">Date Range</span>
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
                            "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 transition-all",
                            selectedDateRange === opt.value
                              ? "bg-[var(--color-primary)] border-[var(--color-border)] text-white"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Category filter */}
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-text)] block mb-2">Category</span>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 scrollbar-none">
                      <button
                        onClick={() => setSelectedCategory(null)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 transition-all",
                          selectedCategory === null
                            ? "bg-[var(--color-primary)] border-[var(--color-border)] text-white"
                            : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
                        )}
                      >
                        All Categories
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider border-2 transition-all flex items-center gap-1.5",
                            selectedCategory === cat.id
                              ? "border-[var(--color-border)] text-black"
                              : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)]"
                          )}
                          style={selectedCategory === cat.id ? { backgroundColor: cat.color || "var(--color-primary)" } : {}}
                        >
                          <span className="w-2 h-2 rounded-full border border-black/40" style={{ backgroundColor: cat.color }} />
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear filters action */}
                  {hasActiveFilters && (
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={handleClearAllFilters}
                        className="text-[11px] font-black uppercase tracking-wider text-red-500 hover:text-red-400 transition-colors"
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
            <div key={i} className="brutal-card px-4 py-2.5 flex items-center gap-3 animate-pulse bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[16px]">
              <div className="h-12 w-12 rounded-xl bg-[var(--color-surfaceHover)] border-2 border-[var(--color-border)]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-24 bg-[var(--color-surfaceHover)] border-2 border-[var(--color-border)] rounded-full" />
                <div className="h-3 w-16 bg-[var(--color-surfaceHover)] border border-[var(--color-border)] rounded-full" />
              </div>
              <div className="h-4 w-12 bg-[var(--color-surfaceHover)] border-2 border-[var(--color-border)] rounded-full" />
            </div>
          ))}
        </div>
      ) : rawTransactions.length === 0 ? (
        <EmptyState
          title="No transactions yet"
          description="Add your first income or expense to get started."
          action={<AddTransactionAction />}
        />
      ) : transactions.length === 0 ? (
        <div className="py-12 px-4 text-center bg-[var(--color-surface)] border-2 border-dashed border-[var(--color-border)] rounded-[24px] space-y-3">
          <p className="text-base font-black uppercase tracking-wide text-[var(--color-text)]">
            No Matching Transactions
          </p>
          <p className="text-xs font-bold text-gray-500 max-w-xs mx-auto">
            No transactions match your current search or filter criteria.
          </p>
          <button
            onClick={handleClearAllFilters}
            className="px-4 py-2 rounded-xl bg-[var(--color-primary)] text-white border-2 border-[var(--color-border)] text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all active:scale-95"
          >
            Clear All Filters
          </button>
        </div>
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
                      <span className="text-[13px] font-black tracking-tight text-[var(--color-text)] font-numbers tabular-nums">
                        {group.total < 0 ? "−" : group.total > 0 ? "+" : ""}₹{Math.abs(group.total).toFixed(2)}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-widest mt-0.5 text-gray-500">{group.txns.length} Transaction{group.txns.length !== 1 ? 's' : ''}</span>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 stroke-[3px] transition-transform", !collapsedGroups.has(group.key) ? "rotate-180 text-[var(--color-text)]" : "text-gray-500")} />
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

                        const sourceAccount = accounts.find((a) => a.id === txn.accountId);
                        const targetAccount = accounts.find((a) => a.id === txn.toAccountId);
                        const isIncome = txn.type === "income";
                        const isTransfer = txn.type === "transfer";
                        const baseColor = category?.color || (isTransfer ? "#60a5fa" : "#8b5cf6");

                        const isSelected = selectedTxIds.has(txn.id);

                        const hasDistinctPayeeAndDesc = Boolean(
                          txn.payee && txn.description && txn.payee.toLowerCase().trim() !== txn.description.toLowerCase().trim()
                        );
                        const primaryTitle = txn.payee || txn.description || (isTransfer ? "Account Transfer" : "Transaction");
                        const secondarySubtitle = hasDistinctPayeeAndDesc ? txn.description : null;
                        const hasNote = Boolean(txn.note && txn.note.trim().length > 0);
                        const hasLocation = Boolean(txn.location && txn.location.trim().length > 0);
                        const txDate = new Date(txn.date);
                        const timeStr = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                        const isSplit = Boolean(txn.splits && txn.splits.length > 0);
                        const allSettled = isSplit ? (txn.splits || []).every((p) => p.isSettled) : false;

                        const iconNode = (
                          <div
                            className={cn("flex-shrink-0 w-11 h-11 rounded-[12px] flex items-center justify-center relative z-10 border border-black/20", !(isSelectMode || selectedTxIds.size > 0) && "ml-0.5")}
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
                        );

                        return (
                          <SwipeToDelete
                            key={txn.id}
                            onDelete={() => deleteTransaction(txn.id)}
                            onEdit={() => {
                              setEditingTxn(txn);
                              setIsEditOpen(true);
                            }}
                            glowColor={baseColor}
                            deleteMessage={`Delete "${primaryTitle}"?`}
                          >
                            <Card
                              variant={isSelected ? "primary" : "surface"}
                              isInteractive={false}
                              className={cn(
                                "p-0 relative overflow-hidden transition-all border-2 border-[var(--color-border)] rounded-[18px]",
                                isSelected ? "scale-[0.98] ring-2 ring-[var(--color-primary)]" : "",
                                txn.needsReview && "needs-review-card bg-yellow-400/10 border-yellow-400/60",
                                isSplit && "border-amber-500/50 bg-gradient-to-r from-amber-500/[0.05] via-transparent to-transparent shadow-sm"
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
                                
                                {/* Checkbox (visible in select mode) */}
                                {(isSelectMode || selectedTxIds.size > 0) && (
                                  <div className="flex-shrink-0 ml-0.5 mr-1 relative z-10">
                                    {isSelected ? (
                                      <div className="h-6 w-6 rounded-lg bg-[var(--color-primary)] border-2 border-[var(--color-border)] flex items-center justify-center text-white">
                                        <Check className="h-4 w-4 stroke-[4px]" />
                                      </div>
                                    ) : (
                                      <div className="h-6 w-6 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-surface)]" />
                                    )}
                                  </div>
                                )}

                                {/* Icon */}
                                {iconNode}

                                {/* Details */}
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
                                      <span className="flex items-center gap-0.5">
                                        <Clock className="w-2.5 h-2.5" />
                                        {timeStr}
                                      </span>
                                      {hasLocation && <MapPin className="w-2.5 h-2.5 text-amber-400/80" />}
                                      {hasNote && <FileText className="w-2.5 h-2.5 text-purple-400/80" />}
                                    </div>
                                  </div>
                                </div>

                                {/* Amount & Review / Split Badges */}
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
                                    <ChevronRight className="w-4 h-4 text-gray-500 stroke-[3px]" />
                                  </div>

                                  {/* Needs Review and Data-Driven Split Indicators */}
                                  <div className="flex items-center gap-1.5 mt-1">
                                    {txn.needsReview && (
                                      <span className="text-[9px] font-black uppercase tracking-wider text-black bg-yellow-400 border border-black/30 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0">
                                        <Zap className="w-2.5 h-2.5 fill-black" /> Review
                                      </span>
                                    )}

                                    {/* Minimalist Data-Driven Donut Ring */}
                                    {isSplit && (
                                      <SplitDonutRing
                                        splits={txn.splits}
                                        netAmount={txn.netAmount}
                                        totalAmount={txn.amount}
                                      />
                                    )}
                                  </div>
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

          {/* Sentinel for infinite scroll */}
          <div ref={observerRef} className="h-6 w-full pointer-events-none" />

          {/* Loading More Indicator */}
          {loadingMore && (
            <div className="py-4 flex justify-center items-center gap-2.5">
              <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-text)]">
                Loading older transactions...
              </span>
            </div>
          )}

          {/* Reached End of List */}
          {!hasMore && rawTransactions.length > 0 && !loading && (
            <div className="py-6 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 bg-[var(--color-surface)] border-2 border-[var(--color-border)] px-4 py-1.5 rounded-full">
                ✓ All transactions loaded
              </span>
            </div>
          )}
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
            className="fixed bottom-[84px] inset-x-4 z-40 bg-[var(--color-primary)] border-4 border-[var(--color-border)] rounded-[24px] p-4  flex items-center justify-between gap-3 max-w-md mx-auto"
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
                className="flex items-center justify-center p-3 rounded-xl bg-amber-400 text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-amber-300  transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
                title="Mark Reviewed"
              >
                <Check className="h-5 w-5 stroke-[3px]" />
              </button>

              {/* Bulk Change Category */}
              <div className="relative">
                <button
                  onClick={() => setShowBulkCategoryPicker(!showBulkCategoryPicker)}
                  className="flex items-center justify-center p-3 rounded-xl bg-[var(--color-surface)] text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-[var(--color-surfaceHover)]  transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
                      className="absolute bottom-16 right-0 bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[20px] p-3  w-56 max-h-56 overflow-y-auto space-y-2 z-50 scrollbar-none"
                    >
                      <div className="text-[10px] uppercase font-black tracking-widest text-gray-500 p-1 mb-1">Change Category</div>
                      {categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => handleBulkChangeCategory(cat.id)}
                          className="w-full text-left px-3 py-2 rounded-xl text-sm font-bold text-[var(--color-text)] border-2 border-transparent hover:border-[var(--color-border)] hover: transition-all flex items-center gap-3"
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
                className="flex items-center justify-center p-3 rounded-xl bg-red-400 text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-red-300  transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
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
                className="flex items-center justify-center px-4 py-3 rounded-xl bg-[var(--color-surfaceHover)] text-[var(--color-text)] border-2 border-[var(--color-border)] hover:bg-[var(--color-surfaceHover)]  transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none font-bold uppercase tracking-wider ml-1"
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
        onEdit={(txn) => {
          setEditingTxn(txn);
          setIsEditOpen(true);
        }}
        onDelete={(id) => {
          deleteTransaction(id);
        }}
      />
    </div>
  );
}
