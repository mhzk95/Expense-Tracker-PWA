# Technical Debt & Refactoring Backlog

Tracked improvements, shortcuts, and code cleanup plans.

---

## 1. WebAuthn Error Handling & Pin Fallback

### Reason
Currently, if WebAuthn biometrics fails (e.g., browser incompatibility or user cancels prompt), vault access is blocked. We need a reliable passcode/PIN fallback.

### Expected Impact
Eliminates lockouts for vault access when biometric drivers fail or are unavailable.

### Estimated Effort
**Low** (approx. 2-3 hours)

---

## 2. IndexedDB Orphan Blob Cleanup

### Reason
When journal entries with attached images or audio recordings are deleted, the entry is deleted from the standard store, but the actual compressed media Blob might remain cached in the client-side binary store.

### Expected Impact
Aggressive garbage collection prevents storage leaks on user devices.

### Estimated Effort
**Low** (approx. 1 hour)

---

## 3. Standardize Repository Custom Hooks

### Reason
We read and write to IndexedDB repositories inside custom hooks (`useTransactions`, `useJournal`, etc.), but some repos contain duplicate code for sync state generation. 

### Expected Impact
Clean codebase, centralized mutation triggers, and unified error handling.

### Estimated Effort
**Medium** (approx. 4-6 hours)

---

## 4. Capture Worker-Level Thread Crashes

### Reason
The service worker (`sw.js`) handles asset caching and push notifications. If a crash or fetch drop occurs in `sw.js` itself, it runs outside the main window thread context and won't trigger standard logging.

### Expected Impact
Gives complete coverage of service worker thread issues.

### Estimated Effort
**Low** (approx. 2 hours)

