"use client";

import React from "react";
import { useTheme } from "@/components/providers/ThemeProvider";
import type { DecalSlot } from "@/lib/theme/types";
import { cn } from "@/lib/utils/helpers";

interface ThemeDecalProps {
  slot: DecalSlot;
  className?: string; // Additional classes for the container
}

export function ThemeDecal({ slot, className }: ThemeDecalProps) {
  const { manifest } = useTheme();
  
  // Phase 4: Decorations & Pure Assets
  if (manifest.decorations && manifest.assets) {
    if (slot === "page-bg" && manifest.decorations.pageBackground) {
      const deco = manifest.decorations.pageBackground;
      const bg = manifest.assets[deco.assetRef];
      if (!bg) return null;

      return (
        <div 
          className={cn("fixed inset-0 z-[-1] overflow-hidden pointer-events-none", className)}
          style={{ opacity: deco.opacity ?? 1, mixBlendMode: (deco.blendMode as any) || 'normal' }}
        >
          {bg.type === "emoji" && (
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[400px] blur-sm">
              {bg.content}
            </div>
          )}
          {bg.type === "url" && (
            <img src={bg.src} alt="" className="w-full h-full object-cover" />
          )}
        </div>
      );
    }

    if (slot === "stat-card-tr" && manifest.decorations.topRight) {
      const deco = manifest.decorations.topRight;
      const decal = manifest.assets[deco.assetRef];
      if (!decal) return null;

      return (
        <div 
          className={cn("absolute -top-6 -right-6 text-6xl pointer-events-none mix-blend-multiply", className)}
          style={{ 
            opacity: deco.opacity ?? 1, 
            transform: `rotate(${deco.rotation ?? 0}deg) scale(${deco.scale ?? 1})`
          }}
        >
          {decal.type === "emoji" && decal.content}
          {decal.type === "svg" && (
            <div dangerouslySetInnerHTML={{ __html: decal.content || "" }} />
          )}
          {decal.type === "url" && (
            <img src={decal.src} alt="" className="w-24 h-24 object-contain drop-shadow-sm" />
          )}
        </div>
      );
    }
  }

  return null;
}
