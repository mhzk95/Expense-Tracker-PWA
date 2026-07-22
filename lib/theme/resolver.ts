import type { ThemeManifest } from "./types";
import {
  ButtonStyle,
  CardStyle,
  InputStyle,
  BadgeStyle,
  NavigationStyle,
} from "./style-types";

/**
 * Determines the visual variant for a component based on the active theme manifest.
 * It prioritizes componentPresets, falling back to designLanguage heuristics.
 */
export function getVisualVariant(manifest: ThemeManifest, componentName: "button" | "card" | "input" | "navigation" | "badge"): string {
  // @ts-ignore - Some presets like badge might not be formally in types yet
  const presetVariant = manifest.componentPresets?.[componentName]?.variant;
  if (presetVariant) return presetVariant;
  
  // Fallback to design language
  const visualStyle = manifest.designLanguage?.visualStyle || "brutalist";
  
  if (visualStyle === "brutalist") return "neobrutalist";
  if (visualStyle === "minimal") return "minimal";
  if (visualStyle === "glassmorphism") return "glass";
  
  return "neobrutalist"; // Safe default preserving existing look
}

export function resolveButton(manifest: ThemeManifest, variant: string, semanticVariant: string): ButtonStyle {
  const base: ButtonStyle = {
    geometry: { edgeTreatment: "rounded", borderWidth: "none" },
    surface: { material: "solid", depth: "flat", colorIntent: semanticVariant as any },
    interaction: { hover: "opacity", pressed: "shrink" },
    typography: { weight: "bold", casing: "normal" }
  };

  if (variant === "neobrutalist") {
    base.geometry.edgeTreatment = "sharp";
    base.geometry.borderWidth = "thick";
    base.interaction.hover = "lift";
    base.interaction.pressed = "sink";
  } else if (variant === "minimal") {
    base.geometry.edgeTreatment = "rounded";
    base.surface.depth = "elevated";
    base.interaction.hover = "lift";
  } else if (variant === "glass") {
    base.geometry.edgeTreatment = "pill";
    base.surface.material = "glass";
    base.surface.depth = "layered";
    base.interaction.hover = "highlight";
  } else if (variant === "outline") {
    base.geometry.borderWidth = "thin";
    base.surface.material = "flat";
    base.interaction.hover = "highlight";
  }

  // Override from manifest design language if specified
  if (manifest.designLanguage?.edgeTreatment) {
    base.geometry.edgeTreatment = manifest.designLanguage.edgeTreatment;
  }
  if (manifest.designLanguage?.material) {
    base.surface.material = manifest.designLanguage.material as any;
  }
  if (manifest.componentPresets?.button?.maskAsset) {
    base.surface.maskAsset = manifest.componentPresets.button.maskAsset;
  }
  
  if (manifest.assets?.[`bg-button-${semanticVariant}`]) {
    base.surface.backgroundAsset = `bg-button-${semanticVariant}`;
  } else if (manifest.assets?.[`bg-card-${semanticVariant}`]) {
    // Fallback to card asset if button-specific asset is missing
    base.surface.backgroundAsset = `bg-card-${semanticVariant}`;
  } else if (manifest.componentPresets?.button?.backgroundAsset) {
    base.surface.backgroundAsset = manifest.componentPresets.button.backgroundAsset;
  }

  return base;
}

