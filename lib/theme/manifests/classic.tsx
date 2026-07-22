import type { ThemeManifest } from "../types";

export const classicTheme: ThemeManifest = {
  id: "classic",
  name: "Classic",
  metadata: { author: "System", version: "2.0", type: "light", description: "The original Neo-Brutalist default theme." },
  designLanguage: {
    visualStyle: "brutalist",
    material: "solid",
    edgeTreatment: "rounded",
    depth: "elevated"
  },
  componentPresets: {
    button: { variant: "neobrutalist" },
    card: { variant: "neobrutalist" },
    navigation: { variant: "floating" }
  },
  capabilities: { layoutDensity: "comfortable", motion: "full" },
  tokens: {
    colors: {
      background: "#fdfbf7",
      surface: "#ffffff",
      surfaceHover: "#f3f4f6",
      text: "#000000",
      border: "#000000",
      primary: "#8b5cf6"
    },
    shapes: {
      radiusBase: "12px",
      radiusCard: "24px",
      radiusButton: "20px",
      radiusInput: "18px",
      borderWidth: "3px",
      borderStyle: "solid",
      clipPathCard: "none",
      clipPathButton: "none"
    },
    texture: {
      blend: "normal"
    }
  },
  iconMap: {
    "nav-home": { type: "lucide", name: "LayoutDashboard" },
    "nav-transactions": { type: "lucide", name: "ArrowLeftRight" },
    "nav-journal": { type: "lucide", name: "BookImage" },
    "nav-research": { type: "lucide", name: "Target" },
    "nav-more": { type: "lucide", name: "Menu" },
    "action-add": { type: "lucide", name: "Wallet" },
    "action-settings": { type: "lucide", name: "Settings" },
  },
  assets: {},
  decorations: {}
};
