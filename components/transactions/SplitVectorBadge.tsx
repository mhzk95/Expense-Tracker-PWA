"use client";

import { motion } from "framer-motion";
import { TransactionSplitParticipant } from "@/lib/db/indexeddb";

interface SplitVectorBadgeProps {
  splits: TransactionSplitParticipant[];
  className?: string;
}

export function SplitVectorBadge({ splits, className = "" }: SplitVectorBadgeProps) {
  if (!splits || splits.length === 0) return null;

  const unsettledParticipants = splits.filter((p) => !p.isSettled);
  const unsettledTotal = unsettledParticipants.reduce((sum, p) => sum + (p.amount || 0), 0);
  const isAllSettled = unsettledParticipants.length === 0;
  const participantCount = splits.length;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg border-2 text-[9px] font-black uppercase tracking-wider transition-all select-none ${
        isAllSettled
          ? "bg-emerald-400/15 border-emerald-500 text-emerald-500 dark:text-emerald-400"
          : "bg-amber-400/15 border-amber-500 text-amber-600 dark:text-amber-400"
      } ${className}`}
    >
      {/* Animated Vector Graphic */}
      <div className="relative w-4 h-3.5 flex items-center justify-center flex-shrink-0">
        <svg
          viewBox="0 0 24 20"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* User Node (Left) */}
          <circle
            cx="4"
            cy="10"
            r="3"
            className={isAllSettled ? "fill-emerald-500" : "fill-emerald-500"}
          />

          {/* Friend Node (Right) */}
          <circle
            cx="20"
            cy="10"
            r="3"
            className={isAllSettled ? "fill-emerald-500" : "fill-amber-500"}
          />

          {/* Connection Arc / Path */}
          <path
            d="M 7 10 Q 12 3, 17 10"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeDasharray="2 2"
            className="opacity-70"
          />

          {/* Bottom Return Path if unsettled */}
          {!isAllSettled && (
            <path
              d="M 17 10 Q 12 17, 7 10"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeDasharray="2 2"
              className="opacity-40"
            />
          )}

          {/* Animated Transfer Pulse traveling along arc */}
          {!isAllSettled ? (
            <motion.circle
              r="2"
              fill="#f59e0b"
              animate={{
                cx: [17, 12, 4, 12, 17],
                cy: [10, 15, 10, 5, 10],
              }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ) : (
            <motion.path
              d="M 10 10 L 12 12 L 15 8"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          )}
        </svg>

        {/* Ambient ping ring for pending debt */}
        {!isAllSettled && (
          <span className="absolute -top-0.5 -right-0.5 flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
          </span>
        )}
      </div>

      {/* Status Text & Amounts */}
      <span className="font-numbers tabular-nums leading-none">
        {isAllSettled ? (
          "Settled"
        ) : (
          <>
            ₹{unsettledTotal.toFixed(0)}{" "}
            <span className="opacity-75 text-[8px]">
              ({participantCount > 1 ? `${participantCount}p` : "1p"})
            </span>
          </>
        )}
      </span>
    </div>
  );
}
