import { create } from 'zustand'
import * as firebaseService from '../services/firebaseService'
import type { Unsubscribe } from 'firebase/database'

export interface AdminState {
  adminUid: string | null
  isLoaded: boolean
  // True only when the admin observer truly saw "no admin" — distinguishes the legitimate
  // "first user can claim" case from "read failed and we don't actually know." Without
  // this, a permission-denied read on /admin makes the gate render ClaimAdmin even when
  // an admin already exists, and the resulting write fails with PERMISSION_DENIED.
  readFailed: boolean

  start: () => void
  stop: () => void
  claim: (uid: string) => Promise<void>
}

let unsub: Unsubscribe | null = null

export const useAdminStore = create<AdminState>((set) => ({
  adminUid: null,
  isLoaded: false,
  readFailed: false,

  start: () => {
    if (unsub) return
    unsub = firebaseService.observeAdmin((adminUid, err) => {
      set({ adminUid, isLoaded: true, readFailed: !!err })
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
