"use client";

import { useState, useEffect, useMemo } from "react";
import { Users, Plus, X, UserPlus, Sparkles, AlertCircle, Check } from "lucide-react";
import { formatCurrency, vibrate } from "@/lib/utils/helpers";
import { TransactionSplitParticipant } from "@/lib/db/indexeddb";

interface SplitExpenseSectionProps {
  totalAmount: number;
  currency?: string;
  splits: TransactionSplitParticipant[];
  onChange: (splits: TransactionSplitParticipant[], netAmount: number) => void;
  isGroupExpense: boolean;
  onToggleGroupExpense: (enabled: boolean) => void;
}

export function SplitExpenseSection({
  totalAmount,
  currency = "INR",
  splits,
  onChange,
  isGroupExpense,
  onToggleGroupExpense,
}: SplitExpenseSectionProps) {
  const [splitMode, setSplitMode] = useState<"equally" | "exact">(() => {
    if (splits && splits.length > 0 && totalAmount > 0) {
      const count = splits.length + 1;
      const perPerson = Math.floor((totalAmount / count) * 100) / 100;
      const isAnyDifferent = splits.some((s) => Math.abs(s.amount - perPerson) > 0.05);
      if (isAnyDifferent) return "exact";
    }
    return "equally";
  });
  const [friendNameInput, setFriendNameInput] = useState("");
  const [recentFriends, setRecentFriends] = useState<string[]>([]);

  // Load recent friends from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("recent_split_friends");
      if (stored) {
        setRecentFriends(JSON.parse(stored));
      }
    } catch {
      // Fallback
    }
  }, []);

  const saveRecentFriend = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const updated = Array.from(new Set([trimmed, ...recentFriends])).slice(0, 8);
      setRecentFriends(updated);
      localStorage.setItem("recent_split_friends", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  // Recalculate equal splits
  const recalculateEqualSplits = (currentSplits: TransactionSplitParticipant[], total: number) => {
    const count = currentSplits.length + 1; // +1 for "You"
    if (count <= 1 || total <= 0) {
      return {
        updatedSplits: currentSplits.map((s) => ({ ...s, amount: 0 })),
        netShare: total,
      };
    }

    const perPerson = Math.floor((total / count) * 100) / 100;
    const remainder = Math.round((total - perPerson * count) * 100) / 100;

    // Allocate remainder to user share
    const netShare = Math.round((perPerson + remainder) * 100) / 100;
    const updatedSplits = currentSplits.map((s) => ({
      ...s,
      amount: perPerson,
    }));

    return { updatedSplits, netShare };
  };

  // Handle adding friend
  const handleAddFriend = (nameToAdd: string) => {
    const trimmed = nameToAdd.trim();
    if (!trimmed) return;

    // Prevent duplicate friend names in same split
    if (splits.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setFriendNameInput("");
      return;
    }

    saveRecentFriend(trimmed);

    const newParticipant: TransactionSplitParticipant = {
      id: crypto.randomUUID(),
      name: trimmed,
      amount: 0,
      isSettled: false,
    };

    const nextSplits = [...splits, newParticipant];

    if (splitMode === "equally") {
      const { updatedSplits, netShare } = recalculateEqualSplits(nextSplits, totalAmount);
      onChange(updatedSplits, netShare);
    } else {
      const currentFriendsTotal = splits.reduce((s, p) => s + p.amount, 0);
      const remainingForFriend = Math.max(0, totalAmount - currentFriendsTotal);
      newParticipant.amount = remainingForFriend;
      const netShare = Math.max(0, totalAmount - (currentFriendsTotal + remainingForFriend));
      onChange(nextSplits, netShare);
    }

    setFriendNameInput("");
    vibrate([10]);
  };

  // Handle removing friend
  const handleRemoveFriend = (id: string) => {
    const nextSplits = splits.filter((s) => s.id !== id);
    if (nextSplits.length === 0) {
      onChange([], totalAmount);
      onToggleGroupExpense(false);
      return;
    }

    if (splitMode === "equally") {
      const { updatedSplits, netShare } = recalculateEqualSplits(nextSplits, totalAmount);
      onChange(updatedSplits, netShare);
    } else {
      const friendsTotal = nextSplits.reduce((s, p) => s + p.amount, 0);
      const netShare = Math.max(0, totalAmount - friendsTotal);
      onChange(nextSplits, netShare);
    }
    vibrate([10]);
  };

  // Handle manual exact amount change
  const handleExactAmountChange = (id: string, newAmount: number) => {
    const val = isNaN(newAmount) ? 0 : Math.max(0, newAmount);
    const nextSplits = splits.map((s) => (s.id === id ? { ...s, amount: val } : s));
    const friendsTotal = nextSplits.reduce((s, p) => s + p.amount, 0);
    const netShare = Math.max(0, totalAmount - friendsTotal);
    onChange(nextSplits, netShare);
  };

  // Calculate friends total and user share
  const friendsTotalOwed = useMemo(() => {
    return splits.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [splits]);

  const calculatedUserShare = Math.max(0, Math.round((totalAmount - friendsTotalOwed) * 100) / 100);
  const isImbalanced = Math.abs(totalAmount - (friendsTotalOwed + calculatedUserShare)) > 0.05;

  return (
    <div className="rounded-[18px] border-2 border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-4 shadow-brutal-sm">
      {/* Header Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg border-2 border-[var(--color-border)] bg-[var(--color-primary)] flex items-center justify-center text-black">
            <Users className="w-4 h-4 stroke-[2.5px]" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              Split with Friends
            </h4>
            <p className="text-[10px] font-bold text-gray-500">
              Track who owes you without distorting your budget.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            const nextState = !isGroupExpense;
            onToggleGroupExpense(nextState);
            vibrate([10]);
            if (nextState && splits.length === 0) {
              // Add a default friend or prompt
              if (recentFriends.length > 0) {
                handleAddFriend(recentFriends[0]);
              }
            } else if (!nextState) {
              onChange([], totalAmount);
            }
          }}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-[var(--color-border)] transition-colors duration-200 ease-in-out focus:outline-none ${
            isGroupExpense ? "bg-[var(--color-primary)]" : "bg-gray-300 dark:bg-gray-700"
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] transition duration-200 ease-in-out ${
              isGroupExpense ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {isGroupExpense && (
        <div className="space-y-4 pt-2 border-t-2 border-[var(--color-border)]">
          {/* Mode Selector */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Split Mode
            </span>
            <div className="inline-flex rounded-lg border-2 border-[var(--color-border)] p-0.5 bg-[var(--color-bg)] text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setSplitMode("equally");
                  const { updatedSplits, netShare } = recalculateEqualSplits(splits, totalAmount);
                  onChange(updatedSplits, netShare);
                  vibrate([10]);
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  splitMode === "equally"
                    ? "bg-[var(--color-primary)] text-black font-black"
                    : "text-gray-500 hover:text-[var(--color-text)]"
                }`}
              >
                Equally
              </button>
              <button
                type="button"
                onClick={() => {
                  setSplitMode("exact");
                  vibrate([10]);
                }}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  splitMode === "exact"
                    ? "bg-[var(--color-primary)] text-black font-black"
                    : "text-gray-500 hover:text-[var(--color-text)]"
                }`}
              >
                Custom Exact
              </button>
            </div>
          </div>

          {/* Quick Friend Suggestion Chips */}
          {recentFriends.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-gray-500 block">
                Quick Add Friends
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentFriends.map((friend) => {
                  const isAdded = splits.some((s) => s.name.toLowerCase() === friend.toLowerCase());
                  if (isAdded) return null;
                  return (
                    <button
                      key={friend}
                      type="button"
                      onClick={() => handleAddFriend(friend)}
                      className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] hover:bg-[var(--color-surfaceHover)] text-[11px] font-bold text-[var(--color-text)] inline-flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3 text-[var(--color-primary)]" />
                      {friend}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Friend Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={friendNameInput}
              onChange={(e) => setFriendNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddFriend(friendNameInput);
                }
              }}
              placeholder="Enter friend's name (e.g. Rahul)"
              className="flex-1 bg-[var(--color-bg)] border-2 border-[var(--color-border)] rounded-xl px-3 py-2 text-xs font-bold text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            />
            <button
              type="button"
              onClick={() => handleAddFriend(friendNameInput)}
              disabled={!friendNameInput.trim()}
              className="px-3.5 py-2 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-primary)] text-black font-black text-xs uppercase tracking-wider hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1"
            >
              <UserPlus className="w-3.5 h-3.5 stroke-[2.5px]" />
              Add
            </button>
          </div>

          {/* Participants List */}
          <div className="space-y-2">
            {/* User's Share (You) */}
            <div className="flex items-center justify-between p-2.5 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg)]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-emerald-400 text-black font-black text-[10px] flex items-center justify-center">
                  YOU
                </div>
                <div>
                  <span className="text-xs font-black text-[var(--color-text)] block">
                    My True Expense
                  </span>
                  <span className="text-[9px] font-bold text-gray-500">
                    Counts toward your budget
                  </span>
                </div>
              </div>

              <span className="font-numbers tabular-nums font-black text-xs text-emerald-500">
                {formatCurrency(calculatedUserShare, currency)}
              </span>
            </div>

            {/* Friends Splits */}
            {splits.map((p) => {
              const initials = p.name.slice(0, 2).toUpperCase();
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border-2 border-[var(--color-border)] bg-[var(--color-bg)] gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-amber-300 text-black font-black text-[10px] flex items-center justify-center flex-shrink-0">
                      {initials}
                    </div>
                    <span className="text-xs font-black text-[var(--color-text)] truncate">
                      {p.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {splitMode === "exact" ? (
                      <div className="relative w-24">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
                          ₹
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          value={p.amount || ""}
                          onChange={(e) => handleExactAmountChange(p.id, parseFloat(e.target.value))}
                          className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg pl-5 pr-2 py-1 text-xs font-black text-right font-numbers tabular-nums text-[var(--color-text)] outline-none"
                        />
                      </div>
                    ) : (
                      <span className="font-numbers tabular-nums font-black text-xs text-amber-500">
                        {formatCurrency(p.amount, currency)}
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(p.id)}
                      className="p-1 rounded-md text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Remove friend"
                    >
                      <X className="w-3.5 h-3.5 stroke-[2.5px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Split Summary Footer Bar */}
          <div className="p-3 bg-[var(--color-bg)] rounded-xl border border-[var(--color-border)] flex items-center justify-between text-[11px] font-black uppercase tracking-wider flex-wrap gap-2">
            <div className="text-gray-500">
              Total: <span className="text-[var(--color-text)] font-numbers tabular-nums">{formatCurrency(totalAmount, currency)}</span>
            </div>
            <div className="text-amber-500">
              Owed to you: <span className="font-numbers tabular-nums">+{formatCurrency(friendsTotalOwed, currency)}</span>
            </div>
            <div className="text-emerald-500">
              Your Share: <span className="font-numbers tabular-nums">{formatCurrency(calculatedUserShare, currency)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
