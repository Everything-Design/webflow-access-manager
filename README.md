# Webflow Access Manager

A cross-platform team tool to coordinate **shared Webflow account access** for design and development agencies. Stop juggling who's logged in where — claim, release, and request access to your shared Webflow accounts in real time.

> **Want to use it?** → [Download the app](DOWNLOADS.md)
> **Latest release:** [v1.1.2](https://github.com/Everything-Design/webflow-access-manager/releases/tag/v1.1.2)

---

## What it does

Webflow's pricing model assigns a fixed number of internal account seats to each Workspace. Most agencies share these seats across a much larger team — which leads to constant "hey, are you still in account 3?" pings on Slack.

This app coordinates that:

- **Claim** an internal account when you start working
- **Release** it when you're done — others see availability instantly
- **Request access** if all accounts are taken — the current user gets a notification with your reason
- **Accept or decline** requests with an optional note ("done in 5 min", "live deploy in progress")
- **Track client accounts** — see who's currently working on which client
- **Real-time presence** — know who's online across your team

Everything syncs across desktop and mobile in real time via Firebase.

---

## Features

| | |
|---|---|
| **Cross-platform** | macOS (Apple Silicon + Intel), Windows, Android (via Expo Go) |
| **Multi-tenant workspaces** | Each agency gets an isolated workspace with a short shareable ID like `EF-7X3K9` |
| **Authentication** | Firebase Auth — email/password and Google Sign-In; same identity on every device |
| **Roles** | Owner, Admin, Member — admins can add/delete account slots, manage members |
| **Real-time sync** | Firebase Realtime Database — claims and requests update instantly across all devices |
| **Native notifications** | OS-level alerts on access requests, approvals, and rejections |
| **Optional notes** | Attach a reason to any request, accept, or decline |
| **System tray (desktop)** | Lives in your menu bar — popup for quick actions, dashboard for the full view |
| **Dark mode** | Follows your system setting on both desktop and mobile |

---

## Tech stack

- **Shared core**: TypeScript, Zustand (state), Firebase JS SDK
- **Desktop**: Electron 38, React 18, Tailwind CSS, Vite, electron-builder
- **Mobile**: Expo SDK 54, React Native, Expo Router
- **Backend**: Firebase Realtime Database + Firebase Authentication

The shared package (`packages/shared`) contains all business logic — types, services, stores, and platform adapter interfaces. Desktop and mobile each implement the adapters (storage, notifications, device ID) for their platform but reuse 100% of the business logic.

---

## Project structure

```
webflow-access-manager/
├── packages/
│   ├── shared/         # Pure TypeScript — types, services, stores, adapters
│   ├── desktop/        # Electron + React DOM + Tailwind
│   └── mobile/         # Expo + React Native
├── DOWNLOADS.md        # End-user install instructions
├── ROADMAP.md          # Phases, decisions, open questions
└── BUILD_NOTES.md      # Timestamped log of issues found and fixes applied
```

---

## Development

```bash
# Install workspace dependencies (desktop + shared)
npm install

# Mobile installs separately (it's outside the workspace because of Expo)
cd packages/mobile && npm install --legacy-peer-deps && cd ../..

# Run the desktop app (auto-launches Electron + Vite HMR)
npm run --workspace=@wam/desktop dev

# Run the mobile app (scan the QR with Expo Go on your phone)
cd packages/mobile && npx expo start --tunnel
```

### Building for distribution

```bash
# macOS .dmg (universal)
npm run --workspace=@wam/desktop build:mac

# Windows .exe (NSIS installer + portable, cross-builds on Mac)
npm run --workspace=@wam/desktop build:win
```

Build artifacts land in `packages/desktop/release/`.

---

## Architecture

The shared package uses a small **adapter pattern** to keep all business logic platform-agnostic:

```typescript
// packages/shared/src/platform/adapters.ts
interface StorageAdapter { getItem, setItem, removeItem }
interface NotificationAdapter { send }
interface DeviceAdapter { getDeviceId }
```

Each platform implements these once and registers them at startup. The Zustand stores and Firebase services then call into the adapter — never `localStorage` or `window.electronAPI` directly. That's why the same store code runs on Electron, React Native, and (in theory) on web.

Firebase data is scoped under `/workspaces/{wsId}/` so each agency's data is fully isolated. Real-time listeners auto-resubscribe when a user switches workspaces.

---

## Documentation

- **[DOWNLOADS.md](DOWNLOADS.md)** — End-user install guide for macOS, Windows, Android
- **[ROADMAP.md](ROADMAP.md)** — Product roadmap, design decisions, open questions
- **[BUILD_NOTES.md](BUILD_NOTES.md)** — Timestamped log of every issue found and fix applied during the build

---

## License

UNLICENSED — internal tool, not currently open for external contributions.

For questions or access requests: saurabh@everything.design
