"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils/helpers";

interface ThemeDecalProps {
  slot: "stat-card-tr" | "page-bg" | "bottom-nav-bg" | "header-bg";
  className?: string;
}

export function ThemeDecal({ slot, className }: ThemeDecalProps) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.getAttribute("data-theme") || "light");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    setTheme(document.documentElement.getAttribute("data-theme") || "light");
    return () => observer.disconnect();
  }, []);

  // For phase 1, we will render specific placeholder crests/graphics based on the theme
  // In a real app, this might be an SVG or WebP URL loaded dynamically.

  if (!["argentina", "brazil", "portugal", "france", "germany"].includes(theme)) return null;

  if (slot === "stat-card-tr") {
    let content = "";
    if (theme === "argentina") content = "🇦🇷";
    if (theme === "brazil") content = "🇧🇷";
    if (theme === "portugal") content = "🇵🇹";
    
    return (
      <div className={cn("absolute -top-4 -right-2 text-6xl opacity-[0.15] rotate-12 pointer-events-none mix-blend-overlay", className)}>
        {content || "🏆"}
      </div>
    );
  }
  
  if (slot === "page-bg") {
    // Renders a massive background decal that sits behind everything
    return (
      <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden opacity-20 mix-blend-overlay">
         {/* We will map specific SVG patterns or giant emojis here for now */}
         <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] blur-sm">
            {theme === "brazil" && "⚽"}
            {theme === "argentina" && "⭐"}
            {theme === "portugal" && "🛡️"}
         </div>
      </div>
    );
  }

  return null;
}
