export interface ElectronAPI {
  openDashboard: () => void
  quitApp: () => void
  hidePopup: () => void
  sendNotification: (payload: { title: string; body: string; requestId?: string }) => void
  getPlatform: () => Promise<string>
  getDarkMode: () => Promise<boolean>
  getDeviceId: () => Promise<string>
  onThemeChanged: (callback: (isDark: boolean) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
