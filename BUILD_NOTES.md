# Build Notes — Webflow Access Manager

> Running log of issues, improvements, and changes discovered during development.
> Each entry is timestamped. Newest entries at the top.

---

## 2026-05-06 — Phase E: Android APK build via EAS

### Issues found
- **EAS doesn't upload files outside the package directory.** The `@wam/shared` source lives at `packages/shared/src` — outside `packages/mobile`. EAS uploaded the mobile package only, breaking the import.
  - **Fix**: `scripts/sync-shared.js` copies `../shared/src` → `_shared/` before each EAS build. Metro config resolves `@wam/shared` to `_shared/` when present (build server) or `../shared/src` for local dev. Added a `package.json` inside `_shared/` so Metro can resolve it as a package.
  - `.easignore` ensures `_shared/` is uploaded (it's gitignored).

- **EAS uses `npm ci` which is strict.** Lockfile must match `package.json` exactly. Local installs with `--legacy-peer-deps` left phantom deps. Added `.npmrc` with `legacy-peer-deps=true` so EAS install matches local behavior.

- **Peer dep conflict**: `react-dom@19.2.5` (only needed for web) wanted `react@^19.2.5` but mobile uses `react@19.1.0`. Removed `react-dom` since we're not building for web.

- **Tray "Quit" was Windows-only** (regression from earlier). The right-click context menu was wrapped in `if (process.platform === 'win32')` so macOS users had no way to quit. Added macOS app menu (Cmd+Q works), unified tray right-click for both platforms, and made dashboard close button respect `isQuitting` flag.

## 2026-04-06 — Project Kickoff

### Decisions Made
- **20:06** — Initial codebase review completed. Identified 15 improvement areas across security, UX, and architecture.
- **20:15** — Roadmap created with 5 phases: Electron migration → Workspaces → Notes → Licensing → Auth.
- **20:25** — Resolved: Electron over native dual-build. Single codebase for macOS + Windows.
- **20:30** — Resolved: Single-tier licensing (no plans/tiers), optional notes, multi-workspace support, Razorpay + manual sales.
- **20:35** — Resolved: No Linux. Deprecate SwiftUI version — Electron is the future.
- **20:40** — Cloud Memory created as a cross-project app-building playbook.

---

## During Build — Issues & Improvements Found

> Entries will be added here as we build. Format:
> - **HH:MM** — [Category] Description. *Impact: high/medium/low*

### 2026-04-06 — Phase 0: Electron Scaffold

- **21:20** — [Infra] npm cache had root-owned files from a previous `sudo npm` run. Required `sudo chown -R $(whoami):staff ~/.npm` to fix. *Impact: low (one-time fix)*
- **21:25** — [Infra] Electron wouldn't launch — `require('electron')` returned the npm wrapper path string instead of the built-in Electron API. Root cause: `ELECTRON_RUN_AS_NODE=1` was set in the shell environment (inherited from Claude Code / VS Code terminal). This tells Electron to run as a plain Node.js process, disabling all Electron APIs. Fix: added `delete process.env.ELECTRON_RUN_AS_NODE` in vite.config.ts and `unset ELECTRON_RUN_AS_NODE` in the dev script. *Impact: high — completely blocked app launch*
- **21:30** — [Improvement] PostCSS config needed CJS format (`module.exports`) since package.json doesn't have `"type": "module"`. ESM `export default` caused Vite warnings. *Impact: low*
- **21:30** — [Improvement] TypeScript config: electron/ directory excluded from main tsconfig (renderer-only), node tsconfig no longer includes electron files to avoid emit errors. Electron main process files are compiled by vite-plugin-electron independently. *Impact: low*
- **21:35** — [Build] Full Vite build passes: renderer (420KB JS + 14KB CSS), main process (3.3KB), preload (0.6KB). TypeScript typecheck passes with zero errors. Electron launches successfully with tray icon, popup window, and all helper processes. *Impact: n/a — milestone*

- **22:15** — [Bug] Popup window was blank — React crashed with "Maximum update depth exceeded" infinite loop. Root cause: Zustand selectors calling store getter functions (`getAvailableAccounts()`, `getMyInternalAccount()`) that return new array/object references on every call. Zustand sees the new reference, triggers re-render, selector runs again → infinite loop. Fix: removed getter functions from store, moved derived computations into components using `useMemo()`. *Impact: critical — app was completely blank*
- **22:15** — [Bug] Popup was also invisible due to `transparent: true` + `backgroundColor: '#00000000'` on macOS. Vibrancy effect didn't render in Electron 33, leaving a fully transparent window. Fix: removed transparency, use solid `backgroundColor` from `nativeTheme`. *Impact: high — window invisible even if React worked*
- **22:15** — [Bug] Dev server URL was hardcoded to `localhost:5173` in main.ts. If Vite picks a different port, Electron loads a blank page. Fix: read `process.env.VITE_DEV_SERVER_URL` (set by vite-plugin-electron). *Impact: medium — intermittent blank page*

### 2026-04-07 — Phase A: Monorepo Restructure

- **12:30** — [Arch] Restructured to npm workspaces monorepo: `packages/shared` (pure TS), `packages/desktop` (Electron), `packages/mobile` (Expo — future). *Impact: foundation for cross-platform*
- **12:35** — [Arch] Created adapter pattern with 3 interfaces (StorageAdapter, NotificationAdapter, DeviceAdapter). Shared stores/services no longer depend on `window.electronAPI` or `localStorage` directly — they call platform adapters. *Impact: high — enables mobile code sharing*
- **12:40** — [Bug #1] Firebase config now injectable via `initFirebase(config)` instead of hardcoded. *Fixed*
- **12:40** — [Bug #2] Admin check now reads `isAdmin` field from User model (Firebase) instead of hardcoded UUID. *Fixed in shared models*
- **12:40** — [Bug #3] All Firebase operations now wrapped in try/catch with console.error + re-throw. *Fixed*
- **12:40** — [Bug #4] `getAccountDisplayName` regex fixed to match `account-{timestamp}` format. *Fixed*
- **12:40** — [Bug #5] Duplicate `formatDuration` removed from models.ts — only exists in helpers.ts now. *Fixed*
- **12:45** — [Verified] Desktop app builds and runs correctly with monorepo structure. TypeScript passes, Vite build produces correct code-split bundles, Electron launches and loads Firebase data.

- **13:00** — [Auth] Added Firebase Authentication (email/password). AuthStore now uses Firebase Auth UID instead of `crypto.randomUUID()`. Same UID on every device → profile syncs across desktop and mobile. Onboarding updated with sign-in/sign-up toggle, email, and password fields. Firebase Auth state listener handles session persistence automatically. *Impact: critical — enables multi-device profile sync*

### 2026-04-07 — Phase B: Expo Mobile App

- **16:30** — [Mobile] Initialized Expo project with SDK 54, Expo Router, expo-notifications, expo-device, AsyncStorage, Firebase JS SDK, Zustand.
- **16:35** — [Mobile] Created mobile adapters: AsyncStorage for persistence, expo-notifications for alerts, expo-device for device ID. All implement the shared PlatformAdapters interface.
- **16:40** — [Mobile] Built 3 tab screens (Accounts, Requests, Settings) + Onboarding with email/password auth. Same UI patterns as desktop — just React Native StyleSheet instead of Tailwind.
- **16:45** — [Mobile] Built 3 row components (AccountRow, ClientAccountRow, AccessRequestRow) with inline claim/release/request actions.
- **16:50** — [Infra] Expo doesn't work well with npm workspaces hoisting — React Native packages at the root node_modules break Metro's project root detection. Fix: removed `@wam/mobile` from workspace, installed its deps independently. Shared code linked via Metro's `watchFolders` + `extraNodeModules` Proxy pattern. *Impact: high — blocked all bundling*
- **16:55** — [Verified] Metro bundles successfully: 1275 modules in 5s. All shared code (stores, services, types, utils) resolves correctly from the mobile app. Firebase, Zustand, and adapters all compile.

### 2026-04-07 — Phase C: Notifications + Polish

- **17:15** — [Mobile] Enhanced notification adapter: vibration pattern (iOS 500ms, Android double-pulse), default sound, `timeSensitive` interrupt level on iOS.
- **17:20** — [Mobile] Added full dark mode support across all screens and components using `useTheme()` hook. Colors adapt to system preference automatically — matches SwiftUI `userInterfaceStyle: automatic`.
- **17:25** — [Mobile] Added pull-to-refresh on Accounts screen — re-subscribes Firebase listeners on pull.
- **17:30** — [Desktop] Removed auto DevTools open from popup and dashboard windows. DevTools no longer clutter the screen in dev mode.
- **17:30** — [Desktop] Added `window.confirm()` dialog before deleting account slots (admin action). Prevents accidental deletion.

### Pending Improvements Noted During Build
- [ ] The admin check is still hardcoded to Saurabh's UUID (`ADF18B6F-B4C5-4F77-82B4-B34BACEB2BFB`) in Dashboard.tsx. Will be replaced by role-based system in Phase 1.
- [ ] `electron-store` imported but not yet wired up for user persistence (currently using `localStorage` which works fine in Electron but has no encryption).
- [ ] `auto-launch` package installed but not yet integrated — needs implementation in Settings.
- [ ] Tray icon is a simple generated placeholder — needs proper branded icon design.
- [ ] No auto-updater wired up yet — `electron-updater` setup deferred to post-Phase 1.
- [ ] 12 npm vulnerabilities flagged (2 low, 10 high) — mostly from deprecated transitive deps in electron-builder. Non-blocking for dev, should audit before release.

---
