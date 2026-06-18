import {
  app,
  BrowserWindow,
  Tray,
  nativeImage,
  ipcMain,
  Notification,
  nativeTheme,
  screen,
  Menu,
  session,
  net,
  shell,
  dialog,
} from 'electron'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import http from 'http'
import { URL } from 'url'

let tray: Tray | null = null
let popupWindow: BrowserWindow | null = null
let dashboardWindow: BrowserWindow | null = null

const isDev = !app.isPackaged
const POPUP_WIDTH = 320
const POPUP_MAX_HEIGHT = 480
const DASHBOARD_WIDTH = 500
const DASHBOARD_HEIGHT = 650

// Vite dev server URL — vite-plugin-electron passes this via env
const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'

// In production, serve the bundled dist over a localhost HTTP server. Firebase Auth refuses
// to do its postMessage handshake with file:// origins (auth/unauthorized-domain). localhost
// is allowed by Firebase by default, so this is the cleanest fix.
let prodServerPort: number | null = null

function mimeType(ext: string): string {
  switch (ext) {
    case '.html': return 'text/html; charset=utf-8'
    case '.js': return 'application/javascript; charset=utf-8'
    case '.css': return 'text/css; charset=utf-8'
    case '.json': return 'application/json; charset=utf-8'
    case '.svg': return 'image/svg+xml'
    case '.png': return 'image/png'
    case '.jpg':
    case '.jpeg': return 'image/jpeg'
    case '.woff': return 'font/woff'
    case '.woff2': return 'font/woff2'
    default: return 'application/octet-stream'
  }
}

function startProdServer(): Promise<number> {
  return new Promise((resolve, reject) => {
    const distRoot = path.join(__dirname, '..', 'dist')
    const server = http.createServer((req, res) => {
      try {
        const reqUrl = new URL(req.url ?? '/', 'http://localhost')
        let pathname = decodeURIComponent(reqUrl.pathname)
        if (pathname === '/' || !path.extname(pathname)) {
          // SPA: any non-asset path falls through to index.html so HashRouter handles it
          pathname = '/index.html'
        }
        const filePath = path.normalize(path.join(distRoot, pathname))
        // Prevent path traversal — every served file must live under distRoot
        if (!filePath.startsWith(distRoot)) {
          res.writeHead(403)
          res.end('forbidden')
          return
        }
        if (!fs.existsSync(filePath)) {
          res.writeHead(404)
          res.end('not found')
          return
        }
        res.writeHead(200, { 'Content-Type': mimeType(path.extname(filePath)) })
        fs.createReadStream(filePath).pipe(res)
      } catch (err) {
        console.error('[prod-server] error:', err)
        res.writeHead(500)
        res.end('error')
      }
    })
    server.on('error', reject)
    // Bind to 127.0.0.1 only — never exposed beyond this machine
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      if (addr && typeof addr === 'object') {
        console.log(`[Main] Prod server listening on http://localhost:${addr.port}`)
        resolve(addr.port)
      } else {
        reject(new Error('Failed to obtain server port'))
      }
    })
  })
}

function getAppUrl(hash: string): string {
  if (isDev) return `${DEV_SERVER_URL}/#${hash}`
  if (!prodServerPort) throw new Error('Prod server not started')
  return `http://localhost:${prodServerPort}/#${hash}`
}

function getPreloadPath() {
  return path.join(__dirname, 'preload.js')
}

// Firebase signInWithPopup uses window.open() to open the OAuth popup. Electron 30+ blocks
// window.open by default — we have to opt the OAuth flow in explicitly. Anything else is denied.
function handleAuthPopup({ url }: { url: string }):
  | { action: 'deny' }
  | { action: 'allow'; overrideBrowserWindowOptions?: Electron.BrowserWindowConstructorOptions } {
  const allowedHosts = [
    'https://accounts.google.com',
    'https://webflow-team-login.firebaseapp.com',
    'https://apis.google.com',
  ]
  if (allowedHosts.some((host) => url.startsWith(host))) {
    return {
      action: 'allow',
      overrideBrowserWindowOptions: {
        width: 500,
        height: 650,
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
        },
      },
    }
  }
  console.warn('[Main] Blocked window.open to:', url)
  return { action: 'deny' }
}

type TrayStatus = 'green' | 'orange' | 'red'
let currentTrayStatus: TrayStatus = 'green'

// Resolves a tray icon by status. macOS auto-picks the @2x companion next to the base file
// for retina displays, so we only need to point at the 1x path.
function getStatusIconPath(status: TrayStatus) {
  const filename = `tray-${status}.png`
  const candidate = isDev
    ? path.join(process.cwd(), 'resources', filename)
    : path.join(process.resourcesPath, filename)

  if (fs.existsSync(candidate)) return candidate
  console.warn('[Main] Status tray icon not found at:', candidate)
  return null
}

