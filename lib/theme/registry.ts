import { classicTheme } from "./manifests/classic";
import { argentinaTheme } from "./manifests/argentina";
import { portugalTheme } from "./manifests/portugal";
import { franceTheme } from "./manifests/france";
import { germanyTheme } from "./manifests/germany";
import { neonBrutalTheme } from "./manifests/neon-brutal";
import type { ThemeManifest } from "./types";

const registry: Record<string, ThemeManifest> = {
  classic: classicTheme,
  light: classicTheme,
  dark: classicTheme,
  argentina: argentinaTheme,
  portugal: portugalTheme,
  france: franceTheme,
  germany: germanyTheme,
  "neon-brutal": neonBrutalTheme,
};

export function getThemeManifest(themeId: string): ThemeManifest {
  return registry[themeId] || classicTheme;
}
