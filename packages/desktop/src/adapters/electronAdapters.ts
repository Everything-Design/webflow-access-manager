import type { StorageAdapter, NotificationAdapter, DeviceAdapter, PlatformAdapters } from '@wam/shared'

const storage: StorageAdapter = {
  async getItem(key) {
    return localStorage.getItem(key)
  },
  async setItem(key, value) {
    localStorage.setItem(key, value)
  },
  async removeItem(key) {
    localStorage.removeItem(key)
  },
}

const notification: NotificationAdapter = {
  async send(title, body, data) {
    window.electronAPI?.sendNotification({ title, body, requestId: data?.requestId })
  },
}

const device: DeviceAdapter = {
  async getDeviceId() {
    if (window.electronAPI) {
      return window.electronAPI.getDeviceId()
    }
    return 'unknown-device'
  },
}

export const electronAdapters: PlatformAdapters = { storage, notification, device }
