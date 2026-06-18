# Changelog

All notable changes to the Expense Tracker PWA.

---

## [2026-06-18] Reorganized Architecture & Persistent Aesthetics

### Added
- **Auth-First PWA Guard**: Created `middleware.ts` for server-side NextAuth protection and `OfflineAuthGuard.tsx` client-side wrapper checking `et_device_trusted` token to safely support offline operations without compromising security.
- **Global Ambient Background**: Refactored `AmbientBackground` to be globally mounted in `AppShell` and utilize path-based CSS opacity transitions. This stops the particles from resetting and jumping back to their starting position when navigating between routes.
- **Private Diagnostics System**: Implemented `errorLogger.ts` and updated IndexedDB schema (version 11) to log background sync queue drops, Telegram uploads, and network faults. Created a detailed "System Diagnostics" panel in Settings with expanding log stacktraces and manual synchronization triggers.
- **Dynamic Accent Color Customization**: Created `AccentColorSelector.tsx` offering 6 premium palettes (Violet, Emerald, Rose, Amber, Sky, Indigo). Accent variables are injected dynamically on boot in `AppShell` and update all UI highlights, glows, checkmarks, theme preview outlines, and active page states.



---

## [2026-06-17] Canvas Compression & UI Stabilization

### Added
- **HTML5 Canvas Compression**: Created off-screen image compression pipeline in `JournalForm.tsx` to downscale huge images to 1280px and compress them to 80% JPEG quality before saving them to IndexedDB.
- **Hardware Isolation**: Added `transform-gpu` and `will-change-transform` style tags to image renderers to resolve browser compositing crashes against Glassmorphism blur effects.

---

## [2026-06-15] Media CDN & Background Sync

### Added
- **Telegram Bot API CDN**: Implemented `app/api/upload/route.ts` using Telegram Bot endpoints to upload and host images and audio recordings for free.
- **Background Auto-Sync**: Configured Serwist service worker background synchronization queue to automatically sync IndexedDB operations when network connection recovers.

---

## [Legacy] Foundations & Security

### Added
- **Biometric Authentication**: Replaced legacy PIN code security with Web Authentication API (WebAuthn) for secure vault entry.
- **3D Accounts Cards**: Implemented responsive mouse-guided 3D parallax hover effect on bank card components.
- **OCR Transaction Scan**: Integrated `tesseract.js` receipt text scanning pipeline.
