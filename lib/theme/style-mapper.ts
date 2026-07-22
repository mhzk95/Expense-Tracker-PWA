import { GeometryStyle, SurfaceStyle, InteractionStyle, TypographyStyle } from "./style-types";

export function getGeometryClasses(geo: GeometryStyle): string {
  const shapes = {
    sharp: "rounded-none",
    rounded: "rounded-[var(--theme-radius-base,8px)]",
    pill: "rounded-full"
  };
  const borders = {
    none: "border-transparent",
    thin: "border border-[var(--theme-border,var(--color-border))]",
    thick: "border-[length:var(--theme-border-width,3px)] border-[var(--theme-border-style,solid)] border-[var(--theme-border,var(--color-border))]"
  };

  if (geo.borderColorIntent) {
    const borderColors: Record<string, string> = {
      primary: "border-[var(--color-primary)]",
      success: "border-[#22c55e]", // Tailwind green-500 equivalent
      danger: "border-[#ef4444]", // Tailwind red-500
      warning: "border-[#eab308]", // Tailwind yellow-500
      secondary: "border-[var(--theme-border)]",
      ghost: "border-transparent",
      surface: "border-[var(--theme-border)]",
    };
    borders.thin = `border ${borderColors[geo.borderColorIntent]}`;
    borders.thick = `border-[length:var(--theme-border-width,3px)] border-[var(--theme-border-style,solid)] ${borderColors[geo.borderColorIntent]}`;
  }

  return `${shapes[geo.edgeTreatment]} ${borders[geo.borderWidth]}`;
}

export function getSurfaceClasses(surf: SurfaceStyle): string {
  const depths = {
    flat: "",
    elevated: "shadow-sm",
    layered: "shadow-md"
  };

  const bgColors: Record<string, string> = {
    primary: "bg-[var(--theme-primary,var(--color-primary))] text-white",
    secondary: "bg-[var(--theme-surface,var(--color-surface))] text-[var(--theme-text,var(--color-text))]",
    danger: "bg-red-500 text-white",
    ghost: "bg-transparent text-[var(--theme-text,var(--color-text))]",
    surface: "bg-[var(--theme-surface,var(--color-surface))] text-[var(--theme-text,var(--color-text))]",
    background: "bg-[var(--theme-bg,var(--color-background))] text-[var(--theme-text,var(--color-text))]"
  };

  if (surf.material === "glass") {
    return `backdrop-blur-md bg-white/10 ${depths[surf.depth]}`;
  }
  
  if (surf.material === "flat") {
     const flatColors: Record<string, string> = {
        primary: "bg-transparent text-[var(--theme-primary,var(--color-primary))]",
        secondary: "bg-transparent text-[var(--theme-text,var(--color-text))]",
        danger: "bg-transparent text-red-500",
        ghost: "bg-transparent text-[var(--theme-text,var(--color-text))]",
        surface: "bg-transparent text-[var(--theme-text,var(--color-text))]",
        background: "bg-transparent text-[var(--theme-text,var(--color-text))]"
     };
     return `${flatColors[surf.colorIntent]} ${depths[surf.depth]}`;
  }

  if (surf.material === "textured") {
    const texturedColors: Record<string, string> = {
      primary: "bg-[var(--theme-primary,var(--color-primary))] text-black",
      secondary: "bg-[var(--theme-surface,var(--color-surface))] text-[var(--theme-text,var(--color-text))]",
      danger: "bg-[var(--color-danger)] text-white",
      surface: "bg-[var(--theme-surface,var(--color-surface))] text-[var(--theme-text,var(--color-text))]",
    };
    return `${texturedColors[surf.colorIntent] || texturedColors.surface} ${depths[surf.depth]}`;
  }

  return `${bgColors[surf.colorIntent] || bgColors.surface} ${depths[surf.depth]}`;
}

export function getInteractionClasses(int: InteractionStyle, isBrutalistContext: boolean = false): string {
  const hovers = {
    none: "",
    lift: "hover:-translate-y-0.5 hover:shadow-md transition-all",
    highlight: "hover:bg-[var(--theme-surface-hover,var(--color-surface-hover))] transition-colors",
    opacity: "hover:opacity-90 transition-opacity"
  };
  const presses = {
    none: "",
    sink: "active:translate-y-0.5 active:shadow-none transition-all",
    shrink: "active:scale-95 transition-transform"
  };
  
  if (isBrutalistContext && int.hover === "lift" && int.pressed === "sink") {
     return "hover:-translate-y-0.5 hover:-translate-x-0.5 hover:shadow-brutal-sm active:translate-y-0 active:translate-x-0 active:shadow-none transition-all";
  }

  return `${hovers[int.hover]} ${presses[int.pressed]}`;
}

export function getTypographyClasses(typo: TypographyStyle): string {
  const weights = {
    normal: "font-normal",
    bold: "font-bold",
    black: "font-black"
  };
  const casings = {
    normal: "normal-case",
    uppercase: "uppercase tracking-wider"
  };
  return `${weights[typo.weight]} ${casings[typo.casing]}`;
}
