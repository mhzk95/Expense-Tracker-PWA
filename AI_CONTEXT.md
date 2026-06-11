# Expense Tracker PWA - Project Context

## Project Overview
Offline-first Progressive Web App (PWA) for expense tracking. Users can manage accounts, scan receipts via OCR, and securely store data offline. The app features biometric authentication and syncs data to a cloud database when online.

## Tech Stack
- **Framework**: Next.js 16.2.6 (App Router)
- **UI/Styling**: React 19, TailwindCSS v4, Framer Motion, Lucide React
- **Database/ORM**: PostgreSQL, Prisma (`@prisma/client`, `@prisma/adapter-pg`)
- **Authentication**: NextAuth (v4), Web Authentication API (Biometrics)
- **PWA & Offline Storage**: Serwist (`@serwist/next`, `@serwist/background-sync`), IndexedDB (`idb`)
- **Utilities**: `tesseract.js` (Receipt OCR), `date-fns` (Date formatting), `react-hot-toast` (Notifications)

## Architecture Decisions
- **Offline-First Strategy**: Uses `idb` to store data locally so the app is fully functional without an internet connection. Background Sync (Serwist) pushes changes to the cloud when connectivity is restored.
- **Biometric Security**: Replaced standard PIN/Password with Web Authentication API for secure vault access.
- **Interactive UI**: Utilizes Framer Motion for micro-interactions (e.g., 3D tilt effects on account cards).

## Current Status (As of June 2026)
- **Current Branch**: `feature/cloud-migration`
- **Current Focus**: Finalizing cloud data synchronization using NextAuth and Prisma, with background auto-sync functionality.
- **Pending/Unstaged Work**: Tweaking the sync toggle in the settings page (`app/settings/page.tsx`), updating the `cloudSync.ts` service, refining the global AppShell (`components/app-shell/AppShell.tsx`), and adjusting `public/sw.js` and the upload API route (`app/api/upload/route.ts`).
