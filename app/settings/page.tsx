/**
 * Settings page — Application configuration and preferences.
 * Phase 1: Static settings layout with grouped sections.
 */

"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Palette,
  Globe,
  Bell,
  Lock,
  Database,
  HelpCircle,
  Info,
  ChevronRight,
  Trash2,
  ShieldAlert,
} from "lucide-react";
import { useVault } from "@/hooks/useVault";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { Button } from "@/components/ui/Button";
import { SUPPORTED_CURRENCIES, STORAGE_KEYS } from "@/lib/constants/app";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { CloudSyncSettings } from "@/components/settings/CloudSyncSettings";
import { TelegramSettings } from "@/components/settings/TelegramSettings";
import { DiagnosticsSettings } from "@/components/settings/DiagnosticsSettings";
import { AccentColorSelector } from "@/components/settings/AccentColorSelector";
import { CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { resetVault } = useVault();
  const [currency, setCurrency] = useState("INR");
  const [activeModal, setActiveModal] = useState<"currency" | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedCurrency = localStorage.getItem(STORAGE_KEYS.CURRENCY) || "INR";
    setCurrency(savedCurrency);

    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
    } else {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem(STORAGE_KEYS.CURRENCY, newCurrency);
    // Dispatch an event so other parts of the app can update
    window.dispatchEvent(new Event("app:currency:changed"));
    setActiveModal(null);
  };

  const getSectionItems = () => [
    {
      title: "Regional",
      items: [
        { 
          id: "currency", 
          label: "Default Currency", 
          description: mounted ? currency : "Loading...", 
          icon: Globe 
        },
      ],
    }
  ];

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const result = await Notification.requestPermission();
      setNotificationPermission(result);
      if (result === "granted" && "serviceWorker" in navigator) {
        navigator.serviceWorker.ready.then(reg => {
          reg.showNotification("Notifications Enabled", {
            body: "You will now receive task reminder alerts.",
            icon: "/icon-192x192.png",
          });
        });
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <PageHeader title="Settings" subtitle="Preferences and configuration" />

      <CloudSyncSettings />

      <TelegramSettings />

      <ThemeSelector />

      <AccentColorSelector />

      <DiagnosticsSettings />

      {getSectionItems().map((section) => (
        <div key={section.title} className="space-y-2 pt-4">
          <h2 className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest px-1">
            {section.title}
          </h2>
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[16px] divide-y-2 divide-[var(--color-border)] overflow-hidden">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`settings-${item.id}-btn`}
                  onClick={() => setActiveModal(item.id as "currency")}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-[var(--color-surfaceHover)] transition-colors text-left group"
                >
                  <div className="h-10 w-10 rounded-[10px] bg-[var(--color-surface)] border-2 border-[var(--color-border)] flex items-center justify-center flex-shrink-0  transition-colors group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:">
                    <Icon className="h-5 w-5 stroke-[2.5px] text-[var(--color-text)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest">{item.label}</p>
                    <p className="text-xs font-bold text-gray-500 mt-0.5 truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 stroke-[3px] text-[var(--color-text)] transition-transform group-hover:translate-x-1 flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {notificationPermission !== "unsupported" && (
        <div className="space-y-2 pt-4">
          <h2 className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest px-1">
            Device
          </h2>
          <div className="bg-[var(--color-surface)] border-2 border-[var(--color-border)] rounded-[16px] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className={`h-10 w-10 rounded-[10px] bg-[var(--color-surface)] border-2 border-[var(--color-border)]  flex items-center justify-center flex-shrink-0 transition-colors ${notificationPermission === "granted" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-text)]"}`}>
                  <Bell className={`h-5 w-5 stroke-[2.5px] ${notificationPermission === "granted" ? "text-white" : "text-[var(--color-text)]"}`} />
                </div>
                <div>
                  <p className="text-sm font-black text-[var(--color-text)] uppercase tracking-widest">Push Notifications</p>
                  <p className="text-xs font-bold text-gray-500 mt-0.5 truncate">
                    {notificationPermission === "granted" ? "Enabled for Reminders" : "Alerts for upcoming tasks"}
                  </p>
                </div>
              </div>
              
              {notificationPermission === "granted" ? (
                <div className="px-3 py-1.5 bg-emerald-100 border-2 border-emerald-500 text-emerald-600 text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#10b981]">
                  <CheckCircle2 className="h-4 w-4 stroke-[3px]" /> Active
                </div>
              ) : (
                <Button 
                  onClick={requestNotificationPermission}
                  variant="primary"
                  size="sm"
                >
                  Enable
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 pt-4">
        <h2 className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest px-1 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 stroke-[3px] text-red-500" />
          Security
        </h2>
        <div className="bg-red-50 border-2 border-red-500 rounded-[16px]  overflow-hidden">
          <button
            onClick={() => {
              if (confirm("Are you sure? This will delete all encrypted data in your vault and reset biometrics/PIN.")) {
                resetVault();
                alert("Vault has been reset.");
              }
            }}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-100 transition-colors text-left group"
          >
            <div className="h-10 w-10 rounded-[10px] bg-[var(--color-surface)] border-2 border-red-500 flex items-center justify-center flex-shrink-0  transition-colors group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:">
              <Lock className="h-5 w-5 stroke-[2.5px] text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-red-600 uppercase tracking-widest">Reset Vault</p>
              <p className="text-xs font-bold text-red-500/80 mt-0.5 truncate">Delete all secure notes and reset PIN</p>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-2 pt-4">
        <h2 className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest px-1 flex items-center gap-2">
          <Database className="w-4 h-4 stroke-[3px] text-red-500" />
          Developer Options
        </h2>
        <div className="bg-red-50 border-2 border-red-500 rounded-[16px]  overflow-hidden">
          <button
            onClick={async () => {
              if (confirm("WARNING: This will clear all local data, caches, and unregister Service Workers. You will be logged out. Are you absolutely sure?")) {
                localStorage.clear();
                sessionStorage.clear();
                
                try {
                  // Type assertion needed for TS as databases() is still experimental in some environments
                  const dbs = await (window.indexedDB as any).databases?.();
                  if (dbs) {
                    for (const db of dbs) {
                      if (db.name) window.indexedDB.deleteDatabase(db.name);
                    }
                  } else {
                    window.indexedDB.deleteDatabase("et_vault");
                    window.indexedDB.deleteDatabase("expense_tracker_db");
                  }
                } catch (e) {
                  console.error("Failed to clear IDB", e);
                }
                
                if ('serviceWorker' in navigator) {
                  const registrations = await navigator.serviceWorker.getRegistrations();
                  for (const registration of registrations) {
                    await registration.unregister();
                  }
                }
                
                if ('caches' in window) {
                  const cacheNames = await caches.keys();
                  for (const name of cacheNames) {
                    await caches.delete(name);
                  }
                }
                
                alert("App data cleared. Refreshing...");
                window.location.href = '/';
              }
            }}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-100 transition-colors text-left group"
          >
            <div className="h-10 w-10 rounded-[10px] bg-[var(--color-surface)] border-2 border-red-500 flex items-center justify-center flex-shrink-0  transition-colors group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:">
              <Trash2 className="h-5 w-5 stroke-[2.5px] text-red-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-red-600 uppercase tracking-widest">Factory Reset</p>
              <p className="text-xs font-bold text-red-500/80 mt-0.5 truncate">Clear all local storage, IDB, and caches</p>
            </div>
          </button>
        </div>
      </div>

      <AdaptiveOverlay 
        isOpen={activeModal === "currency"} 
        onClose={() => setActiveModal(null)} 
        title="Default Currency"
      >
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 mt-2">
          {SUPPORTED_CURRENCIES.map((c) => (
            <Button
              key={c}
              onClick={() => handleCurrencyChange(c)}
              variant={currency === c ? "primary" : "secondary"}
              className="w-full text-left justify-between"
            >
              <span>{c}</span>
              {currency === c && <div className="h-3 w-3 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)]" />}
            </Button>
          ))}
        </div>
      </AdaptiveOverlay>
    </div>
  );
}
