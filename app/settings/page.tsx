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
import { SUPPORTED_CURRENCIES, STORAGE_KEYS } from "@/lib/constants/app";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { CloudSyncSettings } from "@/components/settings/CloudSyncSettings";
import { TelegramSettings } from "@/components/settings/TelegramSettings";
import { CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { resetVault } = useVault();
  const [currency, setCurrency] = useState("INR");
  const [activeModal, setActiveModal] = useState<"currency" | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
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
          description: currency, 
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

      {session && <TelegramSettings />}

      <ThemeSelector />

      {getSectionItems().map((section) => (
        <div key={section.title} className="space-y-1 pt-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">
            {section.title}
          </h2>
          <div className="glass-card divide-y divide-white/5">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`settings-${item.id}-btn`}
                  onClick={() => setActiveModal(item.id as "currency")}
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-800/40 transition-colors text-left group"
                >
                  <div className="h-9 w-9 rounded-xl bg-slate-800/60 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-700/60 transition-colors">
                    <Icon className="h-4.5 w-4.5 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {notificationPermission !== "unsupported" && (
        <div className="space-y-1 pt-4">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">
            Device
          </h2>
          <div className="glass-card">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${notificationPermission === "granted" ? "bg-violet-500/20" : "bg-slate-800/60"}`}>
                  <Bell className={`h-4.5 w-4.5 ${notificationPermission === "granted" ? "text-violet-400" : "text-slate-400"}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Push Notifications</p>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {notificationPermission === "granted" ? "Enabled for Reminders" : "Alerts for upcoming tasks"}
                  </p>
                </div>
              </div>
              
              {notificationPermission === "granted" ? (
                <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-lg flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Active
                </div>
              ) : (
                <button 
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-xl transition-colors"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-1 pt-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4" />
          Security
        </h2>
        <div className="rounded-2xl border border-red-900/60 bg-red-950/20 overflow-hidden">
          <button
            onClick={() => {
              if (confirm("Are you sure? This will delete all encrypted data in your vault and reset biometrics/PIN.")) {
                resetVault();
                alert("Vault has been reset.");
              }
            }}
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-900/40 transition-colors text-left group"
          >
            <div className="h-9 w-9 rounded-xl bg-red-900/60 flex items-center justify-center flex-shrink-0 group-hover:bg-red-800/60 transition-colors">
              <Lock className="h-4.5 w-4.5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-400">Reset Vault</p>
              <p className="text-xs text-red-500 mt-0.5 truncate">Delete all secure notes and reset PIN</p>
            </div>
          </button>
        </div>
      </div>

      <div className="space-y-1 pt-4">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Developer Options
        </h2>
        <div className="rounded-2xl border border-red-900/60 bg-red-950/20 overflow-hidden">
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
            className="w-full flex items-center gap-4 px-5 py-4 hover:bg-red-900/40 transition-colors text-left group"
          >
            <div className="h-9 w-9 rounded-xl bg-red-900/60 flex items-center justify-center flex-shrink-0 group-hover:bg-red-800/60 transition-colors">
              <Trash2 className="h-4.5 w-4.5 text-red-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-400">Factory Reset</p>
              <p className="text-xs text-red-500 mt-0.5 truncate">Clear all local storage, IDB, and caches</p>
            </div>
          </button>
        </div>
      </div>

      <AdaptiveOverlay 
        isOpen={activeModal === "currency"} 
        onClose={() => setActiveModal(null)} 
        title="Default Currency"
      >
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {SUPPORTED_CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCurrencyChange(c)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-colors ${
                currency === c ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "glass-card text-white interactive"
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">{c}</span>
                {currency === c && <div className="h-2 w-2 rounded-full bg-violet-400" />}
              </div>
            </button>
          ))}
        </div>
      </AdaptiveOverlay>
    </div>
  );
}
