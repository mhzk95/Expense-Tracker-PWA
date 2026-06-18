"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

const ACCENTS = [
  { id: "violet", name: "Violet", hex: "#8b5cf6" },
  { id: "emerald", name: "Emerald", hex: "#10b981" },
  { id: "rose", name: "Rose", hex: "#f43f5e" },
  { id: "amber", name: "Amber", hex: "#f59e0b" },
  { id: "sky", name: "Sky", hex: "#0ea5e9" },
  { id: "indigo", name: "Indigo", hex: "#6366f1" },
];

export function AccentColorSelector() {
  const [activeAccent, setActiveAccent] = useState("violet");

  useEffect(() => {
    const savedAccent = localStorage.getItem("et_accent_color") || "violet";
    setActiveAccent(savedAccent);
  }, []);

  const handleAccentChange = (accentId: string) => {
    setActiveAccent(accentId);
    localStorage.setItem("et_accent_color", accentId);
    window.dispatchEvent(new Event("app:accent:changed"));
  };

  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1">
        Accent Color
      </h2>
      <div className="glass-card p-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACCENTS.map((accent) => {
            const isActive = activeAccent === accent.id;
            return (
              <button
                key={accent.id}
                onClick={() => handleAccentChange(accent.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-2.5 rounded-2xl transition-all duration-200 border border-white/5",
                  isActive ? "bg-white/5 shadow-md" : "hover:bg-slate-800/30"
                )}
              >
                {/* Color Dot */}
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center transition-transform duration-200 active:scale-95 shadow-lg relative"
                  style={{
                    backgroundColor: accent.hex,
                    boxShadow: isActive ? `0 0 15px ${accent.hex}50` : "none",
                  }}
                >
                  {isActive && (
                    <Check className="h-4 w-4 text-slate-950 font-bold" strokeWidth={3.5} />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{accent.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
