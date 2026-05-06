# Downloads — Webflow Access Manager

Coordinate Webflow account access with your team.

---

## macOS — `.dmg` ✅ Ready

Two builds available (download whichever matches your Mac):

- **Apple Silicon (M1/M2/M3/M4)** — `Webflow Access Manager 1.0.0 arm64.dmg` (114 MB)
- **Intel Mac** — `Webflow Access Manager 1.0.0 x64.dmg` (119 MB)

Both are at: [packages/desktop/release/](packages/desktop/release/)

### Install
1. Open the `.dmg` file
2. Drag **Webflow Access Manager** to Applications
3. Open Applications, **right-click** the app → **Open** (one-time only)
4. macOS warns "App from an unidentified developer" — click **Open** to confirm

After the first launch, you can open it normally. The app lives in your menu bar.

### Why the warning?
Not notarized through Apple ($99/year). Standard macOS security check — the app is safe, but you have to give it permission once.

---

## Windows — `.exe` ✅ Ready

Two options:

- **Installer** — `Webflow Access Manager Setup 1.0.0.exe` (91 MB) — recommended
- **Portable** — `Webflow Access Manager 1.0.0 Portable.exe` (91 MB) — no install, run from anywhere

Both are at: [packages/desktop/release/](packages/desktop/release/)

### Install
1. Open the downloaded `.exe`
2. Windows SmartScreen warns "Windows protected your PC"
3. Click **More info** → **Run anyway**
4. Follow the installer (you can choose install location)

The app appears in your system tray (bottom-right corner). Right-click for options.

### Why the warning?
Not signed with a Microsoft Authenticode certificate ($200-500/year). Standard Windows security check.

---

## Android — Expo Go (interim)

Permanent APK builds are temporarily on hold while we sort out a build pipeline issue. In the meantime, Android users can run the live app via **Expo Go**.

### Setup (for testers)
1. Install **Expo Go** from the Play Store: [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)
2. Ask Saurabh for a QR code or development URL
3. Scan in Expo Go

### How Saurabh shares it
From the project directory:

```bash
cd packages/mobile
npx expo start --tunnel
```

Wait ~30 seconds for the tunnel to come up — a QR code appears in the terminal. Share the QR code (or the displayed URL) with testers.

The tunnel works over the internet — testers can be anywhere, not just on the same Wi-Fi.

> **Limitation**: This is live-development distribution. The app only works while Saurabh's machine is running `expo start`. For persistent Android distribution we'll do a proper APK build later.

---

## iOS — not yet supported

iOS distribution requires an Apple Developer account ($99/year). Until then:

1. Install **Expo Go** from the App Store
2. Scan the QR code from `npx expo start --tunnel` (same as Android)

Same caveat — only works while the dev server runs.

---

## First-time setup

Whichever platform you use, the flow is the same:

1. **Sign up** with email + password
2. **Create a workspace** (your agency name) OR **Join** an existing workspace using a Workspace ID
3. Workspace ID looks like `EF-7X3K9` — share it privately with your team
4. Once you're in, you'll see your team's Webflow account slots

The same email signs you in across all your devices. Profile and workspaces sync automatically.

---

## Hosting the binaries

The `.dmg` and `.exe` files are at `packages/desktop/release/` locally. To distribute:

- **Easiest**: Upload to **GitHub Releases** of this repo. Free, permanent download URLs.
- **Alternative**: Host on your own website (e.g. everything.design)
- **Don't email**: Files are 90-120 MB, too big for email attachments.

---

## Need help?

Reach out to your workspace owner, or contact saurabh@everything.design.
