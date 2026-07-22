import type { ThemeManifest } from "../types";

const svgHalftone = `data:image/svg+xml;utf8,<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><circle cx="2" cy="2" r="1.5" fill="%23000000" opacity="0.4"/><circle cx="12" cy="12" r="1.5" fill="%23000000" opacity="0.4"/></svg>`;

export const neonBrutalTheme: ThemeManifest = {
  id: "neon-brutal",
  name: "Neon Brutalism",
  metadata: { 
    author: "System", 
    version: "1.0", 
    type: "dark", 
    description: "Gamified, high-contrast dark neo-brutalism with tactical neon accents and halftone shadows." 
  },
  designLanguage: {
    visualStyle: "brutalist",
    material: "solid",
    edgeTreatment: "rounded",
    depth: "elevated"
  },
  componentPresets: {
    button: { variant: "neobrutalist", backgroundAsset: "bg-neon-yellow" },
    card: { variant: "neobrutalist", colorIntentMapping: "border" },
    navigation: { variant: "floating" },
    input: { variant: "bordered" }
  },
  capabilities: { layoutDensity: "comfortable", motion: "full" },
  tokens: {
    colors: {
      background: "#0a0b10", // Very dark navy/grey void
      surface: "#131620", // Slightly lighter for cards
      surfaceHover: "#1c212e",
      text: "#ffffff",
      border: "#334155", // Subtle gray border
      primary: "#facc15" // Yellow primary for buttons and active states
    },
    shapes: {
      radiusBase: "16px",
      radiusCard: "20px",
      radiusButton: "12px",
      radiusInput: "16px",
      borderStyle: "solid",
      borderWidth: "2px"
    }
  },
  typography: {
    headingFontFamily: "'Oswald', sans-serif",
    bodyFontFamily: "'Inter', sans-serif"
  },
  assets: {
    "bg-neon-yellow": {
      type: "url",
      src: "/assets/themes/neon-brutal/neon_matte_yellow.png"
    },
    "bg-halftone-shadow": {
      type: "url",
      src: svgHalftone
    },
    "bg-noise-matte": {
      type: "url",
      src: "data:image/svg+xml;utf8,<svg width=\"100\" height=\"100\" viewBox=\"0 0 100 100\" xmlns=\"http://www.w3.org/2000/svg\"><filter id=\"noise\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"1.5\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"100\" height=\"100\" filter=\"url(%23noise)\" opacity=\"0.03\"/></svg>"
    }
  },
  decorations: {
    pageBackground: { assetRef: "bg-noise-matte" }
  },
  iconMap: {
    "nav-home": { type: "lucide", name: "LayoutDashboard" },
    "nav-transactions": { type: "lucide", name: "ArrowLeftRight" },
    "nav-journal": { type: "lucide", name: "BookImage" },
    "nav-research": { type: "lucide", name: "Target" },
    "nav-more": { type: "lucide", name: "Menu" },
    "action-add": { type: "lucide", name: "Plus" },
    "action-settings": { type: "lucide", name: "Settings" }
  }
};