function createPopupWindow() {
  popupWindow = new BrowserWindow({
    width: POPUP_WIDTH,
    height: POPUP_MAX_HEIGHT,
    show: false,
    frame: false,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    // No transparency — use solid background to avoid blank window
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#f6f6f6',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
    },
  })

  popupWindow.loadURL(getAppUrl('/popup'))

  // Log any load errors
  popupWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Popup] Failed to load: ${errorCode} - ${errorDescription}`)
  })

  popupWindow.webContents.on('did-finish-load', () => {
    console.log('[Popup] Page loaded successfully')
  })

  popupWindow.webContents.setWindowOpenHandler(handleAuthPopup)

  popupWindow.on('blur', () => {
    // Don't hide if DevTools is focused (dev mode)
    if (isDev && popupWindow?.webContents.isDevToolsFocused()) return
    popupWindow?.hide()
  })
}

function createDashboardWindow() {
  if (dashboardWindow && !dashboardWindow.isDestroyed()) {
    dashboardWindow.show()
    dashboardWindow.focus()
    return
  }

  dashboardWindow = new BrowserWindow({
    width: DASHBOARD_WIDTH,
    height: DASHBOARD_HEIGHT,
    minWidth: 400,
    minHeight: 500,
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1c1c1e' : '#f6f6f6',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
    },
  })

  dashboardWindow.loadURL(getAppUrl('/dashboard'))

  dashboardWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Dashboard] Failed to load: ${errorCode} - ${errorDescription}`)
  })

  dashboardWindow.webContents.setWindowOpenHandler(handleAuthPopup)

  dashboardWindow.once('ready-to-show', () => {
    dashboardWindow?.show()
  })

  dashboardWindow.on('close', (e) => {
    // If user is actually quitting (Cmd+Q, tray Quit), let the window close
    if (isQuitting) return
    // Otherwise just hide — app stays in tray
    e.preventDefault()
    dashboardWindow?.hide()
  })
}

function showPopupWindow() {
  if (!popupWindow || popupWindow.isDestroyed()) {
    createPopupWindow()
  }

  if (!tray) return

  const trayBounds = tray.getBounds()
  const windowBounds = popupWindow!.getBounds()
  const display = screen.getDisplayNearestPoint({
    x: trayBounds.x,
    y: trayBounds.y,
  })

  let x: number
  let y: number

  if (process.platform === 'darwin') {
    // macOS: popup below the menu bar icon, centered
    x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
    y = Math.round(trayBounds.y + trayBounds.height + 4)
  } else {
    // Windows: popup above the taskbar tray icon
    x = Math.round(trayBounds.x + trayBounds.width / 2 - windowBounds.width / 2)
    y = Math.round(trayBounds.y - windowBounds.height - 4)
  }

  // Keep within screen bounds
  const maxX = display.workArea.x + display.workArea.width - windowBounds.width
  const maxY = display.workArea.y + display.workArea.height - windowBounds.height
  x = Math.max(display.workArea.x, Math.min(x, maxX))
  y = Math.max(display.workArea.y, Math.min(y, maxY))

  popupWindow!.setPosition(x, y, false)
  popupWindow!.show()
  popupWindow!.focus()
}

function loadTrayIcon(status: TrayStatus): Electron.NativeImage | null {
  const iconPath = getStatusIconPath(status)
  if (!iconPath) return null
  const icon = nativeImage.createFromPath(iconPath)
  if (icon.isEmpty()) {
    console.error('[Main] Tray icon loaded empty:', iconPath)
    return null
  }
  // Colored icons must NOT be set as template images, otherwise macOS strips the colour
  // and renders them black-on-transparent.
  return icon
}

function setTrayStatus(status: TrayStatus) {
  if (!tray) return
  if (status === currentTrayStatus) return
  const icon = loadTrayIcon(status)
  if (!icon) return
  tray.setImage(icon)
  currentTrayStatus = status
}

function createTray() {
  const icon = loadTrayIcon(currentTrayStatus)
  if (!icon) {
    console.error('[Main] No tray icon found — tray will not be created.')
    return
  }

  tray = new Tray(icon)
  tray.setToolTip('Webflow Access Manager')
  console.log('[Main] Tray created with status:', currentTrayStatus)

  // Left-click: toggle popup
  tray.on('click', () => {
    if (popupWindow?.isVisible()) {
      popupWindow.hide()
    } else {
      showPopupWindow()
    }
  })

  // Right-click context menu (works on both macOS and Windows)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Open Dashboard',
      click: () => createDashboardWindow(),
    },
    { type: 'separator' },
    {
      label: 'Check for Updates…',
      click: () => { void checkForUpdates({ silent: false }) },
    },
    { type: 'separator' },
    {
      label: 'Quit Webflow Access Manager',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      click: () => {
        app.quit()
      },
    },
  ])
  tray.on('right-click', () => {
    tray?.popUpContextMenu(contextMenu)
  })
}

