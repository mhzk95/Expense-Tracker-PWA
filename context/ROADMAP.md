# Project Roadmap

Strategic roadmap for future enhancement iterations.

---

## 1. High Priority (Immediate Iterations)

### Sync Diagnostics Dashboard (`/pwa-diagnostics` extension)
- **Goal**: Add a full diagnostics interface under Settings or a dedicated route so users can monitor the local sync queue status.
- **Features**:
  - Total pending mutations count.
  - Log console showcasing background worker activity.
  - Manual "Sync Now" button.
  - Delete local sync cache / hard reset sync states.

### List Virtualization
- **Goal**: Maintain 60FPS scrolling across all screens.
- **Features**:
  - Integrate `@tanstack/react-virtual` in `/journal` and `/transactions` feeds.
  - Drastically reduces DOM element count when historical entries scale to 1000+.

---

## 2. Medium Priority (User Experience)

### Accent Color Customization
- **Goal**: Allow customization of the Glassmorphic neon theme.
- **Features**:
  - Color wheel in Settings.
  - Modifies `--color-primary` CSS variable dynamically.
  - Theme choices persisted in `localStorage`.

### Web Crypto IDB Encryption
- **Goal**: Secure financial data at rest on client devices.
- **Features**:
  - Generate a local encryption key bound to biometric auth.
  - Encrypt transaction notes and amounts using AES-GCM before writing to IndexedDB.

---

## 3. Low Priority (Future Ideas)

### AI-Driven OCR Parse
- **Goal**: Swap local `tesseract.js` OCR engine (which extracts raw text) for structured LLM parsing.
- **Features**:
  - Pass receipt photo to a serverless function utilizing a lightweight LLM.
  - Automatically parse Merchant, Date, Total, and Tax into a structured JSON payload for auto-filling transactions.
