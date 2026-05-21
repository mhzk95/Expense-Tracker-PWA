/**
 * SkeletonLoader — Animated placeholder while content is loading.
 *
 * Provides configurable skeleton blocks (card, list, stat).
 */

import { cn } from "@/lib/utils/helpers";

interface SkeletonProps {
  className?: string;
}

/** Base animated skeleton bar */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-800/80",
        className
      )}
    />
  );
}

/** A skeleton shaped like a summary stat card */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-8 w-36" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

/** A skeleton shaped like a transaction list row */
export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
}

/** A skeleton shaped like a card with a content block */
export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 p-5 space-y-4">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-24 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}

/** Full-page skeleton: renders N stat cards and list rows */
export function PageSkeleton({
  statCount = 4,
  rowCount = 6,
}: {
  statCount?: number;
  rowCount?: number;
}) {
  return (
    <div className="space-y-6 animate-in fade-in-0 duration-300">
      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: statCount }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* List section */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 divide-y divide-slate-800/60 overflow-hidden">
        {Array.from({ length: rowCount }).map((_, i) => (
          <TransactionRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
