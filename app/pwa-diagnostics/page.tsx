"use client";

import { useAppRuntime, getRuntimeUiConfig } from "@/hooks/useAppRuntime";
import { useInstallPrompt } from "@/hooks/useInstallPrompt";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils/helpers";
import {
  Monitor,
  Smartphone,
  Wifi,
  WifiOff,
  AppWindow,
  Globe,
  Download,
  CheckCircle2,
  XCircle,
  Info,
  Apple,
  Settings2,
  Cloud,
} from "lucide-react";

interface DiagnosticRowProps {
  label: string;
  value: string | boolean;
  description?: string;
  status?: "ok" | "warn" | "info";
}

function DiagnosticRow({ label, value, description, status = "info" }: DiagnosticRowProps) {
  const isBool = typeof value === "boolean";
  const displayValue = isBool ? (value ? "Yes" : "No") : value;

  return (
    <div className="flex items-start justify-between gap-4 py-3 px-5">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isBool ? (
          value ? (
            <CheckCircle2 className={cn("h-4 w-4", status === "ok" ? "text-emerald-400" : "text-slate-400")} />
          ) : (
            <XCircle className="h-4 w-4 text-slate-600" />
          )
        ) : (
          <Info className="h-4 w-4 text-slate-500" />
        )}
        <span
          className={cn(
            "text-sm font-mono font-medium",
            isBool && value ? "text-emerald-400" : isBool ? "text-slate-500" : "text-violet-300"
          )}
        >
          {displayValue}
        </span>
      </div>
    </div>
  );
}

import { useSyncQueue } from "@/hooks/useSyncQueue";
import { useSyncEngine } from "@/hooks/useSyncEngine";

