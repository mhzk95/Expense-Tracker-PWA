"use client";

import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { useAppRuntime } from "@/hooks/useAppRuntime";
import { X, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/helpers";

export function InstallPromptBanner() {
  const runtime = useAppRuntime();
  const install = useInstallPrompt();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true); // Default to true to prevent flash

  useEffect(() => {
    // Only run on client
    const dismissed = localStorage.getItem("install_prompt_dismissed") === "true";
    setIsDismissed(dismissed);

    // Show if:
    // 1. Not standalone PWA
    // 2. Install is available (or it's iOS and we want to show instructions)
    // 3. User hasn't dismissed it
    // Note: For iOS, since there's no programmatic prompt, we'd just show a hint.
    // For this implementation, we only show if programmatic prompt is available.
    if (!runtime.isStandalonePWA && install.isInstallable && !dismissed) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [runtime.isStandalonePWA, install.isInstallable]);

  if (!isVisible) return null;

  const handleDismiss = () => {
    localStorage.setItem("install_prompt_dismissed", "true");
    setIsVisible(false);
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    const outcome = await install.promptInstall();
    if (outcome === "accepted") {
      setIsVisible(false);
    }
  };

  return (
    <div className="fixed bottom-safe-left-right left-0 right-0 z-50 p-4 pb-20 md:pb-4 md:left-auto md:w-96 animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col gap-3 p-4 bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Install ExpenseTracker</h3>
            <p className="text-xs text-slate-400 mt-1">Get the full app experience with offline support.</p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 -mr-1 -mt-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          onClick={handleInstall}
          className="w-full flex justify-center items-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Download className="w-4 h-4" />
          Install App
        </button>
      </div>
    </div>
  );
}
