"use client";

import { useState, useEffect } from "react";
import { STORAGE_KEYS } from "@/lib/constants/app";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

const THEMES = [
  { id: "dark", name: "Slate Dark", bg: "#020617", surface: "#0f172a", primary: "#8b5cf6" },
  { id: "light", name: "Slate Light", bg: "#f8fafc", surface: "#ffffff", primary: "#8b5cf6" },
  { id: "amoled", name: "AMOLED Black", bg: "#000000", surface: "#0a0a0a", primary: "#8b5cf6" },
  { id: "navy", name: "Midnight Navy", bg: "#02040a", surface: "#0a0f1c", primary: "#8b5cf6" },
  { id: "system", name: "Match System", bg: "linear-gradient(135deg, #f8fafc 50%, #020617 50%)", surface: "linear-gradient(135deg, #ffffff 50%, #0f172a 50%)", primary: "#8b5cf6" },
];

export function ThemeSelector() {
  const [activeTheme, setActiveTheme] = useState("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
    setActiveTheme(savedTheme);
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setActiveTheme(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    
    if (newTheme === "system") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
    } else {
      document.documentElement.setAttribute("data-theme", newTheme);
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
              className={cn(
                "flex flex-col items-center gap-2 p-2 rounded-2xl transition-all duration-200 border-2",
                isActive 
                  ? "border-violet-500 bg-violet-500/10" 
                  : "border-transparent hover:bg-slate-800/40"
              )}
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
                    <div className="h-6 w-6 rounded-full bg-violet-500 text-white flex items-center justify-center shadow-lg">
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>

              {/* Label */}
              <span className={cn(
                "text-[11px] font-medium tracking-wide",
                isActive ? "text-violet-400" : "text-slate-400"
              )}>
                {theme.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
