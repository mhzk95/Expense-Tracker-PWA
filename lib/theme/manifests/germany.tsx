import type { ThemeManifest } from "../types";
import { classicTheme } from "./classic";

export const germanyTheme: ThemeManifest = {
  id: "germany",
  name: "Germany",
  metadata: { author: "System", version: "2.0", type: "light" },
  designLanguage: {
    visualStyle: "minimal",
    material: "solid",
    edgeTreatment: "rounded",
    depth: "flat"
  },
  componentPresets: {
    button: { variant: "solid" },
    card: { variant: "bordered" },
    navigation: { variant: "floating" }
  },
  capabilities: { layoutDensity: "comfortable", motion: "full" },
  tokens: {
    colors: {
      background: "#e2e8f0",
      surface: "#ffffff",
      surfaceHover: "#f1f5f9",
      text: "#000000",
      border: "#000000"
    },
    shapes: {
      radiusBase: "12px",
      radiusCard: "24px",
      radiusButton: "20px",
      radiusInput: "18px",
      borderWidth: "3px",
      borderStyle: "solid"
    }
  },
  iconMap: classicTheme.iconMap,
  assets: {},
  decorations: {}
};
