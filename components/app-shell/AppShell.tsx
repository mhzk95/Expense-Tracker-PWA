"use client";

import { useAppRuntime, getRuntimeUiConfig } from "@/hooks/useAppRuntime";
import { WebSidebarNavigation } from "@/components/navigation/WebSidebarNavigation";
import { MobileWebHeader } from "@/components/navigation/MobileWebHeader";
import { PWABottomNavigation } from "@/components/navigation/PWABottomNavigation";
import { RuntimeModeBadge } from "@/components/pwa/RuntimeModeBadge";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";
import { PwaUpdatePrompt } from "@/components/pwa/PwaUpdatePrompt";
import { CommandBar } from "@/components/ui/CommandBar";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useReminders } from "@/hooks/useReminders";
import { useLocalPushScheduler } from "@/hooks/useLocalPushScheduler";
import { useEffect } from "react";
import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const runtime = useAppRuntime();
  const { reminders } = useReminders();

  // Enable global background syncing
  useAutoSync();
  
  // Enable native push scheduler for reminders
  useLocalPushScheduler();

  // RED ALERT PROTOCOL
  useEffect(() => {
    const criticalTasks = reminders.filter(r => r.status === "pending" && r.priority === "critical");
    
    if (criticalTasks.length > 0) {
      document.body.classList.add("red-alert");
      
      // Debounce telegram alerts to once every hour per session to avoid spam
      const lastAlertTime = sessionStorage.getItem("et_last_telegram_alert");
      const now = Date.now();
      
      if (!lastAlertTime || now - parseInt(lastAlertTime) > 3600000) {
        sessionStorage.setItem("et_last_telegram_alert", now.toString());
        
        fetch("/api/telegram-alert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: criticalTasks[0].title,
            tags: criticalTasks[0].contextTags,
            id: criticalTasks[0].id
          })
        }).catch(e => console.error("Failed to send telegram nudge", e));
      }
    } else {
      document.body.classList.remove("red-alert");
    }
    return () => document.body.classList.remove("red-alert");
  }, [reminders]);

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
      <CommandBar />
    </div>
  );
}
