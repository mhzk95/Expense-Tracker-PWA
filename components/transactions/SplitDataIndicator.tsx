"use client";

import React from "react";
import { motion } from "framer-motion";
import { TransactionSplitParticipant } from "@/lib/db/indexeddb";
import { Check, Users } from "lucide-react";

interface SplitDonutRingProps {
  splits?: TransactionSplitParticipant[];
  netAmount?: number;
  totalAmount: number;
  className?: string;
}

export function SplitDonutRing({
  splits = [],
  netAmount,
  totalAmount,
  className = "",
}: SplitDonutRingProps) {
  if (!splits || splits.length === 0) return null;

  const totalFriendsAmount = splits.reduce((sum, s) => sum + (s.amount || 0), 0);
  const userShare = netAmount !== undefined ? netAmount : Math.max(0, totalAmount - totalFriendsAmount);
  const validTotal = totalAmount > 0 ? totalAmount : userShare + totalFriendsAmount || 1;

  const settledFriends = splits.filter((s) => s.isSettled);
  const pendingFriends = splits.filter((s) => !s.isSettled);
  const isAllSettled = pendingFriends.length === 0;

  // Geometry: SVG 24x24, Radius = 8.5
  const radius = 8.5;
  const circumference = 2 * Math.PI * radius; // ~53.4

  const userPercent = Math.min(1, Math.max(0.05, userShare / validTotal));
  const userStroke = userPercent * circumference;

  // Total friend portion
  const friendTotalPercent = Math.max(0, 1 - userPercent);
  const friendStroke = friendTotalPercent * circumference;

  const settledFriendsAmount = settledFriends.reduce((sum, s) => sum + (s.amount || 0), 0);
  const friendSettledRatio = totalFriendsAmount > 0 ? settledFriendsAmount / totalFriendsAmount : 1;
  const settledStroke = friendStroke * friendSettledRatio;
  const pendingStroke = friendStroke - settledStroke;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      title={
        isAllSettled
          ? "Group expense: 100% Settled"
          : `Group expense: ${settledFriends.length}/${splits.length} paid • ${pendingFriends.length} pending`
      }
    >
      {/* 22px Crisp Neo-Brutalist Donut Ring Container */}
      <div className="relative w-[22px] h-[22px] flex items-center justify-center">
        {/* Glow Aura when pending */}
        {!isAllSettled && (
          <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-[3px] pointer-events-none" />
        )}

        {/* SVG Slices */}
        <svg viewBox="0 0 24 24" className="w-full h-full -rotate-90">
          <defs>
            {/* Comet Gradient */}
            <linearGradient id="cometGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="#1c1917"
            strokeWidth="2.75"
          />

          {/* 1. User Share Arc (Emerald) */}
          <circle
            cx="12"
            cy="12"
            r={radius}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeDasharray={`${userStroke} ${circumference}`}
            strokeDashoffset="0"
          />

          {/* 2. Settled Friends Arc (Electric Mint) */}
          {settledStroke > 0 && (
            <circle
              cx="12"
              cy="12"
              r={radius}
              fill="none"
              stroke="#34d399"
              strokeWidth="2.75"
              strokeDasharray={`${settledStroke} ${circumference}`}
              strokeDashoffset={-userStroke}
            />
          )}

          {/* 3. Pending Friends Arc (Solar Amber) */}
          {pendingStroke > 0 && (
            <circle
              cx="12"
              cy="12"
              r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.75"
              strokeLinecap="round"
              strokeDasharray={`${pendingStroke} ${circumference}`}
              strokeDashoffset={-(userStroke + settledStroke)}
            />
          )}
        </svg>

        {/* Orbiting Comet Spark Particle (Unique Smooth Animation) */}
        {!isAllSettled && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full bg-amber-300 shadow-[0_0_6px_#fbbf24] absolute"
              style={{
                top: "1px",
                left: "calc(50% - 3px)",
              }}
            />
          </motion.div>
        )}

        {/* Center Minimal Icon / Badge */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isAllSettled ? (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3.5px]" />
            </motion.div>
          ) : (
            <span className="text-[7.5px] font-black text-amber-400 font-numbers leading-none tracking-tighter">
              {pendingFriends.length}
            </span>
          )}
        </div>

        {/* Settlement Victory Ripple when fully completed */}
        {isAllSettled && (
          <div className="absolute inset-0 rounded-full border border-emerald-400/40 pointer-events-none animate-ping" style={{ animationIterationCount: 2, animationDuration: "1.2s" }} />
        )}
      </div>
    </div>
  );
}

/**
 * Backward-compatible wrapper component for easy drop-in.
 */
export function SplitDataIndicator({
  splits = [],
  netAmount,
  totalAmount,
  className = "",
}: {
  splits?: TransactionSplitParticipant[];
  netAmount?: number;
  totalAmount: number;
  currency?: string;
  variant?: string;
  className?: string;
}) {
  return (
    <SplitDonutRing
      splits={splits}
      netAmount={netAmount}
      totalAmount={totalAmount}
      className={className}
    />
  );
}
