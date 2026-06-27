"use client";

import { useAppRuntime, getRuntimeUiConfig } from "@/hooks/useAppRuntime";
import { WebSidebarNavigation } from "@/components/navigation/WebSidebarNavigation";
import { MobileWebHeader } from "@/components/navigation/MobileWebHeader";
import { PWABottomNavigation } from "@/components/navigation/PWABottomNavigation";
import { InstallPromptBanner } from "@/components/pwa/InstallPromptBanner";
import { PwaUpdatePrompt } from "@/components/pwa/PwaUpdatePrompt";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useReminders } from "@/hooks/useReminders";
import { useLocalPushScheduler } from "@/hooks/useLocalPushScheduler";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AmbientBackground, AmbientVariant } from "@/components/journal/AmbientBackground";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const runtime = useAppRuntime();
  const { reminders } = useReminders();
  const pathname = usePathname();

  let variant: AmbientVariant = 'journal';
  if (pathname?.startsWith('/transactions')) variant = 'transactions';
  else if (pathname?.startsWith('/research')) variant = 'research';

  // Enable global background syncing
  useAutoSync();
  
  // Enable native push scheduler for reminders
  useLocalPushScheduler();

  // ACCENT COLOR INITIALIZATION
  useEffect(() => {
    const applyAccentColor = () => {
      const savedAccent = localStorage.getItem("et_accent_color") || "violet";
      const accents: Record<string, { primary: string; rgb: string }> = {
        violet: { primary: "#8b5cf6", rgb: "139, 92, 246" },
        emerald: { primary: "#10b981", rgb: "16, 185, 129" },
        rose: { primary: "#f43f5e", rgb: "244, 63, 94" },
        amber: { primary: "#f59e0b", rgb: "245, 158, 11" },
        sky: { primary: "#00f2fe", rgb: "0, 242, 254" },
        indigo: { primary: "#6366f1", rgb: "99, 102, 241" },
      };

      const selected = accents[savedAccent] || accents.violet;
      document.documentElement.style.setProperty("--color-primary", selected.primary);
      document.documentElement.style.setProperty("--color-primary-rgb", selected.rgb);
    };

    applyAccentColor();

    window.addEventListener("app:accent:changed", applyAccentColor);
    return () => {
      window.removeEventListener("app:accent:changed", applyAccentColor);
    };
  }, []);

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

  const uiConfig = getRuntimeUiConfig(runtime);

  return (
    <div 
      className={`bg-slate-950 text-white relative w-full ${
        uiConfig.showDesktopSidebar ? "flex h-screen overflow-hidden" : "flex flex-col min-h-screen"
      }`}
    >
      <AmbientBackground variant={variant} />
      
      {/* Desktop Sidebar Navigation */}
      {uiConfig.showDesktopSidebar && <WebSidebarNavigation />}

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col ${
          uiConfig.showDesktopSidebar ? "overflow-hidden" : "min-h-screen"
        }`}
      >
        {/* Mobile Header */}
        {uiConfig.showMobileWebHeader && <MobileWebHeader />}

        {/* Mobile PWA Safe Area Top Inset */}
        {!uiConfig.showMobileWebHeader && !uiConfig.showDesktopSidebar && (
          <div
            className="flex-shrink-0 bg-slate-950"
            style={{ height: "env(safe-area-inset-top)" }}
            aria-hidden="true"
          />
        )}

        {/* Scrollable Content Container */}
        <main
          className="flex-1 overflow-y-auto"
          style={{ 
            paddingBottom: uiConfig.showBottomNav ? "calc(4rem + env(safe-area-inset-bottom))" : undefined 
          }}
        >
          <div 
            className={
              uiConfig.showDesktopSidebar 
                ? "max-w-6xl mx-auto px-8 py-8" 
                : "max-w-2xl mx-auto px-4 py-6"
            }
          >
            {children}
          </div>
        </main>
      </div>

      {/* Bottom Navigation */}
      {uiConfig.showBottomNav && <PWABottomNavigation />}

      <InstallPromptBanner />
      <PwaUpdatePrompt />
    </div>
  );
}
