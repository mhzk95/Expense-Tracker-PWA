"use client";

import React from "react";
import { motion } from "framer-motion";
import { TransactionSplitParticipant } from "@/lib/db/indexeddb";
import { Check, Users, User, Sparkles } from "lucide-react";

export type SplitDataVariant = "recovery-bar" | "avatar-beacons" | "donut-ring" | "split-capsule";

interface SplitDataIndicatorProps {
  splits?: TransactionSplitParticipant[];
  netAmount?: number;
  totalAmount: number;
  currency?: string;
  variant?: SplitDataVariant;
  className?: string;
}

interface SplitMetrics {
  splits: TransactionSplitParticipant[];
  userShare: number;
  friendTotal: number;
  totalFriends: number;
  settledFriends: TransactionSplitParticipant[];
  pendingFriends: TransactionSplitParticipant[];
  totalSettledAmount: number;
  totalPendingAmount: number;
  isAllSettled: boolean;
  userPercentage: number;
  recoveryPercentage: number;
}

export function extractSplitMetrics(
  splits: TransactionSplitParticipant[] = [],
  netAmount: number | undefined,
  totalAmount: number
): SplitMetrics {
  const friendTotal = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const userShare = netAmount !== undefined ? netAmount : Math.max(0, totalAmount - friendTotal);
  const totalFriends = splits.length;
  const settledFriends = splits.filter((s) => s.isSettled);
  const pendingFriends = splits.filter((s) => !s.isSettled);
  const totalSettledAmount = settledFriends.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalPendingAmount = pendingFriends.reduce((sum, s) => sum + (s.amount || 0), 0);
  const isAllSettled = totalFriends > 0 && pendingFriends.length === 0;

  const validTotal = totalAmount > 0 ? totalAmount : userShare + friendTotal || 1;
  const userPercentage = Math.min(100, Math.max(5, (userShare / validTotal) * 100));
  const recoveryPercentage = Math.min(100, ((userShare + totalSettledAmount) / validTotal) * 100);

  return {
    splits,
    userShare,
    friendTotal,
    totalFriends,
    settledFriends,
    pendingFriends,
    totalSettledAmount,
    totalPendingAmount,
    isAllSettled,
    userPercentage,
    recoveryPercentage,
  };
}

/**
 * 📊 Variant 1: Live Recovery Progress Bar
 * Multi-segment track with animated neon shimmer sweep on pending debts.
 */
