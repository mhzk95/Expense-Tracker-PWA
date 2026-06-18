# Features & Module Index

Status matrix and architectural dependencies for all key modules.

---

## 1. Core Modules

### Dashboard (`/`)
- **Status**: Production-ready.
- **Functionality**: Multi-account balance view, monthly income/expense distribution charts, recent transaction summaries.
- **Dependencies**: `idb` (local storage), `framer-motion` (animations).

### Transactions (`/transactions`)
- **Status**: Production-ready.
- **Functionality**: Create, edit, and delete transactions with swipe gestures.
- **Decisions**: Uses category-specific color-matched borders. Live synced with cloud.
- **Dependencies**: `useTransactions` hook, `SwipeToDelete` component.

### Accounts & Cards (`/accounts`)
- **Status**: Production-ready.
- **Functionality**: Managing bank accounts, physical and virtual cards.
- **Decisions**: Custom 3D interactive cards with mouse-based parallax tilt effect.
- **Dependencies**: `accountsRepository.ts`.

### Categories (`/categories`)
- **Status**: Production-ready.
- **Functionality**: Custom categories with color picker.
- **Decisions**: Color selections determine card glow animations across transactions and filters.
- **Dependencies**: `categoriesRepository.ts`.

### Journal (`/journal`)
- **Status**: Production-ready.
- **Functionality**: Log memories with photos, audio notes, and map pin location metadata.
- **Decisions**:
  - Replaced heavy `exifr` parsing with Canvas compression to resolve UI blocking.
  - Implemented HTML5 Canvas pre-compression (max 1280px, 80% JPEG quality) to prevent GPU VRAM exhaustion.
- **Dependencies**: `useJournal` hook, off-screen Canvas, `TelegramLazyImage`.

### Research (`/research`)
- **Status**: Production-ready.
- **Functionality**: Web clipping inbox, notes folder structure, search.
- **Decisions**: Linked with the native PWA Share Target to receive items directly from other mobile apps.
- **Dependencies**: `fuse.js` (fuzzy search), `share-target` API.

### Reminders (`/reminders`)
- **Status**: Production-ready.
- **Functionality**: Calendar-based scheduling, critical push notices.
- **Decisions**: Integrates a "Red Alert" UI state dynamically changing screen glow when critical tasks are past due.
- **Dependencies**: Local Push Notification service worker.

### Vault (`/vault`)
- **Status**: Production-ready.
- **Functionality**: Encrypted passwords and notes.
- **Decisions**: Integrated Web Authentication API (WebAuthn) for secure biometric/passkey vault unlocks.
- **Dependencies**: WebAuthn browser APIs.

### Settings (`/settings`)
- **Status**: Production-ready.
- **Functionality**: Theme switcher, Accent color customizer, Dropbox Backup, Sync toggles, System Diagnostics feed.
- **Dependencies**: `ThemeSelector`, `AccentColorSelector`, `DiagnosticsSettings` components.

---

## 2. Infrastructure & System Integrations

### Telegram Media CDN
- **Status**: Active.
- **Purpose**: Uploads media blobs using `/api/upload` to a personal Telegram bot channel to serve as a cost-freeCDN.
- **Decisions**: Bypassed NextAuth session requirements for PWA upload actions since background service workers don't maintain active NextAuth cookies.

### Offline Auth Guard
- **Status**: Active.
- **Purpose**: Redirects unauthenticated PWA users to `/auth/login`.
- **Decisions**: Creates a local storage token `et_device_trusted = true` upon validation to allow offline app launches without failing server checks.

### System Diagnostics & Error Logger
- **Status**: Active.
- **Purpose**: Provides visibility into background sync tasks, network drops, and image/audio uploads.
- **Decisions**: Stores logs locally (IndexedDB version 11) with a strict 100-log retention limit. Includes manual sync and log clear triggers inside Settings.
- **Dependencies**: `errorLogger.ts`, `DiagnosticsSettings` component.

