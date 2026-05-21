/**
 * RuntimeModeBadge — Displays current runtime context visually.
 *
 * Shows:
 * - Display mode (Browser / Standalone PWA / Minimal-UI / Fullscreen)
 * - Online / Offline state
 * - Platform (Desktop / Mobile / iOS / Android)
 *
 * Useful during development and diagnostics. Can be hidden in production
 * via the `hidden` prop or an env variable.
 */
"use client";

import { useAppRuntime } from "@/hooks/useAppRuntime";
import { cn } from "@/lib/utils/helpers";
import {
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  AppWindow,
  Globe,
} from "lucide-react";

interface RuntimeModeBadgeProps {
  /** Position of the badge on screen */
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  className?: string;
}

export function RuntimeModeBadge({
  position = "bottom-right",
  className,
}: RuntimeModeBadgeProps) {
  const runtime = useAppRuntime();

  // Don't render until client has hydrated
  if (!runtime.isBrowser) return null;

  const positionClasses = {
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
  };

  const displayModeLabel: Record<string, string> = {
    standalone: "Standalone PWA",
    "minimal-ui": "Minimal-UI PWA",
    fullscreen: "Fullscreen PWA",
    browser: "Browser Tab",
  };

  const displayModeColor: Record<string, string> = {
    standalone: "bg-violet-500/20 text-violet-300 border-violet-500/40",
    "minimal-ui": "bg-blue-500/20 text-blue-300 border-blue-500/40",
    fullscreen: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
    browser: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  };

  const platformLabel = runtime.isIOS
    ? "iOS"
    : runtime.isAndroid
      ? "Android"
      : runtime.isDesktopViewport
        ? "Desktop"
        : "Mobile";

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col gap-1.5 pointer-events-none",
        positionClasses[position],
        className
      )}
      role="status"
      aria-label="Runtime mode diagnostic badge"
    >
      {/* Runtime Mode pill */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium backdrop-blur-sm",
          runtime.runtimeMode === "standalone-pwa" ? "bg-violet-500/20 text-violet-300 border-violet-500/40" :
            runtime.runtimeMode === "mobile-device-browser" ? "bg-blue-500/20 text-blue-300 border-blue-500/40" :
              runtime.runtimeMode === "resized-desktop-mobile-web" ? "bg-amber-500/20 text-amber-300 border-amber-500/40" :
                "bg-slate-500/20 text-slate-300 border-slate-500/40"
        )}
      >
        {runtime.runtimeMode === "standalone-pwa" ? <AppWindow className="w-3.5 h-3.5" /> :
          runtime.runtimeMode === "mobile-device-browser" ? <Smartphone className="w-3.5 h-3.5" /> :
            runtime.runtimeMode === "resized-desktop-mobile-web" ? <Monitor className="w-3.5 h-3.5" /> :
              <Globe className="w-3.5 h-3.5" />}
        <span>
          {runtime.runtimeMode === "standalone-pwa" ? "Installed PWA" :
            runtime.runtimeMode === "mobile-device-browser" ? "Mobile device browser" :
              runtime.runtimeMode === "resized-desktop-mobile-web" ? "Resized desktop mobile web" :
                "Desktop web"}
        </span>
      </div>

      {/* Network status pill */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium backdrop-blur-sm",
          runtime.isOnline
            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
            : "bg-red-500/20 text-red-300 border-red-500/40"
        )}
      >
        {runtime.isOnline ? (
          <Wifi className="w-3.5 h-3.5" />
        ) : (
          <WifiOff className="w-3.5 h-3.5" />
        )}
        <span>{runtime.isOnline ? "Online" : "Offline"}</span>
      </div>

      {/* Platform / Bottom Nav pill */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium backdrop-blur-sm bg-slate-800/60 text-slate-300 border-slate-700/60">
        <span>Bottom Nav: {
          runtime.runtimeMode === "standalone-pwa" ? "PWA Mode" :
            runtime.runtimeMode === "mobile-device-browser" ? "Mobile Dev Mode" : "Off"
        }</span>
      </div>
    </div>
  );
}
