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
} from "lucide-react";
import { AdaptiveOverlay } from "@/components/ui/AdaptiveOverlay";
import { SUPPORTED_CURRENCIES, STORAGE_KEYS } from "@/lib/constants/app";
import { ThemeSelector } from "@/components/settings/ThemeSelector";
import { CloudSyncSettings } from "@/components/settings/CloudSyncSettings";
import { TelegramSettings } from "@/components/settings/TelegramSettings";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currency, setCurrency] = useState("INR");
  const [activeModal, setActiveModal] = useState<"currency" | null>(null);

  useEffect(() => {
    const savedCurrency = localStorage.getItem(STORAGE_KEYS.CURRENCY) || "INR";
    setCurrency(savedCurrency);
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
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 overflow-hidden divide-y divide-slate-800/40">
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
                currency === c ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "bg-slate-900/60 text-white hover:bg-slate-800"
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
