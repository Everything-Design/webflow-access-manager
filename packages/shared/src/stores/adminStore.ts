import { create } from 'zustand'
import * as firebaseService from '../services/firebaseService'
import type { Unsubscribe } from 'firebase/database'

export interface AdminState {
  adminUid: string | null
  isLoaded: boolean

  start: () => void
  stop: () => void
  claim: (uid: string) => Promise<void>
}

let unsub: Unsubscribe | null = null

export const useAdminStore = create<AdminState>((set) => ({
  adminUid: null,
  isLoaded: false,

  start: () => {
    if (unsub) return
    unsub = firebaseService.observeAdmin((adminUid) => {
      set({ adminUid, isLoaded: true })
    })
  },

  stop: () => {
    if (unsub) {
      unsub()
      unsub = null
    }
  },

  claim: async (uid) => {
    await firebaseService.claimAdmin(uid)
  },
}))
