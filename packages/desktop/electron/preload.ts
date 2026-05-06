import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  openDashboard: () => ipcRenderer.send('open-dashboard'),
  quitApp: () => ipcRenderer.send('quit-app'),
  hidePopup: () => ipcRenderer.send('hide-popup'),

  // Notifications
  sendNotification: (payload: { title: string; body: string; requestId?: string }) =>
    ipcRenderer.send('send-notification', payload),

  // System info
  getPlatform: () => ipcRenderer.invoke('get-platform') as Promise<string>,
  getDarkMode: () => ipcRenderer.invoke('get-dark-mode') as Promise<boolean>,
  getDeviceId: () => ipcRenderer.invoke('get-device-id') as Promise<string>,

  // Theme change listener
  onThemeChanged: (callback: (isDark: boolean) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, isDark: boolean) => callback(isDark)
    ipcRenderer.on('theme-changed', handler)
    return () => ipcRenderer.removeListener('theme-changed', handler)
  },
})
