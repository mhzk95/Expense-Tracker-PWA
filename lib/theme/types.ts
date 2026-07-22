import type { ReactNode } from "react";

export type IconName = 
  | "nav-home" 
  | "nav-transactions" 
  | "nav-journal" 
  | "nav-research" 
  | "nav-more"
  | "action-add"
  | "action-settings";

export type DecalSlot = 
  | "stat-card-tr" 
  | "page-bg" 
  | "bottom-nav-bg" 
  | "header-bg";

export type IconConfig = 
  | { type: "lucide"; name: string }
  | { type: "svg"; content: string };


export interface ThemeManifest {
  id: string;
  name: string;
  metadata: {
    author: string;
    version: string;
    type: "light" | "dark" | "system";
    description?: string;
  };
  
  // Phase 4: Semantic Design Language
  designLanguage?: {
    visualStyle: "brutalist" | "minimal" | "glassmorphism" | "cyberpunk" | "material";
    material: "solid" | "translucent" | "textured" | "glass";
    edgeTreatment: "sharp" | "rounded" | "pill";
    depth: "flat" | "elevated" | "layered";
  };

  // Phase 4: Component Presets
  componentPresets?: {
    button?: { variant: "neobrutalist" | "minimal" | "glass" | "outline" | "solid"; maskAsset?: string; backgroundAsset?: string; };
    card?: { variant: "elevated" | "flat" | "bordered" | "neobrutalist"; maskAsset?: string; backgroundAsset?: string; colorIntentMapping?: "background" | "border"; };
    navigation?: { variant: "floating" | "docked"; maskAsset?: string; backgroundAsset?: string; };
    badge?: { variant?: string; maskAsset?: string; backgroundAsset?: string; };
  };

  capabilities: {
    layoutDensity: "compact" | "comfortable" | "spacious";
    motion: "reduced" | "full";
  };
  tokens?: {
    colors: {
      background: string;
      surface: string;
      surfaceHover: string;
      text: string;
      border: string;
      primary?: string;
    };
    shapes: {
      radiusBase: string;
      radiusCard: string;
      radiusButton: string;
      radiusInput: string;
      borderWidth?: string;
      borderStyle?: string;
      clipPathCard?: string;
      clipPathButton?: string;
    };
    texture?: {
      blend?: string;
    };
  };
  typography?: {
    headingFontUrl?: string;
    headingFontFamily?: string;
    headingFontFormat?: string;
  };
  // Phase 4: Pure Asset Registry
  assets?: Record<string, { 
    type: "emoji" | "url" | "svg" | "pattern"; 
    content?: string; 
    src?: string; 
  }>;

  // Phase 4: Decorations (Styles applied to assets)
  decorations?: {
    appThemeBackground?: { assetRef: string; opacity?: number; blendMode?: string };
    pageBackground?: { assetRef: string; opacity?: number; blendMode?: string };
    cardTexture?: { assetRef: string; opacity?: number; blendMode?: string };
    topRight?: { assetRef: string; opacity?: number; rotation?: number; scale?: number };
    transactionAmountSplash?: { assetRef: string; maskAsset?: string; opacity?: number; blendMode?: string };
  };
  iconMap: Partial<Record<IconName, IconConfig>>;
}
