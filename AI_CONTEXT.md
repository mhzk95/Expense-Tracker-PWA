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
- **Interactive UI (Glassmorphism & Luminescence)**: Utilizes Framer Motion for micro-interactions, responsive luminescent glow borders, and dynamic ambient background particles while ensuring GPU stability by hardware-accelerating media components.
- **Client-Side Media Compression**: Implemented Canvas-based image downscaling (1280px max) and 80% JPEG compression before saving to IDB to prevent mobile GPU VRAM thrashing and drastically optimize storage and cloud sync.
- **PWA Share Target**: Supports native OS-level sharing capabilities allowing users to clip text, links, and files directly from other mobile apps into the Research/Journal module.
- **Telegram CDN Storage**: Uses a personal Telegram Bot backend for entirely free, unlimited media storage (images and audio notes) instead of relying on expensive cloud storage limits.

## Current Status
- **Current Branch**: `main`
- **Recent Implementations**: 
  - Stabilized GPU rendering across Glassmorphic components.
  - Resolved PWA background sync block by lifting restrictive NextAuth barriers on the Telegram `/api/upload` endpoint for local-first operations.
  - Implemented Client-Side Image Compression.
  - Integrated Audio Recording and playback in Journal entries.
- **Current Focus**: Refining overall app architecture, code maintainability, and exploring robust authentication-first flows.
