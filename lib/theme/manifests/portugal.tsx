import type { ThemeManifest } from "../types";

export const portugalTheme: ThemeManifest = {
  id: "portugal",
  name: "Portugal",
  metadata: { author: "System", version: "2.0", type: "dark", description: "Deep dark mode with green and red accents." },
  designLanguage: {
    visualStyle: "brutalist",
    material: "textured",
    edgeTreatment: "rounded",
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
      background: "#000000",
      surface: "#7e1e1e",
      surfaceHover: "#691717",
      text: "#ffffff",
      border: "#144b2a"
    },
    shapes: {
      radiusBase: "8px",
      radiusCard: "16px",
      radiusButton: "12px",
      radiusInput: "12px",
      borderWidth: "1px",
      borderStyle: "solid"
    },
    texture: {
      blend: "overlay"
    }
  },
  typography: {
    headingFontFamily: "'Impact', sans-serif"
  },
  assets: {
    "bg-noise-app": {
      type: "url",
      src: "data:image/svg+xml;utf8,<svg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"1.5\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.12\"/></svg>"
    },
    "bg-noise-card": {
      type: "url",
      src: "data:image/svg+xml;utf8,<svg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.1\"/></svg>"
    },
    "bg-emoji-shield": {
      type: "emoji",
      content: "🛡️"
    },
    "decal-por": {
      type: "emoji",
      content: "🇵🇹"
    }
  },
  decorations: {
    appThemeBackground: { assetRef: "bg-noise-app" },
    cardTexture: { assetRef: "bg-noise-card" },
    pageBackground: { assetRef: "bg-emoji-shield", opacity: 0.2, blendMode: "overlay" },
    topRight: { assetRef: "decal-por", opacity: 0.15, rotation: 12 }
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
