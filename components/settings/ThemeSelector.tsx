"use client";

import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants/app";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/helpers";
import { useTheme } from "@/components/providers/ThemeProvider";

const THEMES = [
  { id: "light", name: "Classic", icon: "🏛️", bg: "#fdfbf7", surface: "#ffffff", primary: "var(--color-primary)" },
  { id: "argentina", name: "Argentina", icon: "🇦🇷", bg: "#1c2738", surface: "#0a1128", primary: "#74acdf" },
  { id: "portugal", name: "Portugal", icon: "🇵🇹", bg: "#000000", surface: "#7e1e1e", primary: "#144b2a" },
  { id: "france", name: "France", icon: "🇫🇷", bg: "#002654", surface: "#ffffff", primary: "#ed2939" },
  { id: "germany", name: "Germany", icon: "🇩🇪", bg: "#e2e8f0", surface: "#ffffff", primary: "#dd0000" },
  { id: "neon-brutal", name: "Neon Brutal", icon: "⚡", bg: "#0f1014", surface: "#16181d", primary: "#fde047" },
];

const ACCENT_MAP: Record<string, string> = {
  violet: "#8b5cf6",
  emerald: "#10b981",
  rose: "#f43f5e",
  amber: "#f59e0b",
  sky: "#0ea5e9",
  indigo: "#6366f1",
};

export function ThemeSelector() {
  const { theme: activeTheme, setTheme } = useTheme();
  const [accentHex, setAccentHex] = useState("#8b5cf6");

  useEffect(() => {
    const updateAccent = () => {
      const savedAccent = localStorage.getItem("et_accent_color") || "violet";
      setAccentHex(ACCENT_MAP[savedAccent] || "#8b5cf6");
    };
    updateAccent();
    window.addEventListener("app:accent:changed", updateAccent);
    return () => window.removeEventListener("app:accent:changed", updateAccent);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    
    // Update PWA status bar dynamically
    const themeColor = THEMES.find(t => t.id === newTheme)?.bg || "#fdfbf7";
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.removeAttribute("media");
      metaThemeColor.setAttribute("content", themeColor);
    }
  };

  return (
    <div className="space-y-2 pt-4">
      <h2 className="text-[10px] font-black text-[var(--color-text)] uppercase tracking-widest px-1">
        Appearance
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((theme) => {
          const isActive = activeTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className="flex flex-col items-center gap-2 p-3 bg-[var(--color-surface)] rounded-[16px] transition-all border-2 border-[var(--color-border)]"
              style={{
                borderColor: isActive ? "var(--color-primary)" : "black",
                boxShadow: isActive ? "4px 4px 0px 0px var(--color-primary)" : "2px 2px 0px 0px #000",
                transform: isActive ? "translate(-2px, -2px)" : "none",
              }}
            >
              {/* Preview Card */}
              <div 
                className="w-full aspect-[4/3] rounded-xl p-2.5 flex flex-col gap-2 relative overflow-hidden shadow-sm ring-1 ring-slate-800/50"
                style={{ background: theme.bg }}
              >
                {/* Mock Header */}
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full opacity-90" style={{ background: theme.primary }} />
                  <div className="h-1.5 w-10 rounded-full bg-slate-500/30" />
                </div>
                
                <div 
                  className="flex-1 rounded-lg p-2 flex flex-col gap-1.5 shadow-sm ring-1 ring-slate-500/10 items-center justify-center relative"
                  style={{ background: theme.surface }}
                >
                  <span className="text-3xl opacity-80 absolute">{theme.icon}</span>
                  <div className="w-3/4 h-1.5 rounded-full bg-slate-500/40 relative z-10 opacity-30" />
                  <div className="w-1/2 h-1.5 rounded-full bg-slate-500/20 relative z-10 opacity-30" />
                  <div className="mt-auto w-full h-1.5 rounded-full bg-slate-500/10 relative z-10 opacity-30" />
                </div>

                {/* Active checkmark overlay */}
                {isActive && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                    <div 
                      className="h-6 w-6 rounded-full text-slate-950 flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: "var(--color-primary)" }}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                    </div>
                  </div>
                )}
              </div>

              {/* Label */}
              <span 
                className="text-[10px] font-black uppercase tracking-widest transition-colors mt-1"
                style={{ color: isActive ? "var(--color-primary)" : "black" }}
              >
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pt-6">
        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1 mb-3">
          Active Color Palette
        </h3>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none px-1">
          {THEMES.find(t => t.id === activeTheme) && [
            { label: "Background", color: THEMES.find(t => t.id === activeTheme)!.bg },
            { label: "Surface", color: THEMES.find(t => t.id === activeTheme)!.surface },
            { label: "Primary", color: THEMES.find(t => t.id === activeTheme)!.primary },
            { label: "Success", color: "#6ee7b7" },
            { label: "Danger", color: "#fca5a5" },
            { label: "Warning", color: "#fcd34d" },
          ].map((c) => (
            <div key={c.label} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div 
                className="w-10 h-10 rounded-full border-[3px] border-[var(--color-border)] shadow-[2px_2px_0px_0px_var(--color-border)]" 
                style={{ background: c.color }}
              />
              <span className="text-[9px] font-black text-[var(--color-text)] uppercase tracking-widest">{c.label}</span>
              <span className="text-[8px] font-bold text-gray-500 font-mono">{c.color}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
