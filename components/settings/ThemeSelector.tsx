"use client";

import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants/app";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

const THEMES = [
  { id: "dark", name: "Slate Dark", bg: "#020617", surface: "#0f172a", primary: "var(--color-primary)" },
  { id: "light", name: "Slate Light", bg: "#f8fafc", surface: "#ffffff", primary: "var(--color-primary)" },
  { id: "amoled", name: "AMOLED Black", bg: "#000000", surface: "#0a0a0a", primary: "var(--color-primary)" },
  { id: "navy", name: "Midnight Navy", bg: "#02040a", surface: "#0a0f1c", primary: "var(--color-primary)" },
  { id: "system", name: "Match System", bg: "linear-gradient(135deg, #f8fafc 50%, #020617 50%)", surface: "linear-gradient(135deg, #ffffff 50%, #0f172a 50%)", primary: "var(--color-primary)" },
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
  const [activeTheme, setActiveTheme] = useState("dark");
  const [accentHex, setAccentHex] = useState("#8b5cf6");

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
    setActiveTheme(savedTheme);

    const updateAccent = () => {
      const savedAccent = localStorage.getItem("et_accent_color") || "violet";
      setAccentHex(ACCENT_MAP[savedAccent] || "#8b5cf6");
    };
    updateAccent();
    window.addEventListener("app:accent:changed", updateAccent);
    return () => window.removeEventListener("app:accent:changed", updateAccent);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setActiveTheme(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    
    let isDark = newTheme === "dark" || newTheme === "amoled" || newTheme === "navy";
    if (newTheme === "system") {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
    }
    
    // Update PWA status bar dynamically
    const darkColor = "#020617";
    const lightColor = "#ffffff";
    const amoledColor = "#000000";
    const navyColor = "#02040a";
    
    let themeColor = lightColor;
    if (isDark) {
       themeColor = darkColor;
       if (newTheme === "amoled") themeColor = amoledColor;
       if (newTheme === "navy") themeColor = navyColor;
    }

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.removeAttribute("media");
      metaThemeColor.setAttribute("content", themeColor);
    }
  };

  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        Appearance
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {THEMES.map((theme) => {
          const isActive = activeTheme === theme.id;
          return (
            <button
              key={theme.id}
              onClick={() => handleThemeChange(theme.id)}
              className="flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-200 border-2"
              style={{
                borderColor: isActive ? "var(--color-primary)" : "transparent",
                backgroundColor: isActive ? "var(--color-primary-glow)" : "transparent",
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
                
                {/* Mock Content Card */}
                <div 
                  className="flex-1 rounded-lg p-2 flex flex-col gap-1.5 shadow-sm ring-1 ring-slate-500/10"
                  style={{ background: theme.surface }}
                >
                  <div className="w-3/4 h-1.5 rounded-full bg-slate-500/40" />
                  <div className="w-1/2 h-1.5 rounded-full bg-slate-500/20" />
                  <div className="mt-auto w-full h-1.5 rounded-full bg-slate-500/10" />
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
                className="text-[11px] font-medium tracking-wide transition-colors"
                style={{ color: isActive ? "var(--color-primary)" : undefined }}
              >
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="pt-6">
        <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider px-1 mb-3">
          Active Color Palette
        </h3>
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none px-1">
          {THEMES.find(t => t.id === activeTheme) && [
            { label: "Background", color: THEMES.find(t => t.id === activeTheme)!.bg.includes("linear-gradient") ? "#0f172a" : THEMES.find(t => t.id === activeTheme)!.bg },
            { label: "Surface", color: THEMES.find(t => t.id === activeTheme)!.surface.includes("linear-gradient") ? "#1e293b" : THEMES.find(t => t.id === activeTheme)!.surface },
            { label: "Primary", color: accentHex },
            { label: "Success", color: "#10b981" },
            { label: "Danger", color: "#ef4444" },
            { label: "Warning", color: "#f59e0b" },
          ].map((c) => (
            <div key={c.label} className="flex flex-col items-center gap-1.5 flex-shrink-0">
              <div 
                className="w-10 h-10 rounded-full shadow-inner ring-1 ring-white/10" 
                style={{ background: c.color }}
              />
              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">{c.label}</span>
              <span className="text-[8px] text-slate-500 font-mono">{c.color}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