export default function PWADiagnosticsPage() {
  const runtime = useAppRuntime();
  const install = useInstallPrompt();
  const { pendingItems, failedItems, conflictItems, syncedItems } = useSyncQueue();
  const { isSyncing, lastSyncAt } = useSyncEngine();

  if (!runtime.isBrowser) {
    return (
      <div className="space-y-6">
        <PageHeader title="PWA Diagnostics" subtitle="Loading runtime information…" />
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 h-64 animate-pulse" />
      </div>
    );
  }

  const uiConfig = getRuntimeUiConfig(runtime);

  const sections = [
    {
      title: "Core Runtime",
      icon: AppWindow,
      rows: [
        {
          label: "Runtime Mode",
          value: runtime.runtimeMode,
          description: "Final evaluated runtime state",
          status: "info" as const,
        },
        {
          label: "Is Standalone PWA",
          value: runtime.isStandalonePWA,
          description: "Confirmed installed PWA mode",
          status: "ok" as const,
        },
        {
          label: "Is Mobile Device Browser",
          value: runtime.isMobileDeviceBrowser,
          description: "Real mobile device detection",
          status: "info" as const,
        },
        {
          label: "Is Resized Desktop",
          value: runtime.isResizedDesktopMobileViewport,
          description: "Desktop browser in narrow window",
          status: "info" as const,
        },
      ],
    },
    {
      title: "Signals & Detection",
      icon: Smartphone,
      rows: [
        {
          label: "Desktop Viewport",
          value: runtime.isDesktopViewport,
          description: "Viewport width ≥ breakpoint",
          status: "info" as const,
        },
        {
          label: "Mobile Viewport",
          value: runtime.isMobileViewport,
          description: "Viewport width < breakpoint",
          status: "info" as const,
        },
        {
          label: "Mobile User Agent",
          value: runtime.isMobileUserAgent,
          description: "UA string matches mobile",
          status: "info" as const,
        },
        {
          label: "Touch Device",
          value: runtime.isTouchDevice,
          description: "ontouchstart / maxTouchPoints > 0",
          status: "info" as const,
        },
        {
          label: "Coarse Pointer",
          value: runtime.isCoarsePointer,
          description: "CSS media pointer: coarse",
          status: "info" as const,
        },
        {
          label: "Hover Supported",
          value: runtime.isHoverSupported,
          description: "CSS media hover: hover",
          status: "info" as const,
        },
        {
          label: "Display Mode",
          value: runtime.displayMode,
          description: "From matchMedia(display-mode)",
          status: "info" as const,
        },
        {
          label: "Is iOS",
          value: runtime.isIOS,
          description: "iOS device detected",
          status: "info" as const,
        },
      ],
    },
    {
      title: "UI Configuration",
      icon: Settings2,
      rows: [
        {
          label: "Navigation Style",
          value: uiConfig.showDesktopSidebar ? "Sidebar" : uiConfig.showBottomNav ? "Bottom Nav" : "Header",
          description: "Primary navigation layout",
          status: "info" as const,
        },
        {
          label: "Modal Type",
          value: uiConfig.modalPresentation,
          description: "Selected modal presentation",
          status: "info" as const,
        },
        {
          label: "Menu Type",
          value: uiConfig.menuPresentation,
          description: "Selected action menu presentation",
          status: "info" as const,
        },
        {
          label: "Filter Type",
          value: uiConfig.filterPresentation,
          description: "Selected filter UI",
          status: "info" as const,
        },
        {
          label: "Action Bar",
          value: uiConfig.actionBarPresentation,
          description: "Selected action bar style",
          status: "info" as const,
        },
      ],
    },
    {
      title: "Network & Environment",
      icon: Wifi,
      rows: [
        {
          label: "Online",
          value: runtime.isOnline,
          description: "navigator.onLine state",
          status: "ok" as const,
        },
        {
          label: "Safe Area Support",
          value: runtime.safeAreaSupported,
          description: "CSS env(safe-area-inset) support",
          status: "info" as const,
        },
        {
          label: "Service Worker Supported",
          value: runtime.serviceWorkerSupported,
          description: "'serviceWorker' in navigator",
          status: "info" as const,
        },
        {
          label: "Service Worker Registered",
          value: runtime.serviceWorkerRegistered,
          description: "Active SW registration found",
          status: (runtime.serviceWorkerRegistered ? "ok" : "warn") as "ok" | "warn",
        },
      ],
    },
    {
      title: "Install Prompt",
      icon: Download,
      rows: [
        {
          label: "Is Installable",
          value: install.isInstallable,
          description: "beforeinstallprompt event captured",
          status: "ok" as const,
        },
        {
          label: "Is Installed",
          value: install.isInstalled,
          description: "App reports as installed",
          status: "ok" as const,
        },
      ],
    },
    {
      title: "Sync Engine & Queue",
      icon: Cloud,
      rows: [
        {
          label: "Sync Engine Status",
          value: isSyncing ? "Syncing..." : "Idle",
          status: (isSyncing ? "warn" : "info") as "warn" | "info",
        },
        {
          label: "Pending Queue",
          value: String(pendingItems.length),
          description: "Items waiting to sync",
          status: (pendingItems.length > 0 ? "warn" : "ok") as "warn" | "ok",
        },
        {
          label: "Failed & Conflicts",
          value: `${failedItems.length} failed / ${conflictItems.length} conflicts`,
          description: "Items needing resolution",
          status: (failedItems.length > 0 || conflictItems.length > 0 ? "warn" : "ok") as "warn" | "ok",
        },
        {
          label: "Synced Items",
          value: String(syncedItems.length),
          description: "Successfully processed items",
          status: "info" as const,
        },
        {
          label: "Last Sync Time",
          value: lastSyncAt ? new Date(lastSyncAt).toLocaleTimeString() : "Never",
          description: "Last sync:end event",
          status: "info" as const,
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="PWA Diagnostics"
        subtitle="Advanced runtime detection"
        action={
          install.isInstallable ? (
            <button
              id="install-pwa-btn"
              onClick={() => install.promptInstall()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-all shadow-lg shadow-violet-500/20"
            >
              <Download className="h-4 w-4" />
              Install App
            </button>
          ) : undefined
        }
      />

      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-4",
          runtime.runtimeMode === "standalone-pwa"
            ? "bg-violet-500/10 border-violet-500/30"
            : runtime.runtimeMode === "mobile-device-browser"
            ? "bg-blue-500/10 border-blue-500/30"
            : runtime.runtimeMode === "resized-desktop-mobile-web"
            ? "bg-amber-500/10 border-amber-500/30"
            : "bg-slate-500/10 border-slate-500/30"
        )}
      >
        <div
          className={cn(
            "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
            runtime.runtimeMode === "standalone-pwa" ? "bg-violet-500/20 text-violet-400" :
            runtime.runtimeMode === "mobile-device-browser" ? "bg-blue-500/20 text-blue-400" :
            runtime.runtimeMode === "resized-desktop-mobile-web" ? "bg-amber-500/20 text-amber-400" :
            "bg-slate-500/20 text-slate-400"
          )}
        >
          {runtime.runtimeMode === "standalone-pwa" ? <AppWindow className="h-5 w-5" /> :
           runtime.runtimeMode === "mobile-device-browser" ? <Smartphone className="h-5 w-5" /> :
           runtime.runtimeMode === "resized-desktop-mobile-web" ? <Monitor className="h-5 w-5" /> :
           <Globe className="h-5 w-5" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-white uppercase tracking-wider">
            {runtime.runtimeMode.replace(/-/g, " ")}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {runtime.isMobileViewport ? "Mobile Viewport" : "Desktop Viewport"}
            {runtime.isIOS ? " · iOS" : runtime.isAndroid ? " · Android" : ""}
          </p>
        </div>
      </div>

      {sections.map((section) => {
        const Icon = section.icon;
        return (
          <div
            key={section.title}
            className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden"
          >
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-800/60">
              <Icon className="h-4 w-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-white">{section.title}</h2>
            </div>
            <div className="divide-y divide-slate-800/40">
              {section.rows.map((row) => (
                <DiagnosticRow key={row.label} {...row} />
              ))}
            </div>
          </div>
        );
      })}

      {runtime.isIOS && !runtime.isStandalonePWA && (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
          <div className="flex items-center gap-2 mb-2">
            <Apple className="h-4 w-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Install on iOS</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tap the <strong className="text-white">Share button</strong> in Safari, then select{" "}
            <strong className="text-white">&quot;Add to Home Screen&quot;</strong>. iOS does not support
            programmatic install prompts.
          </p>
        </div>
      )}
    </div>
  );
}
