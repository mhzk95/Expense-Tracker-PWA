import type { ThemeManifest } from "../types";
import { classicTheme } from "./classic";

export const franceTheme: ThemeManifest = {
  id: "france",
  name: "France",
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
      background: "#002654",
      surface: "#ffffff",
      surfaceHover: "#f1f5f9",
      text: "#002654",
      border: "#ed2939"
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
