"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TransactionSplitParticipant, TransactionEntity } from "@/lib/db/indexeddb";
import { formatCurrency, vibrate } from "@/lib/utils/helpers";
import { 
  Users, Check, MessageSquare, Sparkles, User
} from "lucide-react";

interface SplitDetailsHeroProps {
  txn: TransactionEntity;
  onToggleParticipantSettled: (participantId: string) => Promise<void>;
  onCopyPaymentRequest: (participantName?: string, shareAmount?: number) => void;
}

export function SplitDetailsHero({
  txn,
  onToggleParticipantSettled,
  onCopyPaymentRequest,
}: SplitDetailsHeroProps) {
  const [localSplits, setLocalSplits] = useState<TransactionSplitParticipant[]>(txn.splits || []);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync with incoming txn changes
  useEffect(() => {
    if (txn.splits) {
      setLocalSplits(txn.splits);
    }
  }, [txn.splits]);

  if (!localSplits || localSplits.length === 0) return null;

  const totalFriendsAmount = localSplits.reduce((sum, p) => sum + (p.amount || 0), 0);
  const userShare = txn.netAmount !== undefined ? txn.netAmount : Math.max(0, txn.amount - totalFriendsAmount);
  const validTotal = txn.amount > 0 ? txn.amount : userShare + totalFriendsAmount || 1;

  const settledParticipants = localSplits.filter((p) => p.isSettled);
  const pendingParticipants = localSplits.filter((p) => !p.isSettled);
  const settledFriendsAmount = settledParticipants.reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingFriendsAmount = pendingParticipants.reduce((sum, p) => sum + (p.amount || 0), 0);

  const recoveryPercent = totalFriendsAmount > 0 
    ? Math.round((settledFriendsAmount / totalFriendsAmount) * 100) 
    : 100;
  const isAllSettled = recoveryPercent === 100 && pendingParticipants.length === 0;

  // Chart Arc Geometry (SVG 120x120, Radius = 44)
  const radius = 44;
  const circumference = 2 * Math.PI * radius; // ~276.46

  const userPercent = Math.min(1, Math.max(0.05, userShare / validTotal));
  const userStroke = userPercent * circumference;

  const friendTotalPercent = Math.max(0, 1 - userPercent);
  const friendStroke = friendTotalPercent * circumference;

  const friendSettledRatio = totalFriendsAmount > 0 ? settledFriendsAmount / totalFriendsAmount : 1;
  const settledStroke = friendStroke * friendSettledRatio;
  const pendingStroke = friendStroke - settledStroke;

  const handleToggle = async (id: string) => {
    vibrate([25]);
    setTogglingId(id);

    // Instant optimistic update
    const nextSplits = localSplits.map((s) => {
      if (s.id === id) {
        const nextSettled = !s.isSettled;
        return {
          ...s,
          isSettled: nextSettled,
          settledAt: nextSettled ? new Date().toISOString() : undefined,
        };
      }
      return s;
    });
    setLocalSplits(nextSplits);

    // Async persistence
    try {
      await onToggleParticipantSettled(id);
    } catch (err) {
      // Revert if error
      setLocalSplits(txn.splits || []);
    } finally {
      setTimeout(() => setTogglingId(null), 300);
    }
  };

  const handleCopy = (name: string, amount: number, id: string) => {
    vibrate([15]);
    setCopiedId(id);
    onCopyPaymentRequest(name, amount);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-[24px] p-4.5 border-2 border-[var(--color-border)] shadow-brutal space-y-4 overflow-hidden relative">
      {/* Background Subtle Gradient Glow */}
      <div 
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-500"
        style={{ backgroundColor: isAllSettled ? "#10b981" : "#f59e0b" }}
      />

      {/* Header / Title Bar */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-400 text-black border-2 border-black flex items-center justify-center shadow-sm shrink-0">
            <Users className="w-4 h-4 stroke-[2.5px]" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-[var(--color-text)]">
              Group Split Breakdown
            </h4>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
              {localSplits.length} {localSplits.length === 1 ? "friend" : "friends"} • {formatCurrency(txn.amount, txn.currency)} Total
            </p>
          </div>
        </div>

        {/* Live Settlement Status Pill */}
        <motion.div
          layout
          animate={isAllSettled ? { scale: [1, 1.05, 1] } : {}}
          className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider border-2 border-black flex items-center gap-1.5 shadow-sm transition-colors duration-300 ${
            isAllSettled 
              ? "bg-emerald-400 text-black" 
              : "bg-amber-400 text-black"
          }`}
        >
          {isAllSettled ? (
            <>
              <Sparkles className="w-2.5 h-2.5 fill-black" />
              <span>100% Settled</span>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
              <span>{recoveryPercent}% Recovered</span>
            </>
          )}
        </motion.div>
      </div>

      {/* Hero Interactive Radial Visualizer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 p-3.5 rounded-2xl bg-[var(--color-bg)] border border-[var(--color-border)] relative z-10">
        {/* Radial Animated Donut */}
        <div className="relative w-28 h-28 shrink-0 flex items-center justify-center">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            {/* Background Track */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#262626"
              strokeWidth="10"
            />

            {/* 1. Your Net Share Arc (Emerald) */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${userStroke} ${circumference}`}
              strokeDashoffset="0"
              className="transition-all duration-500 ease-out"
            />

            {/* 2. Settled Friends Arc (Electric Mint) */}
            {settledStroke > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#34d399"
                strokeWidth="10"
                strokeDasharray={`${settledStroke} ${circumference}`}
                strokeDashoffset={-userStroke}
                className="transition-all duration-500 ease-out"
              />
            )}

            {/* 3. Pending Friends Arc (Solar Amber with Glow) */}
            {pendingStroke > 0 && (
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${pendingStroke} ${circumference}`}
                strokeDashoffset={-(userStroke + settledStroke)}
                className="transition-all duration-500 ease-out"
              />
            )}
          </svg>

          {/* Orbiting Laser Particle along pending edge */}
          {!isAllSettled && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div 
                className="w-2.5 h-2.5 rounded-full bg-amber-300 shadow-[0_0_10px_#f59e0b] absolute border border-black"
                style={{ top: "8px", left: "calc(50% - 5px)" }}
              />
            </motion.div>
          )}

          {/* Center Metrics */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {isAllSettled ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 350, damping: 22 }}
                className="flex flex-col items-center"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-400 text-black flex items-center justify-center mb-0.5 shadow-md">
                  <Check className="w-4 h-4 stroke-[3.5px]" />
                </div>
                <span className="text-[8.5px] font-black text-emerald-400 uppercase tracking-wider">All Paid</span>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <motion.span 
                  key={recoveryPercent}
                  initial={{ scale: 0.85, opacity: 0.5 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-lg font-black font-numbers tracking-tight text-[var(--color-text)]"
                >
                  {recoveryPercent}%
                </motion.span>
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">
                  {pendingParticipants.length} Due
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="flex-1 w-full grid grid-cols-2 gap-2">
          <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col justify-center">
            <span className="text-[8.5px] uppercase font-black tracking-wider text-gray-400 flex items-center gap-1 mb-0.5">
              <User className="w-2.5 h-2.5 text-emerald-400" />
              Your True Share
            </span>
            <span className="text-xs font-black font-numbers tabular-nums text-emerald-400">
              {formatCurrency(userShare, txn.currency)}
            </span>
            <span className="text-[8px] text-gray-500 font-bold">
              ({Math.round((userShare / validTotal) * 100)}% of total)
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col justify-center">
            <span className="text-[8.5px] uppercase font-black tracking-wider text-gray-400 flex items-center gap-1 mb-0.5">
              <Users className="w-2.5 h-2.5 text-amber-400" />
              Friends Owed
            </span>
            <span className="text-xs font-black font-numbers tabular-nums text-amber-400">
              {formatCurrency(pendingFriendsAmount, txn.currency)}
            </span>
            <span className="text-[8px] text-gray-500 font-bold">
              {settledParticipants.length}/{localSplits.length} Settled
            </span>
          </div>
        </div>
      </div>

      {/* Participants Cards (Optimized for Name Visibility) */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between px-1">
          <span className="text-[9.5px] uppercase font-black tracking-wider text-gray-400">
            Participant Breakdown
          </span>
          <span className="text-[8.5px] text-gray-500 font-bold">
            Tap button to toggle paid
          </span>
        </div>

        {localSplits.map((p, idx) => {
          const initials = p.name.slice(0, 2).toUpperCase();

          return (
            <motion.div
              key={p.id || idx}
              layout
              className={`p-2.5 rounded-xl border-2 transition-all duration-300 flex items-center justify-between gap-2.5 ${
                p.isSettled
                  ? "bg-emerald-500/[0.06] border-emerald-500/40"
                  : "bg-[var(--color-bg)] border-[var(--color-border)] hover:border-amber-400/60"
              }`}
            >
              {/* Left: Avatar + Full Name & Amount */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Initial Avatar (Compact) */}
                <div
                  className={`w-7 h-7 rounded-lg border border-black flex items-center justify-center font-black text-[10px] text-black shrink-0 relative shadow-xs transition-colors duration-300 ${
                    p.isSettled ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                >
                  {initials}
                  {p.isSettled && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-black text-emerald-400 flex items-center justify-center border border-emerald-400">
                      <Check className="w-2 h-2 stroke-[4px]" />
                    </div>
                  )}
                </div>

                {/* Name & Amount (Wide & clear) */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-[var(--color-text)] uppercase leading-snug break-words">
                      {p.name}
                    </span>
                    {p.isSettled && (
                      <span className="text-[7.5px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/30 shrink-0">
                        Paid
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[11px] font-black font-numbers tabular-nums text-[var(--color-text)]">
                      {formatCurrency(p.amount, txn.currency)}
                    </span>
                    {p.settledAt && (
                      <span className="text-[8.5px] text-gray-500 font-bold truncate">
                        • {new Date(p.settledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Compact Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Copy Request Message Button (Compact Icon) */}
                <button
                  type="button"
                  onClick={() => handleCopy(p.name, p.amount, p.id)}
                  className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] flex items-center justify-center transition-all active:scale-90 cursor-pointer shadow-xs"
                  title="Copy payment request message for WhatsApp/GPay"
                >
                  {copiedId === p.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px]" />
                  ) : (
                    <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  )}
                </button>

                {/* 1-Tap Toggle Settle Status Button (Compact Pill) */}
                <button
                  type="button"
                  onClick={() => handleToggle(p.id)}
                  disabled={togglingId === p.id}
                  className={`px-2.5 py-1 rounded-lg border-2 border-black text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer flex items-center gap-1 shadow-xs ${
                    p.isSettled
                      ? "bg-emerald-400 text-black hover:bg-emerald-500"
                      : "bg-amber-400 text-black hover:bg-amber-500"
                  }`}
                >
                  {p.isSettled ? (
                    <>
                      <Check className="w-2.5 h-2.5 stroke-[3px]" />
                      <span>Settled</span>
                    </>
                  ) : (
                    <span>Mark Paid</span>
                  )}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
