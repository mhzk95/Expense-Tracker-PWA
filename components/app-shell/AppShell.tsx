"use client";

import { useAppRuntime, getRuntimeUiConfig } from "@/hooks/useAppRuntime";
import { WebSidebarNavigation } from "@/components/navigation/WebSidebarNavigation";
import { MobileWebHeader } from "@/components/navigation/MobileWebHeader";
import { PWABottomNavigation } from "@/components/navigation/PWABottomNavigation";
import { RuntimeModeBadge } from "@/components/pwa/RuntimeModeBadge";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";
import { PwaUpdatePrompt } from "@/components/pwa/PwaUpdatePrompt";
import { AutoBackupManager } from "@/components/pwa/AutoBackupManager";
import { CommandBar } from "@/components/ui/CommandBar";
import { useAutoSync } from "@/hooks/useAutoSync";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const runtime = useAppRuntime();

  // Enable global background syncing
  useAutoSync();

  if (!runtime.isBrowser) {
    return (
      <div className="min-h-screen bg-slate-950">
        <main className="min-h-screen">{children}</main>
      </div>
    );
  }

  const uiConfig = getRuntimeUiConfig(runtime);

  if (uiConfig.showDesktopSidebar) {
    return (
      <div className="flex h-screen bg-slate-950 text-white overflow-hidden">
        <WebSidebarNavigation />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
          </main>
        </div>
        {/* <RuntimeModeBadge position="bottom-right" /> */}
        <InstallPromptBanner />
        <PwaUpdatePrompt />
        <AutoBackupManager />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white">
      {uiConfig.showMobileWebHeader && <MobileWebHeader />}

      {!uiConfig.showMobileWebHeader && (
        <div
          className="flex-shrink-0 bg-slate-950"
          style={{ height: "env(safe-area-inset-top)" }}
          aria-hidden="true"
        />
      )}

      <main
        className="flex-1 overflow-y-auto"
        style={{ paddingBottom: uiConfig.showBottomNav ? "calc(4rem + env(safe-area-inset-bottom))" : undefined }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
      </main>

      {uiConfig.showBottomNav && <PWABottomNavigation />}

      {/* <RuntimeModeBadge position="top-right" /> */}
      <InstallPromptBanner />
      <PwaUpdatePrompt />
      <AutoBackupManager />
      <CommandBar />
    </div>
  );
}
