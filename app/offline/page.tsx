"use client";

/**
 * Offline page — Shown when the user navigates while offline.
 * Phase 1: Static UI shell. Service worker routing added in Phase 2.
 */

import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-16 text-center">
      {/* Animated offline icon */}
      <div className="relative mb-8">
        <div className="h-24 w-24 rounded-3xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center">
          <WifiOff className="h-12 w-12 text-slate-500" />
        </div>
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-3xl border border-slate-700/40 animate-ping opacity-30" />
      </div>

      <h1 className="text-2xl font-bold text-white mb-2">You&apos;re Offline</h1>
      <p className="text-slate-400 max-w-sm text-sm leading-relaxed mb-8">
        It looks like you&apos;ve lost your internet connection. Don&apos;t worry — your local data is safe.
        Reconnect to sync and see the latest updates.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <button
          id="retry-connection-btn"
          onClick={() => typeof window !== "undefined" && window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
        <Link
          href="/"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/60 transition-all"
        >
          <Home className="h-4 w-4" />
          Go to Dashboard
        </Link>
      </div>

      {/* Info note */}
      <p className="mt-10 text-xs text-slate-600 max-w-xs">
        Full offline support via Service Worker caching is planned for Phase 2.
      </p>
    </div>
  );
}
