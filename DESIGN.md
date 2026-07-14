---
name: Expense Tracker
description: A space for all your personal things
colors:
  primary: "#8b5cf6"
  neutral-bg: "#020617"
  surface: "rgba(15, 23, 42, 0.45)"
  text-primary: "#ffffff"
  text-secondary: "#cbd5e1"
typography:
  display:
    fontFamily: "\"Inter\", sans-serif"
    fontSize: "2rem"
    lineHeight: "1.2"
  body:
    fontFamily: "\"Inter\", sans-serif"
    fontSize: "1rem"
    lineHeight: "1.6"
rounded:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  glass-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
---

# Design System: Expense Tracker

## 1. Overview

**Creative North Star: "The Minimalist Ledger"**

A highly functional, organized, and accessible interface built on clarity and consistent spacing. The aesthetic relies on an ambient, layered dark mode with tactile boundaries. The system prioritizes rapid task completion and clear hierarchy over decorative flair.

**Key Characteristics:**
- Tactile and confident components
- Ambient glows and glass layers for depth
- Minimal distractions
- Clean typography and scanning

## 2. Colors

A dark, focused canvas punctuated by vibrant accents.

### Primary
- **Vibrant Indigo** (#8b5cf6): Used for primary actions, active states, and ambient glows.

### Neutral
- **Deep Slate Canvas** (#020617): The foundational background color.
- **Glass Surface** (rgba(15, 23, 42, 0.45)): The core color for cards, panels, and forms.
- **Primary Text** (#ffffff): High-contrast text for critical reading.
- **Secondary Text** (#cbd5e1): Muted text for metadata and supporting details.

### Named Rules
**The Restraint Rule.** Usability always wins over visual appeal. Do not use gradients or heavy visual treatments where simple colors suffice.

## 3. Typography

**Display Font:** "Inter", sans-serif
**Body Font:** "Inter", sans-serif

**Character:** Clean, highly legible, and objective.

### Hierarchy
- **Display** (2rem, 1.2): Section headers and primary numbers.
- **Headline** (1.5rem, 1.3): Sub-sections and card titles.
- **Body** (1rem, 1.6): Standard reading copy.
- **Label** (0.875rem, 1.4): Metadata and supporting UI text.
- **Micro** (0.75rem, 1.2): Tertiary data and timestamps.

### Named Rules
**The Information Hierarchy Rule.** Typography must establish clear importance without relying on color alone.

## 4. Elevation

The system uses ambient glows and layered glassmorphism to establish depth without heavy drop shadows.

### Shadow Vocabulary
- **Card Glow** (`0 0 30px -5px rgba(139, 92, 246, 0.15)`): Used on primary glass cards to lift them from the background.
- **Glass Inset** (`inset 0 1px 2px rgba(255, 255, 255, 0.15), inset 0 -1px 2px rgba(0, 0, 0, 0.4)`): Creates the physical edge of glass panels.

### Named Rules
**The Ambient Layering Rule.** Shadows should feel like colored ambient light rather than harsh structural drop shadows.

## 5. Components

### Cards / Containers
- **Corner Style:** Rounded (1rem)
- **Background:** Glass Surface
- **Shadow Strategy:** Ambient card glow and glass inset borders.

### Buttons & Inputs
- **Style:** Tactile boundaries with clear border contrast against the background.
- **Focus:** Strong ring or glow (e.g. `0 0 15px rgba(139, 92, 246, 0.15)`).

## 6. Do's and Don'ts

### Do:
- **Do** prioritize clarity and efficient task completion.
- **Do** ensure WCAG 2.1 AA alignment for text contrast and touch targets.

### Don't:
- **Don't** use Dribbble-style showcases or heavily decorative UIs.
- **Don't** create cluttered, trend-driven interfaces (excessive gradients, neumorphism, oversized cards).
- **Don't** hide important information behind unnecessary interactions.
- **Don't** build social media-style feeds where visual content competes for attention.
