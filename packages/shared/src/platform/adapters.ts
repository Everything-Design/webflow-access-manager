// ─── Platform Adapter Interfaces ───
// Each platform (desktop, mobile) implements these.
// Call configurePlatform() at app startup before any store access.

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
}

export interface NotificationAdapter {
  send(title: string, body: string, data?: Record<string, string>): Promise<void>
}

export interface DeviceAdapter {
  getDeviceId(): Promise<string>
}

export interface PlatformAdapters {
  storage: StorageAdapter
  notification: NotificationAdapter
  device: DeviceAdapter
}

let platform: PlatformAdapters | null = null

export function configurePlatform(adapters: PlatformAdapters) {
  platform = adapters
}

export function getPlatform(): PlatformAdapters {
  if (!platform) {
    throw new Error(
      'Platform not configured. Call configurePlatform() before using stores.'
    )
  }
  return platform
}