export function resolveCard(manifest: ThemeManifest, variant: string, isInteractive: boolean, semanticVariant: string = "surface"): CardStyle {
  const base: CardStyle = {
    geometry: { edgeTreatment: "rounded", borderWidth: "none" },
    surface: { material: "solid", depth: "flat", colorIntent: semanticVariant as any },
    interaction: { hover: isInteractive ? "highlight" : "none", pressed: isInteractive ? "sink" : "none" },
    decoration: {}
  };

  if (manifest.componentPresets?.card?.colorIntentMapping === "border") {
    base.geometry.borderColorIntent = semanticVariant as any;
    base.surface.colorIntent = "surface"; // Reset background to default dark/surface
  }

  if (variant === "neobrutalist") {
    base.geometry.edgeTreatment = "sharp";
    base.geometry.borderWidth = "thick";
    if (isInteractive) base.interaction.hover = "lift";
  } else if (variant === "elevated") {
    base.surface.depth = "elevated";
    if (isInteractive) base.interaction.hover = "lift";
  } else if (variant === "bordered") {
    base.geometry.borderWidth = "thin";
  } else if (variant === "flat") {
    base.surface.depth = "flat";
  }

  if (manifest.designLanguage?.edgeTreatment) {
    base.geometry.edgeTreatment = manifest.designLanguage.edgeTreatment;
  }
  if (manifest.designLanguage?.material) {
    base.surface.material = manifest.designLanguage.material as any;
  }
  if (manifest.componentPresets?.card?.maskAsset) {
    base.surface.maskAsset = manifest.componentPresets.card.maskAsset;
  }

  if (manifest.assets?.[`bg-card-${semanticVariant}`]) {
    base.surface.backgroundAsset = `bg-card-${semanticVariant}`;
  } else if (manifest.componentPresets?.card?.backgroundAsset) {
    base.surface.backgroundAsset = manifest.componentPresets.card.backgroundAsset;
  }
  
  if (manifest.decorations?.cardTexture) {
    base.decoration.overlay = manifest.decorations.cardTexture.assetRef;
  }
  if (manifest.decorations?.topRight) {
    base.decoration.cornerDecal = manifest.decorations.topRight.assetRef;
  }

  return base;
}

export function resolveInput(manifest: ThemeManifest, variant: string): InputStyle {
  const base: InputStyle = {
    geometry: { edgeTreatment: "rounded", borderWidth: "thin" },
    surface: { material: "solid", depth: "flat", colorIntent: "surface" },
    interaction: { hover: "none", pressed: "none" },
    placeholderOpacity: "medium"
  };

  if (variant === "neobrutalist") {
    base.geometry.edgeTreatment = "sharp";
    base.geometry.borderWidth = "thick";
    base.placeholderOpacity = "high";
  }

  if (manifest.designLanguage?.edgeTreatment) {
    base.geometry.edgeTreatment = manifest.designLanguage.edgeTreatment;
  }

  return base;
}

export function resolveBadge(manifest: ThemeManifest, variant: string): BadgeStyle {
   const base: BadgeStyle = {
     geometry: { edgeTreatment: "pill", borderWidth: "thin" },
     surface: { material: "solid", depth: "flat", colorIntent: "surface" },
     interaction: { hover: "none", pressed: "none" },
     typography: { weight: "black", casing: "uppercase" }
   };
   
   if (variant === "neobrutalist") {
     base.geometry.edgeTreatment = "sharp";
     base.geometry.borderWidth = "thick";
   }

   if (manifest.designLanguage?.edgeTreatment) {
     base.geometry.edgeTreatment = manifest.designLanguage.edgeTreatment;
   }
   if (manifest.designLanguage?.material) {
     base.surface.material = manifest.designLanguage.material as any;
   }
   if (manifest.componentPresets?.badge?.maskAsset) {
     base.surface.maskAsset = manifest.componentPresets.badge.maskAsset;
   }
   if (manifest.componentPresets?.badge?.backgroundAsset) {
     base.surface.backgroundAsset = manifest.componentPresets.badge.backgroundAsset;
   }

   return base;
}

export function resolveNavigation(manifest: ThemeManifest, variant: string): NavigationStyle {
   const base: NavigationStyle = {
     geometry: { edgeTreatment: "pill", borderWidth: "thick" },
     surface: { material: "solid", depth: "elevated", colorIntent: "surface" },
     interaction: { hover: "none", pressed: "none" },
     layout: "floating"
   };

   if (variant === "docked") {
     base.layout = "docked";
     base.geometry.edgeTreatment = "sharp";
     base.geometry.borderWidth = "none";
     base.surface.depth = "flat";
   }

   if (manifest.designLanguage?.material) {
     base.surface.material = manifest.designLanguage.material as any;
   }
   if (manifest.componentPresets?.navigation?.maskAsset) {
     base.surface.maskAsset = manifest.componentPresets.navigation.maskAsset;
   }
   if (manifest.componentPresets?.navigation?.backgroundAsset) {
     base.surface.backgroundAsset = manifest.componentPresets.navigation.backgroundAsset;
   }
   
   return base;
}
