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
  // Firebase Auth has finished its initial state-restore and we know we have a valid token.
  // Reads/writes against the database (which need auth.uid) must wait for this flag.
  isFirebaseReady: boolean

  // Initialize — listens for Firebase Auth state, restores profile from local cache
  init: () => void
  cleanup: () => void
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  // Update profile (name, icon, color)
  updateUser: (updates: Partial<Pick<User, 'name' | 'profileIcon' | 'profileColor'>>) => Promise<void>
}

let authUnsubscribe: Unsubscribe | null = null

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  isLoading: true,
  isFirebaseReady: false,

  init: () => {
    // Idempotent — calling init twice should not register two listeners
    if (authUnsubscribe) return

    // First, restore cached profile for instant UI
    getPlatform().storage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          const cached: User = JSON.parse(raw)
          set({ currentUser: cached, isAuthenticated: true, isLoading: false })
          console.log('[Auth] Restored cached user:', cached.name)
        } catch {
          set({ isLoading: false })
        }
      } else {
        set({ isLoading: false })
      }
    })

    // Then, listen for Firebase Auth changes (handles session persistence, token refresh)
    authUnsubscribe = authFirebase.onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase Auth session exists — sync profile from database
        const { storage, device } = getPlatform()
        const deviceId = await device.getDeviceId()

        const user: User = {
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || undefined,
          deviceId,
          isOnline: true,
          lastSeen: Date.now() / 1000,
          // Preserve existing profile customizations from cache
          ...(() => {
            const { currentUser } = get()
            if (currentUser?.id === firebaseUser.uid) {
              return {
                profileIcon: currentUser.profileIcon,
                profileColor: currentUser.profileColor,
              }
            }
            return {}
          })(),
        }

        await firebaseService.registerUser(user)
        await storage.setItem(STORAGE_KEY, JSON.stringify(user))
        set({ currentUser: user, isAuthenticated: true, isLoading: false, isFirebaseReady: true })
        console.log('[Auth] Firebase session active for:', user.name)
      } else {
        // No Firebase Auth session
        const { currentUser } = get()
        if (currentUser) {
          // Was signed in, now signed out
          const { storage } = getPlatform()
          await storage.removeItem(STORAGE_KEY)
          set({ currentUser: null, isAuthenticated: false, isLoading: false, isFirebaseReady: true })
          console.log('[Auth] Firebase session ended')
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

  signUp: async (email, password, name) => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedName) throw new Error('Name is required')
    if (!trimmedEmail) throw new Error('Email is required')
    if (password.length < 6) throw new Error('Password must be at least 6 characters')

    // Firebase Auth creates the account — onAuthChanged will fire and sync the profile
    await authFirebase.signUpWithEmail(trimmedEmail, password, trimmedName)
  },

  signIn: async (email, password) => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail) throw new Error('Email is required')

    // Firebase Auth signs in — onAuthChanged will fire and sync the profile
    await authFirebase.signInWithEmail(trimmedEmail, password)
  },

  signInWithGoogle: async () => {
    // Google popup handles everything — onAuthChanged will fire and sync the profile
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
    // onAuthChanged listener will clear state
  },

  updateUser: async (updates) => {
    const { storage } = getPlatform()
    const { currentUser } = get()
    if (!currentUser) return

    const updated: User = { ...currentUser, ...updates }
    await firebaseService.registerUser(updated)
    await storage.setItem(STORAGE_KEY, JSON.stringify(updated))
    set({ currentUser: updated })
  },
}))