// ─── IPC Handlers ───

ipcMain.on('open-dashboard', () => {
  createDashboardWindow()
  popupWindow?.hide()
})

ipcMain.on('quit-app', () => {
  app.quit()
})

ipcMain.on('hide-popup', () => {
  popupWindow?.hide()
})

ipcMain.on('set-tray-status', (_event, status: TrayStatus) => {
  if (status === 'green' || status === 'orange' || status === 'red') {
    setTrayStatus(status)
  }
})

ipcMain.on('send-notification', (_event, payload: { title: string; body: string; requestId?: string }) => {
  const notification = new Notification({
    title: payload.title,
    body: payload.body,
    silent: false,
  })

  notification.on('click', () => {
    showPopupWindow()
  })

  notification.show()
})

ipcMain.handle('get-platform', () => process.platform)

ipcMain.handle('get-dark-mode', () => nativeTheme.shouldUseDarkColors)

ipcMain.handle('get-device-id', () => {
  const idPath = path.join(app.getPath('userData'), 'device-id')
  try {
    if (fs.existsSync(idPath)) {
      const stored = fs.readFileSync(idPath, 'utf8').trim()
      if (stored) return stored
    }
    const fresh = crypto.randomUUID()
    fs.writeFileSync(idPath, fresh, 'utf8')
    return fresh
  } catch (err) {
    console.error('[Main] Failed to read/write device id:', err)
    return crypto.randomUUID()
  }
})

// Listen for system theme changes
nativeTheme.on('updated', () => {
  const isDark = nativeTheme.shouldUseDarkColors
  popupWindow?.webContents.send('theme-changed', isDark)
  dashboardWindow?.webContents.send('theme-changed', isDark)
})

// ─── Auto-update (notify + 1-click download) ───
// Unsigned macOS builds can't use Squirrel/electron-updater (that requires an Apple
// Developer ID signature + notarization). Instead we poll the public GitHub Releases
// API, notify the user when a newer version exists, and open the matching installer for
// a one-click manual install. Swap this for electron-updater once the app is signed.
const GITHUB_REPO = 'Everything-Design/webflow-access-manager'

interface ReleaseAsset {
  name: string
  browser_download_url: string
}
interface GithubRelease {
  tag_name: string
  name: string
  body: string
  html_url: string
  assets: ReleaseAsset[]
}

