"use client";

import { useEffect, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

export function PwaUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Detect when a new service worker takes over the page
      // Because skipWaiting is true in sw.ts, this fires as soon as the background download completes
      const handleControllerChange = () => {
        setShowPrompt(true);
      };

      navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
      };
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-[88px] left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-violet-600/95 backdrop-blur-md border border-violet-400/50 text-white p-4 rounded-2xl shadow-2xl shadow-violet-900/50 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[var(--color-surface)]/20 flex items-center justify-center shrink-0">
              <Download className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm leading-tight">Update Ready</h3>
              <p className="text-xs text-violet-100 mt-0.5 leading-snug">
                A new version has been downloaded.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowPrompt(false)}
            className="text-violet-200 hover:text-white p-1.5 -mr-1.5 -mt-1.5 rounded-lg hover:bg-[var(--color-surface)]/10 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <button
          onClick={() => window.location.reload()}
          className="w-full bg-[var(--color-surface)] text-violet-900 hover:bg-violet-50 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-colors shadow-sm active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh App to Update
        </button>
      </div>
    </div>
  );
}
