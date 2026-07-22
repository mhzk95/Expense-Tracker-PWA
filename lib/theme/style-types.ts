export interface GeometryStyle {
  edgeTreatment: "sharp" | "rounded" | "pill";
  borderWidth: "none" | "thin" | "thick";
  borderColorIntent?: "primary" | "secondary" | "danger" | "ghost" | "surface" | "success" | "warning";
}

export interface SurfaceStyle {
  material: "solid" | "glass" | "flat" | "textured" | "bordered";
  depth: "flat" | "elevated" | "layered";
  colorIntent: "primary" | "secondary" | "danger" | "ghost" | "surface" | "background";
  maskAsset?: string;
  backgroundAsset?: string;
}

export interface InteractionStyle {
  hover: "none" | "lift" | "highlight" | "opacity";
  pressed: "none" | "sink" | "shrink";
  focus?: "none" | "ring" | "brutal-shift";
}

export interface BaseComponentStyle {
  geometry: GeometryStyle;
  surface: SurfaceStyle;
  interaction: InteractionStyle;
}

export interface TypographyStyle {
  weight: "normal" | "bold" | "black";
  casing: "normal" | "uppercase";
}

export interface ButtonStyle extends BaseComponentStyle {
  typography: TypographyStyle;
}

export interface CardDecorationStyle {
  overlay?: string; // e.g. texture asset ref
  cornerDecal?: string; // e.g. emoji asset ref
}

export interface CardStyle extends BaseComponentStyle {
  decoration: CardDecorationStyle;
}

export interface InputStyle extends BaseComponentStyle {
  placeholderOpacity: "low" | "medium" | "high";
}

export interface NavigationStyle extends BaseComponentStyle {
  layout: "floating" | "docked";
}

export interface BadgeStyle extends BaseComponentStyle {
  typography: TypographyStyle;
}
