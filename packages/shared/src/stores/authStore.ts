import { create } from 'zustand'
import type { User } from '../types/models'
import * as firebaseService from '../services/firebaseService'
import * as authFirebase from '../services/authFirebase'
import { getPlatform } from '../platform/adapters'
import type { Unsubscribe } from 'firebase/auth'

const STORAGE_KEY = 'webflow_current_user'

export interface AuthState {
  currentUser: User | null
  isAuthenticated: boolean
  isLoading: boolean
  isFirebaseReady: boolean

  init: () => void
  cleanup: () => void
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<Pick<User, 'name' | 'profileIcon' | 'profileColor'>>) => Promise<void>
  // Subscribe to your own /team/{uid} record so status changes (admin approve/reject)
  // propagate to the running app immediately, with no need for a refresh.
  subscribeOwnStatus: () => () => void
}

let authUnsubscribe: Unsubscribe | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  isFirebaseReady: false,

  init: () => {
    if (authUnsubscribe) return

    getPlatform().storage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const cached: User = JSON.parse(raw)
          // v1.x cached profiles have no `status` field — default to 'pending' so the
          // gate logic doesn't behave unpredictably while waiting for Firebase Auth.
          if (!cached.status) cached.status = 'pending'
          set({ currentUser: cached, isAuthenticated: true, isLoading: false })
          console.log('[Auth] Restored cached user:', cached.name)
        } catch {
          set({ isLoading: false })
        }
      } else {
        set({ isLoading: false })
      }
    })

    authUnsubscribe = authFirebase.onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        const { storage, device } = getPlatform()
        const deviceId = await device.getDeviceId()

        const cached = get().currentUser
        const baseUser: Omit<User, 'status'> = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || cached?.name || '',
          email: firebaseUser.email || undefined,
          deviceId,
          isOnline: true,
          lastSeen: Date.now() / 1000,
          ...(cached?.id === firebaseUser.uid && {
            profileIcon: cached.profileIcon,
            profileColor: cached.profileColor,
          }),
        }

        // Creates with status='pending' on first sign-in; preserves status on subsequent
        // sign-ins. If rules block this write (e.g. rules not published yet) we still
        // advance the gate so the user sees a useful error rather than a spinner.
        try {
          await firebaseService.registerTeamMember(baseUser)
        } catch (err) {
          console.error('[Auth] registerTeamMember failed:', err)
        }

        // After registration, the live status comes from Firebase. The subscription
        // (subscribeOwnStatus) updates currentUser.status as the admin acts.
        const user: User = { ...baseUser, status: cached?.status ?? 'pending' }
        await storage.setItem(STORAGE_KEY, JSON.stringify(user))
        set({ currentUser: user, isAuthenticated: true, isLoading: false, isFirebaseReady: true })
        console.log('[Auth] Firebase session active for:', user.name)
      } else {
        const cached = get().currentUser
        if (cached) {
          await getPlatform().storage.removeItem(STORAGE_KEY)
          set({ currentUser: null, isAuthenticated: false, isLoading: false, isFirebaseReady: true })
        } else {
          set({ isLoading: false, isFirebaseReady: true })
        }
      }
    })
  },

  cleanup: () => {
    if (authUnsubscribe) {
      authUnsubscribe()
      authUnsubscribe = null
    }
  },

  signInWithGoogle: async () => {
    await authFirebase.signInWithGoogle()
  },

  signOut: async () => {
    const { currentUser } = get()
    if (currentUser) {
      try {
        await firebaseService.updateUserPresence(currentUser.id, false)
      } catch {
        // Best-effort
      }
    }
    await authFirebase.signOutFirebase()
  },

  updateUser: async (updates) => {
    const { currentUser } = get()
    if (!currentUser) return

    const updated: User = { ...currentUser, ...updates }
    await firebaseService.updateMemberProfile(currentUser.id, updates)
    await getPlatform().storage.setItem(STORAGE_KEY, JSON.stringify(updated))
    set({ currentUser: updated })
  },

  subscribeOwnStatus: () => {
    const { currentUser } = get()
    if (!currentUser) return () => {}

    return firebaseService.observeOwnTeamRecord(currentUser.id, (me) => {
      if (!me) return
      const current = get().currentUser
      if (!current) return
      if (current.status !== me.status || current.name !== me.name) {
        const updated: User = { ...current, status: me.status, name: me.name }
        set({ currentUser: updated })
        getPlatform().storage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {})
      }
    })
  },
}))
