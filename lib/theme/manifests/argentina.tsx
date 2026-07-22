import type { ThemeManifest } from "../types";

export const argentinaTheme: ThemeManifest = {
  id: "argentina",
  name: "Argentina",
  metadata: { author: "System", version: "2.0", type: "dark", description: "Aggressive, high-contrast dark mode with sharp edges." },
  designLanguage: {
    visualStyle: "brutalist",
    material: "solid",
    edgeTreatment: "sharp",
    depth: "flat"
  },
  componentPresets: {
    button: { variant: "neobrutalist" },
    card: { variant: "neobrutalist" },
    navigation: { variant: "floating" }
  },
  capabilities: { layoutDensity: "comfortable", motion: "full" },
  tokens: {
    colors: {
      background: "#1c2738",
      surface: "#0a1128",
      surfaceHover: "#121c38",
      text: "#ffffff",
      border: "#74acdf"
    },
    shapes: {
      radiusBase: "0px",
      radiusCard: "0px",
      radiusButton: "0px",
      radiusInput: "0px",
      borderStyle: "solid",
      borderWidth: "3px"
    }
  },
  typography: {
    headingFontFamily: "'Impact', sans-serif"
  },
  assets: {
    "bg-noise-card": {
      type: "url",
      src: "data:image/svg+xml;utf8,<svg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"1\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.05\"/></svg>"
    },
    "bg-emoji-star": {
      type: "emoji",
      content: "⭐"
    },
    "decal-arg": {
      type: "emoji",
      content: "🇦🇷"
    }
  },
  decorations: {
    cardTexture: { assetRef: "bg-noise-card" },
    pageBackground: { assetRef: "bg-emoji-star", opacity: 0.2, blendMode: "overlay" },
    topRight: { assetRef: "decal-arg", opacity: 0.15, rotation: 12 }
  },
  iconMap: {
    "nav-home": { type: "lucide", name: "LayoutDashboard" },
    "nav-transactions": { type: "lucide", name: "ArrowLeftRight" },
    "nav-journal": { type: "lucide", name: "BookImage" },
    "nav-research": { type: "lucide", name: "Target" },
    "nav-more": { type: "lucide", name: "Menu" },
    "action-add": { type: "lucide", name: "Wallet" },
    "action-settings": { type: "lucide", name: "Settings" }
  }
};
