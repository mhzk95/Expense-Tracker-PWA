# AI Prompt Templates & Guides

Use these templates to prompt future AI agents when launching new features, making design improvements, or tracking down bug fixes.

---

## Template 1: Feature Integration Prompt

```markdown
Role: You are an expert Next.js and PWA developer.

Objective:
Implement a new feature: [Feature Title] (e.g., "Sync Diagnostics Dashboard").

Context & Guidelines:
1. Read `/context/README.md` and `/context/FEATURES.md` to understand the architecture.
2. Refer to the feature spec file at `/context/features/[feature-name].md` for tasks, files, and edge cases.
3. Adhere to the coding rules in `/context/archive/old-docs/AI_RULES.md` (React 19, Tailwind CSS v4, offline-first IndexedDB queries, serwist, hardware-accelerating media components).

Scope of Work:
[List the tasks here. Keep it to 3–7 items, e.g.]
1. Task One: Create diagnostic dashboard UI component.
2. Task Two: Build IndexedDB utility to read sync queue metadata.
3. Task Three: Connect the UI component with the new DB utility.
4. Task Four: Add manual sync trigger actions.

Execution Flow:
- Execute changes iteratively (one task at a time).
- After each task, run verification commands:
  - `npm run build`
  - `npx prisma generate` (if schema changes exist)
- Do not implement multiple large tasks in a single turn.

Deliverables:
- Implement code changes.
- Update `/context/FEATURES.md` with new feature status once completed.
- Log any discovered tech debt into `/context/TECH_DEBT.md`.
```

---

## Template 2: Code/Design Improvement Prompt

```markdown
Role: You are a premium frontend developer specializing in Glassmorphism and performance optimization.

Objective:
Optimize / Refactor: [Improvement Name] (e.g., "Standardize IDB Repository hooks").

Issue:
[Describe the code smell, performance bottleneck, or layout shift, e.g.]
"Custom repository hooks contain duplicate boilerplate code for generating sync states. We need to unify them to simplify future updates."

Technical Requirements:
1. Do not break offline-first behaviors.
2. Ensure GPU compatibility (avoid heavy nested `backdrop-blur` combinations).
3. Do not introduce bloated external dependencies.

Verification:
- Compile and build using `npm run build`.
- Verify the build finishes without any TypeScript errors.
```

---

## Template 3: Bug Fix Prompt

```markdown
Role: You are a debugging assistant specialized in Progressive Web Apps.

Objective:
Diagnose and resolve: [Bug Description] (e.g., "PWA upload fails with status 401 when offline").

Symptoms:
- [Describe what happens, where it fails, and under what conditions]
- Example: "Creating a journal entry on mobile PWA is not syncing photos to Telegram. Works fine when testing on local laptop."

Steps to Troubleshoot:
1. Check the relevant API endpoints (e.g., `/api/upload`).
2. Verify if authentication blocks NextAuth middleware or session tokens (which PWA workers might lack offline).
3. Examine local storage and sync queue repository execution.

Output:
- Provide a clear diagnostic report of what was causing the bug.
- Apply the fix cleanly.
- Verify using a production build test.
```
