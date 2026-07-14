"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/helpers";

const ACCENTS = [
  { id: "violet", name: "Violet", hex: "#8b5cf6" },
  { id: "emerald", name: "Emerald", hex: "#10b981" },
  { id: "rose", name: "Rose", hex: "#f43f5e" },
  { id: "amber", name: "Amber", hex: "#f59e0b" },
  { id: "sky", name: "Cyan", hex: "#00f2fe" },
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
    <div className="space-y-2 pt-4">
      <h2 className="text-[10px] font-black text-black uppercase tracking-widest px-1">
        Accent Color
      </h2>
      <div className="bg-white border-[3px] border-black rounded-[16px] shadow-[4px_4px_0px_0px_#000] p-4">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {ACCENTS.map((accent) => {
            const isActive = activeAccent === accent.id;
            return (
              <button
                key={accent.id}
                onClick={() => handleAccentChange(accent.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-[12px] transition-all border-2",
                  isActive ? "bg-gray-100 border-black shadow-[2px_2px_0px_0px_#000] translate-x-[-2px] translate-y-[-2px]" : "border-transparent hover:border-black hover:shadow-[2px_2px_0px_0px_#000]"
                )}
              >
                {/* Color Dot */}
                <div
                  className="h-10 w-10 rounded-[8px] border-2 border-black flex items-center justify-center transition-transform active:scale-95 relative shadow-[2px_2px_0px_0px_#000]"
                  style={{
                    backgroundColor: accent.hex,
                  }}
                >
                  {isActive && (
                    <Check className="h-5 w-5 text-white font-bold stroke-[3px]" />
                  )}
                </div>
                <span className={`text-[10px] uppercase font-black tracking-widest mt-1 ${isActive ? "text-black" : "text-gray-500"}`}>{accent.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
