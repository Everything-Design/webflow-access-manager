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
} from 'electron'
import path from 'path'

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

function getPreloadPath() {
  return path.join(__dirname, 'preload.js')
}

function getIconPath() {
  if (isDev) {
    return path.join(process.cwd(), 'resources', 'tray-icon.png')
  }
  return path.join(process.resourcesPath, 'tray-icon.png')
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
    },
  })

  if (isDev) {
    popupWindow.loadURL(`${DEV_SERVER_URL}/#/popup`)
  } else {
    popupWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/popup',
    })
  }

  // Log any load errors
  popupWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Popup] Failed to load: ${errorCode} - ${errorDescription}`)
  })

  popupWindow.webContents.on('did-finish-load', () => {
    console.log('[Popup] Page loaded successfully')
  })

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
    },
  })

  if (isDev) {
    dashboardWindow.loadURL(`${DEV_SERVER_URL}/#/dashboard`)
  } else {
    dashboardWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/dashboard',
    })
  }

  dashboardWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Dashboard] Failed to load: ${errorCode} - ${errorDescription}`)
  })

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

function createTray() {
  const icon = nativeImage.createFromPath(getIconPath())
  const trayIcon = icon.resize({ width: 18, height: 18 })
  if (process.platform === 'darwin') {
    trayIcon.setTemplateImage(true)
  }

  tray = new Tray(trayIcon)
  tray.setToolTip('Webflow Access Manager')

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
      label: 'Quit Webflow Access Manager',
      accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
      click: () => {
        app.exit(0)
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
  app.exit(0)
})

ipcMain.on('hide-popup', () => {
  popupWindow?.hide()
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
  const os = require('os')
  return os.hostname()
})

// Listen for system theme changes
nativeTheme.on('updated', () => {
  const isDark = nativeTheme.shouldUseDarkColors
  popupWindow?.webContents.send('theme-changed', isDark)
  dashboardWindow?.webContents.send('theme-changed', isDark)
})

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

app.on('ready', () => {
  console.log('[Main] App ready. Dev mode:', isDev)
  console.log('[Main] Dev server URL:', DEV_SERVER_URL)
  setupAppMenu()
  createTray()
  createPopupWindow()
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
