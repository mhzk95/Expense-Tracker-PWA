# Expense Tracker PWA Context

## Project Overview
This project is a production-grade Expense Tracker Progressive Web App (PWA). It is designed to work seamlessly on both desktop and mobile web environments, utilizing IndexedDB for local data persistence and potentially external services (like Dropbox and Telegram) for synchronization and notifications.

## Tech Stack
- **Framework:** Next.js 16 (React 19)
- **Styling:** TailwindCSS v4 with `clsx` and `tailwind-merge`
- **Icons:** `lucide-react`
- **Database/Storage:** `idb` (IndexedDB for client-side storage)
- **Service Worker / PWA:** `@serwist/next`
- **Utilities:** `date-fns` for date manipulation

## Key Features & Modules
1. **Dashboard (`/`)**: Overview of finances and recent transactions.
2. **Transactions (`/transactions`)**: Track income and expenses with category tagging.
3. **Analytics (`/analytics`)**: Spending trends and insights.
4. **Accounts (`/accounts`)**: Bank accounts and cards management.
5. **Categories (`/categories`)**: Manage income/expense categories with personalized colors.
6. **Journal (`/journal`)**: Memories, life events, photo uploads, and audio recordings.
7. **Research (`/research`)**: Web clippings and note taking. Functions as a native PWA Share Target to receive URLs/content from other apps.
8. **Reminders (`/reminders`)**: Schedule recurring payments and notification alerts.
9. **Vault (`/vault`)**: Secure, encrypted passwords and sensitive notes (Biometric-backed).
10. **Settings (`/settings`)**: App preferences, Theme, Currency (INR default), and third-party integrations (Dropbox sync).

## Recent Integrations & Context
- **Telegram Service (`lib/services/telegram.ts`)**: Integrated as a completely free, unlimited CDN for saving high-resolution images and audio recordings securely. 
- **Dropbox Settings (`components/settings/DropboxSettings.tsx`)**: Daily JSON backups and remote sync.
- **UI Architecture**: Deeply integrated Glassmorphism styling with Framer Motion ambient background particles and hardware-accelerated (`transform-gpu`) media rendering.
- **Client-Side Optimization**: Custom Canvas pipeline compresses local images to ~300KB locally before IDB storage to prevent mobile VRAM thrashing and accelerate sync.
- **PWA Features**: Bottom navigation is explicitly supported via `ENABLE_APP_SHELL_FOR_MOBILE_DEVICE_BROWSER = true`. Service worker (`sw.js` via Serwist) handles offline caching and Push Notifications.

## How to Work on this Project
- **Styling**: Always use TailwindCSS and `lucide-react` icons. Maintain the modern, responsive design.
- **Data Layer**: All core data operations should go through the repository patterns in `lib/db/` (e.g., `accountsRepository`, `categoriesRepository`, `journalRepository`).
- **Hooks**: Use custom hooks (`hooks/useTransactions.ts`, `hooks/useAccounts.ts`) to interact with the data layer from UI components.

> **Note for AI Agents**: Always refer to this document first when starting a new session to regain context about the project architecture and ongoing development.
