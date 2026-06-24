export interface ElectronAPI {
  openDashboard: () => void
  openSettings: () => void
  quitApp: () => void
  hidePopup: () => void
  sendNotification: (payload: { title: string; body: string; requestId?: string }) => void
  setTrayStatus: (status: 'green' | 'orange' | 'red') => void
  getPlatform: () => Promise<string>
  getDarkMode: () => Promise<boolean>
  getDeviceId: () => Promise<string>
  getAppVersion: () => Promise<string>
  checkForUpdates: () => Promise<void>
  getLaunchAtLogin: () => Promise<boolean>
  setLaunchAtLogin: (enabled: boolean) => Promise<boolean>
  getPopupPinned: () => Promise<boolean>
  togglePopupPinned: () => Promise<boolean>
  resizePopup: (height: number) => void
  onShowSettings: (callback: () => void) => () => void
  onThemeChanged: (callback: (isDark: boolean) => void) => () => void
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
