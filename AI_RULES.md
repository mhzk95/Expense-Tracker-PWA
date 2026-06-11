# AI Coding Conventions & Rules

## Core Principles
- Provide concise, modular, and reusable code.
- Prefer explicit over implicit.
- Leave comments explaining *why* something is done, not *what*.
- Strictly adhere to Next.js App Router conventions.

## Tech-Specific Rules
### React & Next.js
- Use React Server Components by default. Only use `'use client'` when state (`useState`, `useReducer`), lifecycle hooks (`useEffect`), or browser APIs are required.
- Use `framer-motion` for complex animations and page transitions.

### Styling
- Use TailwindCSS v4 utility classes.
- Use `clsx` and `tailwind-merge` for conditionally combining classes (e.g., `cn` utility function).
- Avoid inline styles.
- Design must look premium with subtle hover effects and smooth transitions.

### PWA & Offline-First
- Data fetching should prioritize the local IndexedDB (`idb`) cache first, fallback to network, and then update the cache.
- Service worker logic should use `serwist`.
- Handle offline gracefully in the UI (e.g., show "Offline mode" badges, disable online-only features).

### Database & Authentication
- Use Prisma client for all database operations.
- Ensure NextAuth sessions are securely verified on both Client (hooks) and Server (middleware/Server Components).
