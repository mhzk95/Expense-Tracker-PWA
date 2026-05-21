/**
 * Settings page — Application configuration and preferences.
 * Phase 1: Static settings layout with grouped sections.
 */

"use client";

import { PageHeader } from "@/components/ui/PageHeader";
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
import { DropboxSettings } from "@/components/settings/DropboxSettings";

const SETTINGS_SECTIONS = [
  {
    title: "Preferences",
    items: [
      { id: "theme", label: "Appearance", description: "Dark / Light / System", icon: Palette },
      { id: "currency", label: "Default Currency", description: "USD — US Dollar", icon: Globe },
      { id: "notifications", label: "Notifications", description: "Budget alerts, reminders", icon: Bell },
    ],
  },
  {
    title: "Privacy & Security",
    items: [
      { id: "security", label: "Security", description: "PIN, biometrics", icon: Lock },
      { id: "data", label: "Data & Export", description: "Download your data as CSV", icon: Database },
    ],
  },
  {
    title: "Support",
    items: [
      { id: "help", label: "Help & FAQ", description: "Documentation and guides", icon: HelpCircle },
      { id: "about", label: "About ExpenseTracker", description: "Version 1.0.0 (Phase 1)", icon: Info },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Settings" subtitle="Preferences and configuration" />

      <DropboxSettings />

      {SETTINGS_SECTIONS.map((section) => (
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
    </div>
  );
}
