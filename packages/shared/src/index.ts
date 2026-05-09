// Platform
export { configurePlatform, getPlatform } from './platform/adapters'
export type { PlatformAdapters, StorageAdapter, NotificationAdapter, DeviceAdapter } from './platform/adapters'

// Types
export type {
  User,
  Account,
  ClientAccount,
  AccessRequest,
  AccessRequestStatus,
  TeamMemberStatus,
} from './types/models'
export { isAccountAvailable } from './types/models'

// Firebase
export { initFirebase } from './services/firebase'
export type { FirebaseConfig } from './services/firebase'
export * as firebaseService from './services/firebaseService'
export * as authFirebase from './services/authFirebase'

// Stores
export { useAuthStore } from './stores/authStore'
export type { AuthState } from './stores/authStore'
export { useAppStore } from './stores/appStore'
export type { AppState } from './stores/appStore'
export { useAdminStore } from './stores/adminStore'
export type { AdminState } from './stores/adminStore'

// Utils
export { generateId, formatDuration, getAccountDisplayName } from './utils/helpers'
