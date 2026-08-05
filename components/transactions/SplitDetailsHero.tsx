"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TransactionSplitParticipant, TransactionEntity } from "@/lib/db/indexeddb";
import { formatCurrency, vibrate } from "@/lib/utils/helpers";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
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

  const listVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 350,
        damping: 26,
      },
    },
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className="bg-[var(--color-surface)] rounded-[24px] p-4.5 border-2 border-[var(--color-border)] shadow-brutal space-y-4 overflow-hidden relative"
    >
      {/* Background Subtle Gradient Glow */}
      <div 
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none opacity-20 transition-colors duration-500"
        style={{ backgroundColor: isAllSettled ? "#10b981" : "#f59e0b" }}
      />

      {/* Header / Title Bar */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="w-8 h-8 rounded-xl bg-amber-400 text-black border-2 border-black flex items-center justify-center shadow-sm shrink-0"
          >
            <Users className="w-4 h-4 stroke-[2.5px]" />
          </motion.div>
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
          animate={isAllSettled ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.3, ease: "easeInOut" }}
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
              <AnimatedNumber 
                value={recoveryPercent} 
                formatFn={(v) => `${Math.round(v)}% Recovered`}
              />
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
            <motion.circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="10"
              strokeLinecap="round"
              initial={{ strokeDasharray: `0 ${circumference}` }}
              animate={{ 
                strokeDasharray: `${userStroke} ${circumference}`,
                strokeDashoffset: 0
              }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />

            {/* 2. Settled Friends Arc (Electric Mint) */}
            {settledStroke > 0 && (
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#34d399"
                strokeWidth="10"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ 
                  strokeDasharray: `${settledStroke} ${circumference}`,
                  strokeDashoffset: -userStroke
                }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            )}

            {/* 3. Pending Friends Arc (Solar Amber with Glow) */}
            {pendingStroke > 0 && (
              <motion.circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="10"
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                animate={{ 
                  strokeDasharray: `${pendingStroke} ${circumference}`,
                  strokeDashoffset: -(userStroke + settledStroke)
                }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
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
                <AnimatedNumber
                  value={recoveryPercent}
                  formatFn={(v) => `${Math.round(v)}%`}
                  className="text-lg font-black font-numbers tracking-tight text-[var(--color-text)]"
                />
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">
                  {pendingParticipants.length} Due
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Financial Stat Pills */}
        <div className="flex-1 w-full grid grid-cols-2 gap-2">
          <motion.div 
            whileHover={{ y: -1 }}
            className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col justify-center transition-colors"
          >
            <span className="text-[8.5px] uppercase font-black tracking-wider text-gray-400 flex items-center gap-1 mb-0.5">
              <User className="w-2.5 h-2.5 text-emerald-400" />
              Your True Share
            </span>
            <AnimatedNumber
              value={userShare}
              formatFn={(v) => formatCurrency(v, txn.currency)}
              className="text-xs font-black font-numbers tabular-nums text-emerald-400"
            />
            <span className="text-[8px] text-gray-500 font-bold">
              ({Math.round((userShare / validTotal) * 100)}% of total)
            </span>
          </motion.div>

          <motion.div 
            whileHover={{ y: -1 }}
            className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col justify-center transition-colors"
          >
            <span className="text-[8.5px] uppercase font-black tracking-wider text-gray-400 flex items-center gap-1 mb-0.5">
              <Users className="w-2.5 h-2.5 text-amber-400" />
              Friends Owed
            </span>
            <AnimatedNumber
              value={pendingFriendsAmount}
              formatFn={(v) => formatCurrency(v, txn.currency)}
              className="text-xs font-black font-numbers tabular-nums text-amber-400"
            />
            <span className="text-[8px] text-gray-500 font-bold">
              {settledParticipants.length}/{localSplits.length} Settled
            </span>
          </motion.div>
        </div>
      </div>

      {/* Participants Cards (Optimized for Name Visibility & Spring Stagger) */}
      <motion.div 
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="space-y-2 relative z-10"
      >
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
              variants={cardVariants}
              layout
              whileTap={{ scale: 0.98 }}
              className={`p-2.5 rounded-xl border-2 transition-colors duration-300 flex items-center justify-between gap-2.5 ${
                p.isSettled
                  ? "bg-emerald-500/[0.06] border-emerald-500/40"
                  : "bg-[var(--color-bg)] border-[var(--color-border)] hover:border-amber-400/60"
              }`}
            >
              {/* Left: Avatar + Full Name & Amount */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Initial Avatar */}
                <motion.div
                  layout
                  className={`w-7 h-7 rounded-lg border border-black flex items-center justify-center font-black text-[10px] text-black shrink-0 relative shadow-xs transition-colors duration-300 ${
                    p.isSettled ? "bg-emerald-400" : "bg-amber-400"
                  }`}
                >
                  {initials}
                  {p.isSettled && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 450, damping: 20 }}
                      className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-black text-emerald-400 flex items-center justify-center border border-emerald-400"
                    >
                      <Check className="w-2 h-2 stroke-[4px]" />
                    </motion.div>
                  )}
                </motion.div>

                {/* Name & Amount */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-black text-[var(--color-text)] uppercase leading-snug break-words">
                      {p.name}
                    </span>
                    {p.isSettled && (
                      <motion.span 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-[7.5px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-1 py-0.2 rounded border border-emerald-500/30 shrink-0"
                      >
                        Paid
                      </motion.span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <AnimatedNumber
                      value={p.amount}
                      formatFn={(v) => formatCurrency(v, txn.currency)}
                      className="text-[11px] font-black font-numbers tabular-nums text-[var(--color-text)]"
                    />
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
                {/* Copy Request Message Button */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleCopy(p.name, p.amount, p.id)}
                  className="w-7 h-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surfaceHover)] flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  title="Copy payment request message for WhatsApp/GPay"
                >
                  <AnimatePresence mode="wait">
                    {copiedId === p.id ? (
                      <motion.div
                        key="copied"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3px]" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="msg"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* 1-Tap Toggle Settle Status Button with Morphing Animation */}
                <motion.button
                  type="button"
                  layout
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.94 }}
                  transition={{ type: "spring", stiffness: 450, damping: 25 }}
                  onClick={() => handleToggle(p.id)}
                  disabled={togglingId === p.id}
                  className={`px-2.5 py-1 rounded-lg border-2 border-black text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-xs ${
                    p.isSettled
                      ? "bg-emerald-400 text-black hover:bg-emerald-500"
                      : "bg-amber-400 text-black hover:bg-amber-500"
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {p.isSettled ? (
                      <motion.div
                        key="settled"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-1"
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3px]" />
                        <span>Settled</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="mark-paid"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <span>Mark Paid</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
