# Expense Tracker PWA

A production-grade, offline-first Progressive Web App (PWA) for personal finance tracking, memories journaling, and research notes. Designed with rich Glassmorphism aesthetics and built to prioritize client-side persistence and performance on mobile devices.

---

## 1. Architecture Summary

```mermaid
graph TD
    UI[React 19 / Next.js 16 UI] --> |Local Writes| IDB[(IndexedDB)]
    UI --> |NextAuth Session| Server[Next.js Server]
    IDB --> |Background Sync Queue| SW[Service Worker - Serwist]
    SW --> |Sync Request| API[Next.js API Routes]
    API --> |ORM| Prisma[Prisma / PostgreSQL]
    UI --> |Image Compression Canvas| Compressed[Compressed Blob ~300KB]
    Compressed --> |Sync/Upload| Telegram[Telegram CDN Bot]
```

### Key Pillars
- **Offline-First Storage**: Core operations write instantly to `IndexedDB` (`idb`). The UI operates 100% locally.
- **Background Sync**: A custom Service Worker (built with `serwist`) monitors network connectivity and syncs queued mutations back to the PostgreSQL database via Prisma when online.
- **Telegram Media CDN**: High-resolution images and audio notes are uploaded directly to a personal Telegram Bot API, eliminating standard cloud CDN storage costs.
- **PWA Security**: A hybrid authentication approach:
  - **Online**: NextAuth protects routes using JWT sessions.
  - **Offline**: An `OfflineAuthGuard` checks a local device-trust token stored in `localStorage` to allow offline usage without network roundtrips.
- **GPU Stability & Compression**: Off-screen HTML5 Canvas downscales and compresses raw mobile images to under 300KB before IndexedDB storage, preventing GPU/VRAM thrashing.

---

## 2. Directory Structure

```plaintext
├── app/                      # Next.js App Router Pages & API Routes
│   ├── api/                  # API endpoints (sync, upload, telegram, ocr)
│   ├── auth/                 # Login & Register views
│   └── (modules)/            # Transactions, Journal, Research, Vault, Settings
├── components/               # Shared & module-specific UI components
│   ├── app-shell/            # Main layout wraps and theme provider
│   ├── journal/              # Journal, audio recorders, and ambient graphics
│   └── ui/                   # Reusable premium Glassmorphic wrappers
├── hooks/                    # Custom React hooks (useTransactions, useJournal, etc.)
├── lib/                      # Services, db clients, repository interfaces
│   ├── db/                   # Repositories executing IndexedDB logic
│   └── services/             # Telegram upload, background sync workers
├── public/                   # Static assets, manifest, custom service worker
└── prisma/                   # Schema & migration scripts
```

---

## 3. Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL instance

### Local Setup
1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file in the root based on your cloud database and Telegram bot details:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/expensetracker"
   NEXTAUTH_SECRET="your-development-secret"
   TELEGRAM_BOT_TOKEN="your-bot-token"
   TELEGRAM_CHAT_ID="your-chat-id"
   ```
3. Initialize the database schema:
   ```bash
   npx prisma db push
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 4. Key Workflows

### Background Auto-Sync Flow
1. User creates or edits records offline.
2. The mutation is saved locally to IDB and pushed to the sync queue.
3. The Serwist service worker listens to network state changes.
4. When online, the sync queue is flushed, pushing changes back to `/api/sync/actions`.

### Canvas Compression Flow
1. User selects a 12MP high-res photo.
2. Image is loaded into an off-screen HTML5 Canvas.
3. Aspect ratio is preserved while capping width/height at 1280px.
4. Exported as a compressed `image/jpeg` at 80% quality.
5. Saved locally to IndexedDB as a lightweight Blob before uploading.
