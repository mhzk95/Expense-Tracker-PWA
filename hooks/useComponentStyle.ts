import { useTheme } from "@/components/providers/ThemeProvider";
import { 
  getVisualVariant, 
  resolveButton, 
  resolveCard, 
  resolveInput,
  resolveBadge,
  resolveNavigation
} from "@/lib/theme/resolver";
import {
  ButtonStyle,
  CardStyle,
  InputStyle,
  BadgeStyle,
  NavigationStyle,
} from "@/lib/theme/style-types";

export function useComponentStyle(
  component: "button", 
  options: { semanticVariant?: string }
): ButtonStyle;

export function useComponentStyle(
  component: "card", 
  options?: { isInteractive?: boolean; semanticVariant?: string }
): CardStyle;

export function useComponentStyle(
  component: "input",
  options?: Record<string, never>
): InputStyle;

export function useComponentStyle(
  component: "badge",
  options?: Record<string, never>
): BadgeStyle;

export function useComponentStyle(
  component: "navigation",
  options?: Record<string, never>
): NavigationStyle;

export function useComponentStyle(
  component: "button" | "card" | "input" | "badge" | "navigation", 
  options: any = {}
): any {
  const { manifest } = useTheme();
  
  const visualVariant = getVisualVariant(manifest, component as any);

  if (component === "button") {
    return resolveButton(manifest, visualVariant, options.semanticVariant || "primary");
  }
  
  if (component === "card") {
    return resolveCard(manifest, visualVariant, options.isInteractive || false, options.semanticVariant);
  }

  if (component === "input") {
    return resolveInput(manifest, visualVariant);
  }

  if (component === "badge") {
    return resolveBadge(manifest, visualVariant);
  }

  if (component === "navigation") {
    return resolveNavigation(manifest, visualVariant);
  }

  return {};
}
