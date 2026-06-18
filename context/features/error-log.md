# Private Error Logging & Diagnostics System

## Problem
In a Progressive Web App (PWA) running offline-first, unexpected errors (e.g., failed API fetches, background sync conflicts, Telegram media upload drops) occur silently inside background sync hooks, service workers, or repository threads. Without a diagnostics portal, debugging production mobile behavior is a blind spot.

## Goal
Establish a lightweight, local-first logging system that persists operational logs directly inside IndexedDB. Introduce a Diagnostics settings view to trace logs, inspect sync failures, and trigger manual retries.

## Current State
- The app handles errors by outputting `console.error` logs, which are lost when the page refreshes or when running in service worker contexts.
- Sync queue items that fail remain in the sync queue state but don't output accessible structural diagnostics to the user interface.

## Scope
1.  **DB Schema Upgrade**: Introduce `error_logs` table in IndexedDB (version 11).
2.  **Logger Service**: Implement `errorLogger.ts` utility to add logs, enforce a maximum limit of 100 entries, and handle log cleanup.
3.  **Integrate Error Captures**: Connect the logger to `cloudSync.ts` (sync failures), `telegram.ts` / `/api/upload` (media failures), and general catch hooks.
4.  **Diagnostics UI**: Add an interactive "Diagnostics" section to `/settings` showcasing total error counts, live logs with expand/details views, manual synchronization triggers, and log clearance actions.

## Files Changed
- `lib/db/indexeddb.ts`
- `lib/services/errorLogger.ts` (New file)
- `lib/services/cloudSync.ts`
- `app/settings/page.tsx`

## Data Changes
IndexedDB version upgraded to `11`.
Added `error_logs` object store:
```typescript
export interface ErrorLogEntity {
  id: string;
  timestamp: number;
  feature: string;
  operation: string;
  level: "info" | "warning" | "error";
  message: string;
  details?: string;
}
```

## Decisions
- **Retention**: Keep a strict 100-log maximum on client storage. Each time a log is added, the logger deletes older entries to prevent IDB bloating.
- **Diagnostics Accessibility**: Maintain a simple UI grid inside the existing Glassmorphic settings view.

## Edge Cases
- **Sync Loops**: Ensure logging a sync failure does not trigger another sync action that itself fails, creating an infinite recursive sync loop.

## Testing
- Verified DB upgrade to version 11 runs successfully on boot.
- Verified logger service truncates older logs once entry count exceeds 100 limit.
- Simulated network failure to trigger and verify manual retry sync alerts.
- Verified clear logs action purges all IndexedDB log entries successfully.

## Future Improvements
- Add custom event listeners inside the service worker (`sw.js`) to capture worker-level thread crashes and route them to `error_logs`.

