# Accent Color Customization

## Problem
The Glassmorphism UI currently relies entirely on a hardcoded Violet primary accent color. For a premium, personalized PWA feel, the user should be able to select their preferred highlight/accent color dynamically.

## Goal
Introduce a customizable accent color configuration in Settings. Support multiple curated premium neon accents (Violet, Emerald, Rose, Amber, Sky, Indigo), applying it dynamically across all card glows, buttons, borders, and active theme highlights.

## Current State
- Accent properties `--color-primary`, `--color-primary-glow`, and `--color-primary-glow-hover` are hardcoded in `globals.css` to violet tones.
- Active states in settings are styled using static `border-violet-500` classes.

## Scope
1.  **Constants update**: Add `ACCENT_COLOR: "et_accent_color"` key to `STORAGE_KEYS`.
2.  **AppShell Bootstrap**: On initial render inside `AppShell`, read `et_accent_color` from `localStorage` and inject the properties:
    - `--color-primary`
    - `--color-primary-glow`
    - `--color-primary-glow-hover`
    into `document.documentElement.style`.
3.  **Accent Selector Component**: Create `components/settings/AccentColorSelector.tsx` to allow color picking.
4.  **Wire Settings**: Add `AccentColorSelector` to `app/settings/page.tsx` right next to the Theme selector.
5.  **Refactor Active States**: Update `ThemeSelector.tsx` and other settings elements to use style attributes or CSS variables (`var(--color-primary)`) instead of static Tailwind color classes.

## Files Changed
- `lib/constants/app.ts`
- `components/settings/AccentColorSelector.tsx` (New file)
- `components/settings/ThemeSelector.tsx`
- `app/settings/page.tsx`
- `components/app-shell/AppShell.tsx`

## Data Changes
Saved to local storage under `et_accent_color`.

## Decisions
- Curate 6 highly legible, vibrant color palettes matching dark mode Glassmorphism.
- Avoid rendering raw hex sliders to ensure colors maintain strict contrast requirements against text.

## Testing
- Verified default Violet fallback on initial boot.
- Selected Emerald, Rose, Amber, Sky, and Indigo accents and confirmed glow colors dynamically updated.
- Inspected active theme cards, active label text, and custom checkmarks to ensure they correctly track the active custom property variables.
- Verified local storage persists the chosen accent color across refreshes.

