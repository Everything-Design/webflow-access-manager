import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  openDashboard: () => ipcRenderer.send('open-dashboard'),
  quitApp: () => ipcRenderer.send('quit-app'),
  hidePopup: () => ipcRenderer.send('hide-popup'),

  // Tray icon — colour signals app state
  setTrayStatus: (status: 'green' | 'orange' | 'red') =>
    ipcRenderer.send('set-tray-status', status),

  // Notifications
  sendNotification: (payload: { title: string; body: string; requestId?: string }) =>
    ipcRenderer.send('send-notification', payload),

  // System info
  getPlatform: () => ipcRenderer.invoke('get-platform') as Promise<string>,
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode') as Promise<boolean>,
  getDeviceId: () => ipcRenderer.invoke('get-device-id') as Promise<string>,
  getAppVersion: () => ipcRenderer.invoke('get-app-version') as Promise<string>,

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates') as Promise<void>,

  // Launch at login
  getLaunchAtLogin: () => ipcRenderer.invoke('get-launch-at-login') as Promise<boolean>,
  setLaunchAtLogin: (enabled: boolean) =>
    ipcRenderer.invoke('set-launch-at-login', enabled) as Promise<boolean>,

  // Theme change listener
  onThemeChanged: (callback: (isDark: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isDark: boolean) => callback(isDark)
    ipcRenderer.on('theme-changed', handler)
    return () => ipcRenderer.removeListener('theme-changed', handler)
  },
})
