"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { STORAGE_KEYS } from "@/lib/constants/app";
import { getThemeManifest } from "@/lib/theme/registry";
import type { ThemeManifest } from "@/lib/theme/types";

interface ThemeContextValue {
  theme: string;
  setTheme: (theme: string) => void;
  manifest: ThemeManifest;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState("light");

  const applyManifestCss = (manifest: ThemeManifest) => {
    // Clear all inline theme variables first (optional, but good for cleanup)
    // Wait, setting them is enough since they overwrite, but what if a theme doesn't define one?
    // We should rely on standard CSS for fallbacks, so we only set what's in the manifest.
    // 1. Compile Tokens (Semantic)
    if (manifest.tokens) {
      const { colors, shapes, texture } = manifest.tokens;
      if (colors) {
        document.documentElement.style.setProperty("--theme-bg", colors.background);
        document.documentElement.style.setProperty("--theme-surface", colors.surface);
        document.documentElement.style.setProperty("--theme-surface-hover", colors.surfaceHover);
        document.documentElement.style.setProperty("--theme-text", colors.text);
        document.documentElement.style.setProperty("--theme-border", colors.border);
        if (colors.primary) document.documentElement.style.setProperty("--theme-primary", colors.primary);
      }
      if (shapes) {
        document.documentElement.style.setProperty("--theme-radius-base", shapes.radiusBase);
        document.documentElement.style.setProperty("--theme-radius-card", shapes.radiusCard);
        document.documentElement.style.setProperty("--theme-radius-btn", shapes.radiusButton);
        document.documentElement.style.setProperty("--theme-radius-input", shapes.radiusInput);
        if (shapes.borderWidth) document.documentElement.style.setProperty("--theme-border-width", shapes.borderWidth);
        if (shapes.borderStyle) document.documentElement.style.setProperty("--theme-border-style", shapes.borderStyle);
        if (shapes.clipPathCard) document.documentElement.style.setProperty("--theme-clip-path-card", shapes.clipPathCard);
        if (shapes.clipPathButton) document.documentElement.style.setProperty("--theme-clip-path-btn", shapes.clipPathButton);
      }
      if (texture?.blend) {
        document.documentElement.style.setProperty("--theme-texture-blend", texture.blend);
      }
    }

    // Phase 4: Decorations & Pure Assets
    if (manifest.decorations && manifest.assets) {
      if (manifest.decorations.appThemeBackground) {
        const asset = manifest.assets[manifest.decorations.appThemeBackground.assetRef];
        if (asset?.type === "url") {
          document.documentElement.style.setProperty("--theme-bg-app", `url('${asset.src}')`);
        } else {
          document.documentElement.style.removeProperty("--theme-bg-app");
        }
      } else {
        document.documentElement.style.removeProperty("--theme-bg-app");
      }

      if (manifest.decorations.cardTexture) {
        const asset = manifest.assets[manifest.decorations.cardTexture.assetRef];
        if (asset?.type === "url") {
          document.documentElement.style.setProperty("--theme-bg-card", `url('${asset.src}')`);
        } else {
          document.documentElement.style.removeProperty("--theme-bg-card");
        }
      } else {
        document.documentElement.style.removeProperty("--theme-bg-card");
      }
    } else {
        document.documentElement.style.removeProperty("--theme-bg-app");
        document.documentElement.style.removeProperty("--theme-bg-card");
    }

    // Dynamic Typography Loading
    if (manifest.typography?.headingFontUrl && manifest.typography?.headingFontFamily) {
      const fontId = `theme-font-${manifest.id}`;
      if (!document.getElementById(fontId)) {
        if (manifest.typography.headingFontUrl.includes('fonts.googleapis.com')) {
           const link = document.createElement('link');
           link.id = fontId;
           link.rel = 'stylesheet';
           link.href = manifest.typography.headingFontUrl;
           document.head.appendChild(link);
        } else {
           const style = document.createElement('style');
           style.id = fontId;
           style.innerHTML = `
             @font-face {
               font-family: '${manifest.typography.headingFontFamily.replace(/['"]/g, '')}';
               src: url('${manifest.typography.headingFontUrl}') format('${manifest.typography.headingFontFormat || 'truetype'}');
               font-weight: normal;
               font-style: normal;
               font-display: swap;
             }
           `;
           document.head.appendChild(style);
        }
      }
    }
    // Set base fonts if defined, using internal theme vars to prevent circular references in tailwind v4
    if (manifest.typography?.headingFontFamily) {
      document.documentElement.style.setProperty("--font-theme-display", `'${manifest.typography.headingFontFamily.replace(/['"]/g, '')}', sans-serif`);
      document.documentElement.style.setProperty("--font-theme-numbers", `'${manifest.typography.headingFontFamily.replace(/['"]/g, '')}', sans-serif`);
    }
    if (manifest.typography?.bodyFontFamily) {
      document.documentElement.style.setProperty("--font-theme-body", `'${manifest.typography.bodyFontFamily.replace(/['"]/g, '')}', sans-serif`);
    }
  };

  useEffect(() => {
    // Initial load
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || "dark";
    setThemeState(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
    
    // Inject CSS variables for the initial theme
    applyManifestCss(getThemeManifest(savedTheme));
  }, []);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    
    // Inject CSS variables for the new theme
    applyManifestCss(getThemeManifest(newTheme));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, manifest: getThemeManifest(theme) }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
