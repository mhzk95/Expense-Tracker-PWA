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
1. **Dashboard (`/`)**: Overview of finances.
2. **Transactions (`/transactions`)**: Track income and expenses.
3. **Analytics (`/analytics`)**: Trends and insights.
4. **Accounts (`/accounts`)**: Bank accounts and cards management (uses `accountsRepository.ts`).
5. **Categories (`/categories`)**: Manage income/expense categories (uses `categoriesRepository.ts`).
6. **Journal (`/journal`)**: Memories and life events (uses `journalRepository.ts`).
7. **Vault (`/vault`)**: Secure, encrypted passwords and notes.
8. **Settings (`/settings`)**: App preferences, Theme, Currency (INR default), and third-party integrations (e.g., Dropbox sync).

## Recent Integrations & Context
- **Telegram Service**: Code in `lib/services/telegram.ts` suggests integration with Telegram for alerts or tracking.
- **Dropbox Settings**: Code in `components/settings/DropboxSettings.tsx` indicates remote backup/sync features.
- **PWA Features**: Bottom navigation is explicitly supported via `ENABLE_APP_SHELL_FOR_MOBILE_DEVICE_BROWSER = true`.

## How to Work on this Project
- **Styling**: Always use TailwindCSS and `lucide-react` icons. Maintain the modern, responsive design.
- **Data Layer**: All core data operations should go through the repository patterns in `lib/db/` (e.g., `accountsRepository`, `categoriesRepository`, `journalRepository`).
- **Hooks**: Use custom hooks (`hooks/useTransactions.ts`, `hooks/useAccounts.ts`) to interact with the data layer from UI components.

> **Note for AI Agents**: Always refer to this document first when starting a new session to regain context about the project architecture and ongoing development.