export function RecoveryBarIndicator({
  metrics,
  currency = "₹",
  className = "",
}: {
  metrics: SplitMetrics;
  currency?: string;
  className?: string;
}) {
  const { splits, userPercentage, isAllSettled, settledFriends, totalFriends, totalPendingAmount } = metrics;

  return (
    <div className={`flex flex-col items-end gap-1 select-none ${className}`}>
      {/* Recovery Track */}
      <div className="w-24 h-2 rounded-full bg-black/40 p-[1px] border border-black/30 flex overflow-hidden relative shadow-inner">
        {/* User Share Segment (Emerald) */}
        <div
          className="h-full bg-emerald-500 rounded-l-full relative"
          style={{ width: `${userPercentage}%` }}
          title={`Your share: ${Math.round(userPercentage)}%`}
        />

        {/* Friend Segments */}
        {splits.map((friend, idx) => {
          const friendWidth = (friend.amount / (metrics.userShare + metrics.friendTotal || 1)) * 100;
          const isLast = idx === splits.length - 1;

          return (
            <div
              key={friend.id || idx}
              className={`h-full relative transition-all ${
                friend.isSettled
                  ? "bg-emerald-400"
                  : "bg-amber-400"
              } ${isLast ? "rounded-r-full" : "border-r border-black/40"}`}
              style={{ width: `${friendWidth}%` }}
              title={`${friend.name}: ${currency}${friend.amount} (${friend.isSettled ? "Paid" : "Pending"})`}
            >
              {/* Active Neon Shimmer Sweep for Pending Friend */}
              {!friend.isSettled && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{
                    duration: 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: idx * 0.3,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Recovery Badge Ticker */}
      <div className="flex items-center gap-1">
        {isAllSettled ? (
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-0.5">
            <Check className="w-2.5 h-2.5 stroke-[3px]" /> 100% Settled
          </span>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-tight text-amber-400/90 font-numbers tabular-nums flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping shrink-0" />
            {settledFriends.length}/{totalFriends} Paid • {currency}{totalPendingAmount} Due
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * 👥 Variant 2: Participant Avatar Stack with Live Beacons
 * Shows overlapping avatar initial chips with live pulsing amber radar pings.
 */
export function AvatarBeaconsIndicator({
  metrics,
  currency = "₹",
  className = "",
}: {
  metrics: SplitMetrics;
  currency?: string;
  className?: string;
}) {
  const { splits, isAllSettled, pendingFriends, totalPendingAmount } = metrics;

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Overlapping Avatar Stack */}
      <div className="flex items-center -space-x-1.5 overflow-visible">
        {/* User Chip */}
        <div
          className="w-5 h-5 rounded-full bg-emerald-500 text-black border border-black font-black text-[8px] flex items-center justify-center shadow-sm relative z-20"
          title="You"
        >
          <User className="w-2.5 h-2.5 stroke-[3px]" />
        </div>

        {/* Friend Avatar Chips */}
        {splits.slice(0, 3).map((friend, idx) => {
          const initial = (friend.name || "F").charAt(0).toUpperCase();
          const zIndex = 15 - idx;

          return (
            <div
              key={friend.id || idx}
              className={`w-5 h-5 rounded-full text-[8px] font-black flex items-center justify-center relative border border-black shadow-sm ${
                friend.isSettled
                  ? "bg-emerald-400 text-black"
                  : "bg-amber-400 text-black"
              }`}
              style={{ zIndex }}
              title={`${friend.name}: ${currency}${friend.amount} (${friend.isSettled ? "Settled" : "Pending"})`}
            >
              {initial}

              {/* Status Badge on Avatar */}
              {friend.isSettled ? (
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-black text-emerald-400 flex items-center justify-center">
                  <Check className="w-1.5 h-1.5 stroke-[4px]" />
                </div>
              ) : (
                /* Live Pulsing Beacon Ping */
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                  <motion.span
                    className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.8, 0, 0.8] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 border border-black/40" />
                </span>
              )}
            </div>
          );
        })}

        {splits.length > 3 && (
          <div className="w-5 h-5 rounded-full bg-neutral-800 text-gray-300 text-[8px] font-black flex items-center justify-center border border-black z-0">
            +{splits.length - 3}
          </div>
        )}
      </div>

      {/* Debt Status Ticker */}
      <div className="flex flex-col items-end leading-tight">
        {isAllSettled ? (
          <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-0.5">
            <Check className="w-2.5 h-2.5 stroke-[3px]" /> Settled
          </span>
        ) : (
          <span className="text-[9px] font-black uppercase text-amber-400 font-numbers tabular-nums">
            {currency}{totalPendingAmount} Due ({pendingFriends.length})
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * 🍩 Variant 3: Proportional Data Donut
 * 22px SVG radial ring sliced to exact rupee proportions with an active rotating laser sweep.
 */
export function DonutRingIndicator({
  metrics,
  currency = "₹",
  className = "",
}: {
  metrics: SplitMetrics;
  currency?: string;
  className?: string;
}) {
  const { userPercentage, splits, isAllSettled, pendingFriends, totalPendingAmount } = metrics;
  const radius = 9;
  const circumference = 2 * Math.PI * radius; // ~56.54

  // Compute strokes
  const userStroke = (userPercentage / 100) * circumference;
  const friendTotalPercentage = 100 - userPercentage;
  const friendStroke = (friendTotalPercentage / 100) * circumference;

  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* 24px Data Donut SVG */}
      <div className="relative w-6 h-6 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 24 24" className="w-6 h-6 -rotate-90">
          {/* Track Background */}
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="#18181b"
            strokeWidth="3"
          />

          {/* User Share (Emerald Arc) */}
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray={`${userStroke} ${circumference}`}
            strokeDashoffset="0"
          />

          {/* Friends Share (Amber Arc if pending, Emerald if settled) */}
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke={isAllSettled ? "#10b981" : "#f59e0b"}
            strokeWidth="3"
            strokeDasharray={`${friendStroke} ${circumference}`}
            strokeDashoffset={-userStroke}
          />
        </svg>

        {/* Center Indicator Number / Check */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isAllSettled ? (
            <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3.5px]" />
          ) : (
            <span className="text-[8px] font-black text-amber-400 font-numbers">
              {pendingFriends.length}
            </span>
          )}
        </div>

        {/* Rotating Active Laser Ring when pending */}
        {!isAllSettled && (
          <motion.div
            className="absolute inset-0 rounded-full border-t border-amber-300 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          />
        )}
      </div>

      {/* Text Label */}
      <div className="flex flex-col items-end leading-tight">
        {isAllSettled ? (
          <span className="text-[9px] font-black uppercase text-emerald-400">
            Settled
          </span>
        ) : (
          <span className="text-[9px] font-black uppercase text-amber-400 font-numbers tabular-nums">
            {currency}{totalPendingAmount} ({Math.round(userPercentage)}% share)
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * 🏷️ Variant 4: Financial Split Capsule
 * High-contrast duo-tone Neo-Brutalist capsule with active glowing wave on unpaid balance.
 */
export function SplitCapsuleIndicator({
  metrics,
  currency = "₹",
  className = "",
}: {
  metrics: SplitMetrics;
  currency?: string;
  className?: string;
}) {
  const { userShare, isAllSettled, totalFriends, totalPendingAmount } = metrics;

  return (
    <div className={`inline-flex items-center rounded-lg border border-black/40 bg-black/60 p-0.5 select-none shadow-sm ${className}`}>
      {/* Left: Your Net Share */}
      <div className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[8.5px] font-black uppercase font-numbers tabular-nums flex items-center gap-0.5">
        <User className="w-2 h-2 stroke-[3px]" />
        {currency}{Math.round(userShare)}
      </div>

      {/* Divider */}
      <div className="w-[1px] h-3 bg-white/20 mx-0.5" />

      {/* Right: Friends Owed with Dynamic Glow */}
      {isAllSettled ? (
        <div className="px-1.5 py-0.5 rounded bg-emerald-400 text-black text-[8.5px] font-black uppercase flex items-center gap-0.5">
          <Sparkles className="w-2 h-2 fill-black" /> Settled
        </div>
      ) : (
        <div className="relative overflow-hidden px-1.5 py-0.5 rounded bg-amber-400 text-black text-[8.5px] font-black uppercase font-numbers tabular-nums flex items-center gap-1">
          <Users className="w-2 h-2 stroke-[3px]" />
          <span>{currency}{totalPendingAmount} ({totalFriends}p)</span>

          {/* Active Radar Wave Pulse */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Unified Component
 */
export function SplitDataIndicator({
  splits = [],
  netAmount,
  totalAmount,
  currency = "₹",
  variant = "recovery-bar",
  className = "",
}: SplitDataIndicatorProps) {
  if (!splits || splits.length === 0) return null;

  const metrics = extractSplitMetrics(splits, netAmount, totalAmount);

  switch (variant) {
    case "recovery-bar":
      return <RecoveryBarIndicator metrics={metrics} currency={currency} className={className} />;
    case "avatar-beacons":
      return <AvatarBeaconsIndicator metrics={metrics} currency={currency} className={className} />;
    case "donut-ring":
      return <DonutRingIndicator metrics={metrics} currency={currency} className={className} />;
    case "split-capsule":
      return <SplitCapsuleIndicator metrics={metrics} currency={currency} className={className} />;
    default:
      return <RecoveryBarIndicator metrics={metrics} currency={currency} className={className} />;
  }
}