function fetchLatestRelease(): Promise<GithubRelease> {
  return new Promise((resolve, reject) => {
    const request = net.request({
      method: 'GET',
      url: `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
    })
    request.setHeader('User-Agent', 'WebflowAccessManager-Updater')
    request.setHeader('Accept', 'application/vnd.github+json')
    let body = ''
    request.on('response', (response) => {
      if (response.statusCode !== 200) {
        response.on('data', () => {})
        response.on('end', () => reject(new Error(`GitHub API responded ${response.statusCode}`)))
        return
      }
      response.on('data', (chunk) => {
        body += chunk.toString()
      })
      response.on('end', () => {
        try {
          resolve(JSON.parse(body) as GithubRelease)
        } catch (err) {
          reject(err)
        }
      })
    })
    request.on('error', reject)
    request.end()
  })
}

// Numeric, prerelease-agnostic semver compare (e.g. "v2.3.1" > "2.3.0").
function isNewerVersion(latest: string, current: string): boolean {
  const norm = (v: string) =>
    v.replace(/^v/, '').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0)
  const a = norm(latest)
  const b = norm(current)
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] || 0
    const y = b[i] || 0
    if (x > y) return true
    if (x < y) return false
  }
  return false
}

// Pick the installer matching this machine: .dmg by chip on macOS, .exe on Windows.
function pickInstallerAsset(assets: ReleaseAsset[]): ReleaseAsset | undefined {
  if (process.platform === 'darwin') {
    const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
    return (
      assets.find((a) => a.name.endsWith('.dmg') && a.name.includes(arch)) ||
      assets.find((a) => a.name.endsWith('.dmg'))
    )
  }
  if (process.platform === 'win32') {
    return (
      assets.find((a) => a.name.endsWith('.exe') && /setup/i.test(a.name)) ||
      assets.find((a) => a.name.endsWith('.exe'))
    )
  }
  return undefined
}

let isCheckingForUpdates = false
async function checkForUpdates({ silent }: { silent: boolean }) {
  if (isCheckingForUpdates) return
  isCheckingForUpdates = true
  try {
    const release = await fetchLatestRelease()
    const current = app.getVersion()
    const latestTag = release.tag_name || ''

    if (!isNewerVersion(latestTag, current)) {
      if (!silent) {
        await dialog.showMessageBox({
          type: 'info',
          title: 'No Updates',
          message: "You're up to date.",
          detail: `Webflow Access Manager ${current} is the latest version.`,
          buttons: ['OK'],
        })
      }
      return
    }

    const notes = (release.body || '').trim()
    const detail = notes.length > 700 ? `${notes.slice(0, 700)}…` : notes
    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: 'Update Available',
      message: `Version ${latestTag.replace(/^v/, '')} is available.`,
      detail: detail || `You're on ${current}. A newer version is ready to download.`,
      buttons: ['Download & Install', 'Later'],
      defaultId: 0,
      cancelId: 1,
    })
    if (response !== 0) return

    const asset = pickInstallerAsset(release.assets || [])
    await shell.openExternal(asset ? asset.browser_download_url : release.html_url)

    const installSteps =
      process.platform === 'darwin'
        ? 'When the download finishes:\n1. Open the .dmg\n2. Drag Webflow Access Manager into Applications (replace the old one)\n3. Relaunch the app\n\nQuit now so you can replace it?'
        : 'When the download finishes, run the installer to update.\n\nQuit now so it can replace the running app?'
    const { response: postDownload } = await dialog.showMessageBox({
      type: 'info',
      title: 'Downloading Update',
      message: 'The new version is downloading in your browser.',
      detail: installSteps,
      buttons: ['Quit Now', 'Keep Running'],
      defaultId: 0,
      cancelId: 1,
    })
    if (postDownload === 0) app.quit()
  } catch (err) {
    console.error('[Updater] Update check failed:', err)
    if (!silent) {
      await dialog.showMessageBox({
        type: 'error',
        title: 'Update Check Failed',
        message: 'Could not check for updates.',
        detail: err instanceof Error ? err.message : String(err),
        buttons: ['OK'],
      })
    }
  } finally {
    isCheckingForUpdates = false
  }
}

// ─── App Lifecycle ───

function setupAppMenu() {
  // Minimal app menu — primarily for Cmd+Q on macOS to work
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(process.platform === 'darwin'
      ? [{
          label: app.name,
          submenu: [
            { role: 'about' as const },
            { type: 'separator' as const },
            { label: 'Check for Updates…', click: () => { void checkForUpdates({ silent: false }) } },
            { type: 'separator' as const },
            { role: 'hide' as const },
            { role: 'hideOthers' as const },
            { role: 'unhide' as const },
            { type: 'separator' as const },
            { role: 'quit' as const },
          ],
        }]
      : []),
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' as const },
        { role: 'redo' as const },
        { type: 'separator' as const },
        { role: 'cut' as const },
        { role: 'copy' as const },
        { role: 'paste' as const },
        { role: 'selectAll' as const },
      ],
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Open Dashboard',
          accelerator: 'CmdOrCtrl+D',
          click: () => createDashboardWindow(),
        },
        { type: 'separator' as const },
        { role: 'minimize' as const },
        { role: 'close' as const },
      ],
    },
  ]
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

app.on('ready', async () => {
  console.log('[Main] App ready. Dev mode:', isDev)
  console.log('[Main] Dev server URL:', DEV_SERVER_URL)

  if (!isDev) {
    try {
      prodServerPort = await startProdServer()
    } catch (err) {
      console.error('[Main] Failed to start prod server — falling back to file://:', err)
    }
  }

  // Content Security Policy — restricts what the renderer can load.
  // Firebase needs https/wss to googleapis.com & firebaseio.com; Vite HMR needs ws://localhost in dev.
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp =
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.googleapis.com https://*.gstatic.com" +
      (isDev ? " 'unsafe-eval' http://localhost:* ws://localhost:*; " : '; ') +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' data: https://fonts.gstatic.com; " +
      "img-src 'self' data: https: blob:; " +
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebasedatabase.app wss://*.firebasedatabase.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com" +
      (isDev ? ' http://localhost:* ws://localhost:*; ' : '; ') +
      "frame-src https://*.firebaseapp.com https://accounts.google.com;"
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    })
  })

  setupAppMenu()
  createTray()
  createPopupWindow()

  // Auto-check for updates shortly after launch — packaged builds only (the dev version
  // string isn't a real release). Silent: stays quiet unless an update is actually found.
  if (app.isPackaged) {
    setTimeout(() => {
      void checkForUpdates({ silent: true })
    }, 5000)
  }
})

// Track quit intent so close handlers know to actually close
let isQuitting = false
app.on('before-quit', () => { isQuitting = true })

app.on('window-all-closed', (e: Event) => {
  // Prevent app from quitting — it lives in the tray
  e.preventDefault()
})

app.on('activate', () => {
  // macOS: clicking dock icon opens dashboard
  createDashboardWindow()
})

// Single instance lock — prevent multiple instances
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showPopupWindow()
  })
}
