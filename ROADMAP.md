# Webflow Access Manager — Product Roadmap

> From an internal macOS tool to a cross-platform, multi-tenant product for agencies.

---

## Table of Contents

- [Phase 0: Electron Migration (Cross-Platform Foundation)](#phase-0-electron-migration-cross-platform-foundation)
- [Phase 1: Multi-Tenant Workspace System](#phase-1-multi-tenant-workspace-system)
- [Phase 2: Notes & Reasons on Requests](#phase-2-notes--reasons-on-requests)
- [Phase 3: License Key System](#phase-3-license-key-system)
- [Phase 4: Authentication Upgrade](#phase-4-authentication-upgrade)
- [Implementation Order](#implementation-order)
- [Open Questions](#open-questions)

---

## Phase 0: Electron Migration (Cross-Platform Foundation)

The current app is a native macOS SwiftUI app. To sell to agencies on both Mac and Windows, we migrate to **Electron** — a single codebase that ships to both platforms while preserving the system tray popup-first experience.

### 0.1 Why Electron

| Consideration | Decision |
|---|---|
| **Cross-platform** | Single codebase → macOS `.dmg` + Windows `.exe` |
| **System tray popup** | Electron's `Tray` + `BrowserWindow` API natively supports tray popups on both OS |
| **Firebase compatibility** | Firebase JS SDK (`firebase` npm package) works identically on Mac and Windows — no platform-specific SDK needed |
| **Notifications** | Electron's `Notification` API uses native OS notifications on both platforms (macOS Notification Center, Windows Action Center) |
| **Auto-update** | `electron-updater` handles updates on both platforms via a single update server |
| **App size** | ~80-120 MB (acceptable for a desktop tool; similar to Slack, Figma, etc.) |

**Alternatives considered and rejected:**
- **Tauri** — Smaller bundle size, but relies on OS webview (inconsistent rendering on older Windows). Tray popup support is less mature. Ecosystem is younger.
- **Flutter Desktop** — Good option, but team already has web/JS skills. Firebase Flutter SDK exists but desktop support is less proven than the JS SDK.
- **Keep native SwiftUI + build separate Windows app** — Double the maintenance, double the bugs. Not viable for a small team.

### 0.2 Tech Stack

```
┌─────────────────────────────────────────────────────┐
│  Electron Shell                                     │
│  ├── Main Process (Node.js)                         │
│  │   ├── Tray management                            │
│  │   ├── Window management (popup + dashboard)      │
│  │   ├── Native notifications                       │
│  │   ├── Auto-launch at login                       │
│  │   └── IPC bridge to renderer                     │
│  │                                                  │
│  └── Renderer Process (Chromium)                    │
│      ├── React 18+ with TypeScript                  │
│      ├── Tailwind CSS (SwiftUI-like design system)  │
│      ├── Firebase JS SDK (v9+ modular)              │
│      └── Zustand (lightweight state management)     │
│                                                     │
│  Build & Distribution                               │
│  ├── Vite (bundler, fast HMR for dev)               │
│  ├── electron-builder (packaging)                   │
│  └── electron-updater (auto-updates)                │
└─────────────────────────────────────────────────────┘
```

**Key library choices:**

| Layer | Library | Why |
|---|---|---|
| UI Framework | **React 18+ / TypeScript** | Largest ecosystem, easy to hire for, component model maps well from SwiftUI |
| Styling | **Tailwind CSS** | Utility-first, easy to replicate SwiftUI's clean aesthetic. No CSS-in-JS overhead |
| State | **Zustand** | Minimal boilerplate, similar mental model to SwiftUI's `@StateObject` / `@Published`. Replaces `AppState.shared` singleton pattern directly |
| Backend | **Firebase JS SDK v9+ (modular)** | Tree-shakeable, works identically in browser/Electron. Drop-in replacement for current Firebase iOS SDK |
| Routing | **React Router v6** | Dashboard views, settings, onboarding — simple route-based navigation |
| Notifications | **Electron Notification API** | Uses native OS notifications. Custom action buttons via IPC to main process |
| Build | **Vite + electron-vite** | Fast dev server, optimized production builds for Electron |
| Package | **electron-builder** | Produces `.dmg` (macOS), `.exe` / `.msi` (Windows), `.AppImage` (Linux optional) |

### 0.3 App Architecture — Popup-First Design

The app lives in the **system tray**. The popup is the primary interface. The dashboard is a secondary, expanded view.

```
┌─────────────────────────────────┐
│  System Tray Icon               │
│  (always running)               │
│         │                       │
│         ▼                       │
│  ┌─────────────────────┐        │
│  │  Tray Popup Window  │ ◄──── PRIMARY interaction surface
│  │  (320px wide)       │        │
│  │  - Account overview │        │
│  │  - Quick actions    │        │
│  │  - Pending requests │        │
│  │  - Status indicator │        │
│  └──────────┬──────────┘        │
│             │                   │
│     "Open Dashboard"            │
│             │                   │
│             ▼                   │
│  ┌─────────────────────┐        │
│  │  Dashboard Window   │ ◄──── SECONDARY expanded view
│  │  (450x600 or wider) │       │
│  │  - Full account list│        │
│  │  - Client accounts  │        │
│  │  - Request history  │        │
│  │  - Settings/Profile │        │
│  └─────────────────────┘        │
└─────────────────────────────────┘
```

**Electron window setup:**

| Window | Type | Behavior |
|---|---|---|
| **Tray Popup** | `BrowserWindow` anchored to tray icon | Frameless, `alwaysOnTop`, hides on blur (click outside closes it). Position calculated relative to tray icon bounds. 320px wide, dynamic height. |
| **Dashboard** | Standard `BrowserWindow` | Title bar, resizable, closable (hides to tray, doesn't quit app). 500x650 default size. Opens from popup's "Open Dashboard" button. |

**Platform-specific tray behavior:**
- **macOS**: Tray icon in menu bar. Popup appears below the icon. Uses `tray.on('click')` to toggle.
- **Windows**: Tray icon in system tray (bottom-right). Popup appears above the icon. Uses `tray.on('click')` to toggle. Right-click shows a native context menu (Quit, Open Dashboard).

### 0.4 Design System — SwiftUI Aesthetic on Electron

The goal is a UI that feels native and familiar to macOS users while also looking at home on Windows. SwiftUI's design language — clean, rounded, spacious, muted colors — translates well to CSS.

#### Design Tokens (Tailwind Config)

```
Colors
├── Background
│   ├── primary     → macOS: rgba(246,246,246,0.95)  Win: #f8f8f8
│   ├── secondary   → macOS: rgba(255,255,255,0.7)   Win: #ffffff
│   ├── elevated    → #ffffff (card surfaces)
│   └── popover     → macOS: vibrancy blur            Win: #fafafa solid
│
├── Text
│   ├── primary     → #1d1d1f  (near-black, not pure black)
│   ├── secondary   → #86868b  (muted gray, SwiftUI .secondary)
│   └── tertiary    → #aeaeb2
│
├── Accent
│   ├── blue        → #007aff  (SF system blue)
│   ├── green       → #34c759  (available/online)
│   ├── red         → #ff3b30  (unavailable/error)
│   ├── orange      → #ff9500  (pending/warning)
│   ├── purple      → #af52de  (client accounts)
│   └── yellow      → #ffcc00  (in-request)
│
├── Border          → rgba(0,0,0,0.06)
└── Divider         → rgba(0,0,0,0.08)

Typography (System Font Stack)
├── macOS          → -apple-system, BlinkMacSystemFont (San Francisco)
├── Windows        → "Segoe UI", system-ui
├── Sizes
│   ├── title2     → 22px / 600 weight (matches SwiftUI .title2.bold)
│   ├── headline   → 15px / 600 weight
│   ├── subheadline→ 13px / 500 weight
│   ├── body       → 13px / 400 weight
│   ├── caption    → 11px / 400 weight
│   └── caption2   → 10px / 400 weight

Spacing (matching SwiftUI defaults)
├── 4px, 6px, 8px, 12px, 16px, 20px

Border Radius
├── small    → 4px  (tags, badges)
├── medium   → 8px  (cards, rows — matches SwiftUI .cornerRadius(8))
├── large    → 12px (dialogs, sheets)
├── full     → 9999px (status dots, avatars)

Shadows
├── subtle   → 0 1px 3px rgba(0,0,0,0.06)
├── medium   → 0 4px 12px rgba(0,0,0,0.08)
└── popover  → 0 8px 30px rgba(0,0,0,0.12)
```

#### Component Mapping — SwiftUI → React/Tailwind

| SwiftUI | Electron Equivalent | CSS Approach |
|---|---|---|
| `VStack(spacing: 12)` | `<div className="flex flex-col gap-3">` | Flexbox column |
| `HStack(spacing: 8)` | `<div className="flex items-center gap-2">` | Flexbox row |
| `.padding()` | `p-4` (16px, SwiftUI default) | Tailwind spacing |
| `.background(Color(.controlBackgroundColor))` | `bg-elevated rounded-lg` | Custom token class |
| `.cornerRadius(8)` | `rounded-lg` (8px) | Tailwind border radius |
| `.font(.headline)` | `text-[15px] font-semibold` | Tailwind typography |
| `.foregroundColor(.secondary)` | `text-secondary` | Custom color token |
| `.buttonStyle(.borderedProminent)` | Custom `<Button variant="primary">` | Styled component with SwiftUI-like padding, radius, blue fill |
| `.buttonStyle(.bordered)` | Custom `<Button variant="secondary">` | Gray background, dark text |
| `.controlSize(.small)` | `size="sm"` prop | Smaller padding + font |
| `Circle().fill(.green).frame(width: 8)` | `<span className="w-2 h-2 rounded-full bg-green">` | Utility classes |
| `Divider()` | `<hr className="border-divider">` | Custom border color |
| `.sheet(isPresented:)` | Modal overlay component | Centered overlay with backdrop blur |
| `NavigationLink` | React Router `<Link>` or view state toggle | Client-side routing |
| `ScrollView` | `overflow-y-auto` | CSS overflow |
| `LazyVGrid(columns: 2)` | `grid grid-cols-2 gap-2` | CSS Grid |
| `ProgressView()` | Animated spinner component | CSS animation |
| `TimelineView(.periodic(by: 60))` | `useEffect` + `setInterval(60000)` | React hook |

#### Dark Mode

- Detect system theme via `nativeTheme.shouldUseDarkColors` (Electron main process)
- Expose to renderer via IPC; apply `.dark` class to root
- All color tokens have dark variants in Tailwind config
- Matches macOS and Windows dark mode preferences automatically

#### Vibrancy / Translucency (macOS Polish)

- macOS popup window: `vibrancy: 'popover'` + `transparent: true` on `BrowserWindow`
- Gives the frosted-glass look matching native macOS popovers
- Windows: solid background fallback (Windows doesn't have a direct equivalent; Mica/Acrylic requires native modules and isn't worth the complexity)

### 0.5 Porting the Existing Views

Each SwiftUI view maps 1:1 to a React component. Here's the full mapping:

```
SwiftUI (current)                    React (new)
─────────────────                    ──────────────
WebflowAccessManagerApp.swift   →    main.ts (Electron main process)
                                     App.tsx (root React component)

Views/
  OnboardingView.swift           →   pages/Onboarding.tsx
  DashboardView.swift            →   pages/Dashboard.tsx
  SettingsView.swift              →   pages/Settings.tsx
  MenuBarPopoverView.swift       →   pages/TrayPopup.tsx

  AccountRow (in DashboardView)  →   components/AccountRow.tsx
  ClientAccountRow               →   components/ClientAccountRow.tsx
  AccessRequestRow               →   components/AccessRequestRow.tsx

Services/
  AuthService.swift              →   services/authService.ts
  FirebaseService.swift          →   services/firebaseService.ts
  AppState.swift                 →   stores/appStore.ts (Zustand)
  NotificationService.swift      →   services/notificationService.ts

Models/
  User.swift                     →   types/models.ts (TypeScript interfaces)
  Account.swift                  →   types/models.ts
  ClientAccount.swift            →   types/models.ts
  AccessRequest.swift            →   types/models.ts

Utilities/
  Extensions.swift               →   utils/helpers.ts + tailwind.config.ts (colors)
```

### 0.6 Backend Compatibility Check

Everything currently used is already cross-platform compatible:

| Service | macOS (current) | Electron (new) | Notes |
|---|---|---|---|
| **Firebase Realtime Database** | Firebase iOS SDK | Firebase JS SDK v9 | Same database, same rules. Just a different client SDK. All `observe`, `set`, `update`, `remove` calls map directly to `onValue`, `set`, `update`, `remove` in the JS SDK |
| **Firebase Auth** | Not used yet (Phase 4) | Firebase JS SDK Auth module | JS Auth module supports Anonymous Auth, Google Sign-In, email/password — all cross-platform |
| **Notifications** | `UserNotifications` framework | Electron `Notification` API | Both use native OS notification systems. Action buttons work differently — Electron doesn't support inline notification actions on Windows, so we use a custom in-app response UI instead |
| **Auto-launch at login** | Not implemented (UserDefaults bool only) | `auto-launch` npm package | Works on macOS (Login Items) and Windows (Registry) |
| **Data persistence** | `UserDefaults` | `electron-store` npm package | JSON file storage, encrypted option available. Same key-value pattern |
| **Device ID** | `Host.current().localizedName` | `os.hostname()` + machine-id package | Cross-platform device identification |
| **Presence / Online status** | Firebase `.info/connected` | Firebase `.info/connected` (same) | Identical API in JS SDK |

### 0.7 Notification Handling — Cross-Platform Strategy

Notifications behave differently on macOS vs Windows. Here's the strategy:

**macOS:**
- Electron `Notification` API → native macOS Notification Center
- Supports `reply` and custom actions natively
- Sound: system notification sound
- Can request user attention (dock bounce) via `app.dock.bounce()`

**Windows:**
- Electron `Notification` API → Windows Action Center (toast notifications)
- Action buttons: limited support — Windows toasts support buttons but Electron's API doesn't fully expose them
- **Solution**: For accept/decline with notes, show an **in-app mini dialog** instead of relying on notification actions. The notification itself says "X requests access to Account Y" and clicking it opens the popup with the response UI.

**Unified approach:**
1. Fire a native OS notification (simple text + click handler)
2. On notification click → open/focus the tray popup
3. Popup shows the request with Accept/Decline buttons + optional note field
4. This works identically on both platforms

### 0.8 Project Structure

```
webflow-access-manager/
├── package.json
├── electron-builder.yml          # Build config for macOS + Windows
├── tsconfig.json
├── tailwind.config.ts
├── vite.config.ts
│
├── electron/                     # Main process
│   ├── main.ts                   # App entry, window management
│   ├── tray.ts                   # System tray + popup positioning
│   ├── notifications.ts          # Native notification bridge
│   ├── ipc.ts                    # IPC handlers (main ↔ renderer)
│   ├── autoLaunch.ts             # Launch at login
│   └── updater.ts                # Auto-update logic
│
├── src/                          # Renderer process (React)
│   ├── main.tsx                  # React entry point
│   ├── App.tsx                   # Root component + router
│   │
│   ├── pages/
│   │   ├── TrayPopup.tsx         # Primary popup view
│   │   ├── Onboarding.tsx        # First-time setup
│   │   ├── Dashboard.tsx         # Full dashboard
│   │   └── Settings.tsx          # Profile + preferences
│   │
│   ├── components/
│   │   ├── ui/                   # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── StatusDot.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Badge.tsx
│   │   ├── AccountRow.tsx
│   │   ├── ClientAccountRow.tsx
│   │   ├── AccessRequestRow.tsx
│   │   └── WorkspaceSwitcher.tsx
│   │
│   ├── stores/
│   │   ├── appStore.ts           # Zustand store (replaces AppState)
│   │   └── authStore.ts          # Auth state (replaces AuthService state)
│   │
│   ├── services/
│   │   ├── firebase.ts           # Firebase init + config
│   │   ├── firebaseService.ts    # Database operations
│   │   ├── authService.ts        # Auth logic
│   │   └── notificationService.ts
│   │
│   ├── types/
│   │   └── models.ts             # TypeScript interfaces
│   │
│   ├── utils/
│   │   ├── helpers.ts            # Duration formatting, etc.
│   │   └── platform.ts           # OS detection helpers
│   │
│   └── styles/
│       └── globals.css           # Tailwind base + custom tokens
│
├── resources/                    # Build assets
│   ├── icon.icns                 # macOS app icon
│   ├── icon.ico                  # Windows app icon
│   ├── icon.png                  # 512x512 PNG source
│   └── tray-icon.png             # 16x16 / 22x22 tray icon (template image)
│
└── build/                        # Output (gitignored)
    ├── mac/                      # .dmg
    └── win/                      # .exe / .msi
```

### 0.9 Build & Distribution

```
electron-builder.yml
─────────────────────

macOS:
  Target: dmg, zip
  Category: public.app-category.productivity
  Signing: Developer ID (for distribution outside App Store)
  Notarization: Required for macOS Gatekeeper
  Architecture: universal (Intel + Apple Silicon)

Windows:
  Target: nsis (installer .exe), portable (.exe)
  Signing: Optional (EV code signing cert removes SmartScreen warning)
  Architecture: x64, arm64
```

**Distribution channels:**
- Direct download from website (primary)
- macOS: `.dmg` or `.zip` — notarized so Gatekeeper allows it
- Windows: `.exe` installer — signed to avoid SmartScreen warnings
- Auto-update: `electron-updater` checks a releases endpoint (GitHub Releases, S3, or custom server) on launch

### 0.10 Migration Checklist

- [ ] Scaffold Electron + React + Vite + Tailwind project
- [ ] Set up Firebase JS SDK with existing `webflow-team-login` project config
- [ ] Implement design system tokens in Tailwind config
- [ ] Build `ui/` primitives (Button, Card, StatusDot, Modal, Input, Badge)
- [ ] Port `TrayPopup.tsx` from `MenuBarPopoverView.swift`
- [ ] Port `Dashboard.tsx` from `DashboardView.swift`
- [ ] Port `Onboarding.tsx` from `OnboardingView.swift`
- [ ] Port `Settings.tsx` from `SettingsView.swift`
- [ ] Port `firebaseService.ts` from `FirebaseService.swift`
- [ ] Port `appStore.ts` from `AppState.swift`
- [ ] Port `authService.ts` from `AuthService.swift`
- [ ] Port `notificationService.ts` from `NotificationService.swift`
- [ ] Implement system tray + popup window positioning (macOS + Windows)
- [ ] Implement auto-launch at login
- [ ] Implement auto-updater
- [ ] Test on macOS (Intel + Apple Silicon)
- [ ] Test on Windows 10 + 11
- [ ] Build and package for both platforms

---

## Phase 1: Multi-Tenant Workspace System

The core product shift — move from a single shared Firebase database to isolated workspaces so any agency can use the app independently.

### 1.1 Workspace Creation & Identity
- When a new user signs up, they get two paths: **Create Workspace** or **Join Workspace**
- Creating a workspace requires:
  - **Agency Name** (e.g., "Everythingflow Studio")
  - **Owner Profile** (name, role, profile icon/color)
- System generates a **unique Workspace ID** (short, shareable — e.g., `EF-7X3K9`)
- Workspace data stored under `/workspaces/{workspaceId}/` in Firebase
- Owner becomes the first admin automatically

### 1.2 Invite & Join Flow
- Owner/admins can share the **Workspace ID** with teammates
- New users select "Join Workspace" → enter the Workspace ID
- Two join modes to consider:
  - **Open Join** — anyone with the ID can join instantly
  - **Approval Required** — join request goes to admin, who approves/rejects
- Each workspace displays its member list with roles

### 1.3 Data Isolation
- All existing data paths move under the workspace scope:
  ```
  /workspaces/{workspaceId}/accounts/internal/
  /workspaces/{workspaceId}/accounts/client/
  /workspaces/{workspaceId}/users/
  /workspaces/{workspaceId}/accessRequests/
  /workspaces/{workspaceId}/presence/
  /workspaces/{workspaceId}/meta/        ← name, owner, createdAt, plan
  ```
- A user can belong to **multiple workspaces** and switch between them
- Firebase Security Rules scoped per workspace — members can only read/write their own workspace

### 1.4 Role-Based Access
- Replace the hardcoded admin UUID with a proper role system:
  - **Owner** — full control, manage billing/license, delete workspace
  - **Admin** — create/delete account slots, manage members, approve join requests
  - **Member** — claim/release accounts, make requests
- Roles stored at `/workspaces/{workspaceId}/users/{userId}/role`

### 1.5 Workspace Switcher (Popup UI)
- If a user belongs to multiple workspaces, show a **workspace switcher** at the top of the tray popup
- Dropdown or segmented control with workspace names
- Switching workspace re-subscribes all Firebase listeners to the new workspace path
- Dashboard shows the full workspace name + member count in the header

---

## Phase 2: Notes & Reasons on Requests

Add context to every accept/decline interaction so teammates understand *why*.

### 2.1 Request Notes (Requester Side)
- When requesting access to a claimed account, the requester can attach an **optional note**
  - e.g., "Need to push client changes before 3 PM deadline"
- Note field is always visible but never required — user can skip it and just hit Request
- Note appears in the notification the account holder receives
- Stored in the `AccessRequest` model as a `requesterNote` field

### 2.2 Response Notes (Responder Side)
- When accepting or declining a request, the responder can **optionally** add a reason
  - Accept: "Done in 5 mins, it's yours" — or just accept silently with no note
  - Decline: "Working on a live deploy, try again in 30 mins" — or just decline silently
- The note field is visible but not mandatory — responders can accept/decline with a single click without writing anything
- If a note is provided, the requester receives a notification with the response + reason
- Stored as `responseNote` and surfaced in the request status UI

### 2.3 Notification + In-App Response Flow
- Native OS notification fires: "X requests access to Account Y"
- Clicking the notification opens/focuses the tray popup
- Popup shows an **inline response card**:
  ```
  ┌────────────────────────────────────────┐
  │ 🟠 Alex requests Internal Account 2   │
  │ "Need to push client changes by 3 PM" │
  │                                        │
  │ ┌────────────────────────────────────┐ │
  │ │ Add a note (optional)...           │ │
  │ └────────────────────────────────────┘ │
  │                                        │
  │  [Release & Accept]       [Decline]    │
  │                    [Remind in 5 min]   │
  └────────────────────────────────────────┘
  ```
- This works identically on macOS and Windows (no reliance on OS notification action buttons)

### 2.4 Request History Log
- In-app notification history/log so notes aren't lost after dismissal
- Accessible from the Dashboard
- Shows: timestamp, requester, account, requester note, response, response note
- Filterable by status (pending, approved, rejected)

### 2.5 Data Model Changes
```
AccessRequest (updated)
├── requesterNote: string | null     ← new
├── responseNote: string | null      ← new
├── respondedAt: timestamp | null    ← new
├── status: "pending" | "approved" | "rejected" | "cancelled"
└── ... (existing fields)
```

---

## Phase 3: License Key System

Monetise the app with a simple license key model — one key, full access, no tiers.

### 3.1 Licensing Model — Single Tier, Full Access
- **No plan tiers.** One license key = one workspace = full access for everyone in it
- No member limits, no account limits, no feature gating
- The license key is the only thing separating a free download from an activated product
- All features (notes, request history, unlimited members/accounts) are available to every paying workspace

### 3.2 License Key Generation — In-App Admin Panel
- License management is built **directly into the app** as a native admin view — not a separate web dashboard
- Accessible only by you (super-admin) via a hidden/secure route in the app
- Admin panel features:
  - Generate license keys (e.g., `WAM-XXXX-XXXX-XXXX`)
  - Set expiry date (or no expiry for lifetime keys)
  - View all issued keys: status, linked workspace, activation date
  - Revoke a key if needed
- Keys stored in Firebase under `/licenses/{key}/`
  ```
  /licenses/{key}/
  ├── issuedAt: timestamp
  ├── expiresAt: timestamp | null       ← null = lifetime
  ├── activatedBy: workspaceId | null
  ├── status: "unused" | "active" | "expired" | "revoked"
  ```
- The admin panel feels native — same styling, same navigation, just another view in the system tray app or dashboard window. Easy to switch between managing your own workspace and managing licenses.

### 3.3 Activation Flow
- When creating a workspace, the owner must enter a **license key**
- App validates the key against Firebase:
  - Valid and unused? → activate, link to workspace, proceed
  - Already used? → "This key is already activated on another workspace"
  - Expired or revoked? → "This key is no longer valid. Contact support."
- On successful validation, key is permanently linked to the workspace
- All workspace members automatically get full access — no per-seat licensing

### 3.4 Enforcement
- App checks license validity on launch and periodically (every 24h)
- If license expires or is revoked:
  - App enters **read-only mode** — users can see current state but can't claim/release/request
  - Banner in popup + dashboard: "Your license has expired. Contact your workspace owner."
- No feature gating — either you have a valid key and everything works, or you don't

### 3.5 Sales Channels — Two Options

**Option A: Razorpay Integration (Automated)**
- A simple landing page / purchase page with Razorpay checkout
- On successful payment, a webhook triggers a Firebase Cloud Function that:
  1. Generates a license key
  2. Stores it in `/licenses/{key}/`
  3. Emails the key to the buyer
- Fully automated — buyer pays, gets key instantly, activates in-app
- Razorpay supports UPI, cards, net banking, wallets (good for Indian market + international)

**Option B: Manual Fulfillment**
- Buyer contacts you via website form, email, or DM
- You generate a key from the in-app admin panel
- You send the key to the buyer manually
- Good for early days, high-touch sales, or custom deals

Both options coexist — Razorpay for self-serve buyers, manual for custom/enterprise requests.

### 3.6 Distribution
- App distributed via direct download from website:
  - macOS: `.dmg` (notarized)
  - Windows: `.exe` installer (signed)
- Auto-update built in — users always get the latest version
- No payment logic inside the app itself — keys are the bridge between purchase and activation

---

## Phase 4: Authentication Upgrade

Replace the current name-only sign-in with proper identity.

### 4.1 Firebase Auth
- On first launch, create a **Firebase Anonymous Auth** session (device-pinned identity)
- Optionally let users link to:
  - **Google Sign-In** (works on both macOS and Windows)
  - **Email/Password** (simple, universal)
- This prevents impersonation and enables account recovery
- Firebase JS SDK Auth module handles all of this cross-platform

### 4.2 Profile Persistence
- Profile tied to Firebase Auth UID instead of a locally generated UUID
- User can sign in on a new machine (Mac or Windows) and recover their workspace memberships
- `electron-store` caches the auth session locally for fast startup

---

## Implementation Order

```
Phase 0 ──────────────────────────  Electron migration (new foundation)
  0.1-0.4  Scaffold + design system
  0.5-0.6  Port all views + services
  0.7-0.8  Notifications + project structure
  0.9-0.10 Build, package, test on both OS
      │
      ▼
Phase 1 ──────────────────────────  Multi-tenant workspaces
  1.1  Workspace creation
  1.2  Join flow
  1.3  Data isolation + Firebase rules
  1.4  Role-based access
  1.5  Workspace switcher UI
      │
      ├─────────────┐
      ▼             ▼
Phase 2          Phase 3 ─────────  Can run in parallel
  Notes &          License keys
  Reasons          + plan tiers
      │             │
      └──────┬──────┘
             ▼
Phase 4 ──────────────────────────  Auth upgrade (before public launch)
```

**Phase 0** is the prerequisite for everything — we can't ship to Windows or sell licenses without it. Phase 1 must follow immediately (workspace isolation is required for multi-tenant licensing). Phases 2 and 3 can be developed in parallel. Phase 4 should be completed before any public launch.

---

## Resolved Decisions

- [x] **Multiple workspaces?** — Yes, a user can belong to multiple workspaces simultaneously and switch between them.
- [x] **Free tier?** — No. One license key = one workspace = full access for everyone. No tiers, no feature gating.
- [x] **License admin dashboard?** — Built into the app as a native system view (not a web app). Feels like part of the app, easy to navigate and switch between.
- [x] **Request notes mandatory?** — No, optional. Users can accept/decline with a single click. The note field is visible but never required.
- [x] **License key sales?** — Two options: Razorpay integration (automated, self-serve) + manual fulfillment. Both coexist.

## Resolved Decisions (Continued)

- [x] **Linux support?** — No. Focus on macOS + Windows only. Keeps testing scope tight and targets where agency customers actually are.
- [x] **Continue native SwiftUI/Xcode?** — No. Fully deprecated in favor of Electron. One codebase for both platforms. Maintaining two native codebases (Swift + C#/WinUI) is not viable for a small team. The current SwiftUI app serves as the reference implementation for porting to Electron/React.
