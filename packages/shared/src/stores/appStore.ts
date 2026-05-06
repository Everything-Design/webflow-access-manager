import { create } from 'zustand'
import type { Account, ClientAccount, AccessRequest, User } from '../types/models'
import * as firebaseService from '../services/firebaseService'
import { getPlatform } from '../platform/adapters'
import { generateId } from '../utils/helpers'
import type { Unsubscribe } from 'firebase/database'

export interface AppState {
  accounts: Account[]
  clientAccounts: ClientAccount[]
  users: User[]
  accessRequests: AccessRequest[]
  pendingRequestsForCurrentUser: AccessRequest[]
  isConnected: boolean

  // wsId is now required for all workspace-scoped operations
  setupListeners: (userId: string, wsId: string) => void
  removeListeners: () => void

  claimAccount: (account: Account, user: User) => Promise<void>
  releaseAccount: (accountId: string) => Promise<void>
  createAccountSlot: (accountId: string, label?: string) => Promise<void>
  deleteAccountSlot: (accountId: string) => Promise<void>

  setClientAccount: (clientName: string, user: User) => Promise<void>
  clearClientAccount: (clientAccountId: string) => Promise<void>

  requestAccess: (account: Account, user: User, note?: string) => Promise<void>
  releaseAccountForRequest: (request: AccessRequest, responseNote?: string) => Promise<void>
  rejectRequest: (requestId: string, responseNote?: string) => Promise<void>
  cancelRequest: (requestId: string) => Promise<void>
}

let unsubscribers: Unsubscribe[] = []
let activeWsId: string | null = null

export const useAppStore = create<AppState>((set, get) => ({
  accounts: [],
  clientAccounts: [],
  users: [],
  accessRequests: [],
  pendingRequestsForCurrentUser: [],
  isConnected: false,

  setupListeners: (userId, wsId) => {
    get().removeListeners()
    activeWsId = wsId
    console.log('[AppStore] Setting up listeners for workspace:', wsId)

    unsubscribers.push(
      firebaseService.observeConnection((connected) => set({ isConnected: connected }))
    )

    unsubscribers.push(
      firebaseService.observeAccounts(wsId, (accounts) => set({ accounts }))
    )

    unsubscribers.push(
      firebaseService.observeClientAccounts(wsId, (clientAccounts) => set({ clientAccounts }))
    )

    unsubscribers.push(
      firebaseService.observeUsers((users) => set({ users }))
    )

    unsubscribers.push(
      firebaseService.observeAccessRequests(wsId, (allRequests) => {
        const previous = get().accessRequests

        // Pending requests where I'm the OWNER (someone wants my account)
        const incomingPending = allRequests.filter(
          (r) => r.ownerId === userId && r.status === 'pending'
        )

        // Notify owner of NEW incoming requests
        const previousIncomingIds = new Set(
          previous.filter((r) => r.ownerId === userId && r.status === 'pending').map((r) => r.id)
        )
        for (const request of incomingPending) {
          if (!previousIncomingIds.has(request.id)) {
            const accountName = request.accountLabel ?? request.accountId
            getPlatform().notification.send(
              'Webflow Account Access Request',
              `${request.requesterName} is requesting access to ${accountName}`,
              { requestId: request.id }
            )
          }
        }

        // Detect outgoing request status transitions (notify requester when approved/rejected)
        const previousById = new Map(previous.map((r) => [r.id, r]))
        for (const request of allRequests) {
          if (request.requesterId !== userId) continue
          const before = previousById.get(request.id)
          if (!before) continue // brand new — not a transition
          if (before.status !== 'pending') continue // wasn't pending before
          if (request.status === 'pending') continue // still pending
          // Status transitioned out of 'pending'
          const accountName = request.accountLabel ?? request.accountId
          if (request.status === 'released' || request.status === 'approved') {
            getPlatform().notification.send(
              'Request Approved',
              `${request.ownerName} released ${accountName}${request.responseNote ? ` — "${request.responseNote}"` : ''}`,
              { requestId: request.id }
            )
          } else if (request.status === 'rejected') {
            getPlatform().notification.send(
              'Request Declined',
              `${request.ownerName} declined your request${request.responseNote ? ` — "${request.responseNote}"` : ''}`,
              { requestId: request.id }
            )
          }
        }

        // Store only pending requests in accessRequests (UI uses this for "active request" checks)
        const pending = allRequests.filter((r) => r.status === 'pending')
        set({
          accessRequests: pending,
          pendingRequestsForCurrentUser: incomingPending,
        })
      })
    )
  },

  removeListeners: () => {
    for (const unsub of unsubscribers) unsub()
    unsubscribers = []
    activeWsId = null
  },

  // All actions use the active workspace ID

  claimAccount: async (account, user) => {
    if (!activeWsId) return
    await firebaseService.claimAccount(activeWsId, account.id, user)
  },

  releaseAccount: async (accountId) => {
    if (!activeWsId) return
    await firebaseService.releaseAccount(activeWsId, accountId)
    // Auto-resolve any pending requests for this account — the requester will get notified
    const stalePending = get().accessRequests.filter(
      (r) => r.accountId === accountId && r.status === 'pending'
    )
    for (const req of stalePending) {
      try {
        await firebaseService.updateAccessRequestStatus(activeWsId, req.id, 'released')
      } catch (err) {
        console.warn('[AppStore] Failed to auto-resolve stale request:', req.id, err)
      }
    }
  },

  createAccountSlot: async (accountId, label) => {
    if (!activeWsId) return
    await firebaseService.createAccountSlot(activeWsId, accountId, label)
  },

  deleteAccountSlot: async (accountId) => {
    if (!activeWsId) return
    await firebaseService.deleteAccountSlot(activeWsId, accountId)
  },

  setClientAccount: async (clientName, user) => {
    if (!activeWsId) return
    await firebaseService.setClientAccount(activeWsId, clientName, user)
  },

  clearClientAccount: async (clientAccountId) => {
    if (!activeWsId) return
    await firebaseService.clearClientAccount(activeWsId, clientAccountId)
  },

  requestAccess: async (account, user, note) => {
    if (!activeWsId || !account.occupiedBy || !account.occupiedByName) return
    const request: AccessRequest = {
      id: generateId(),
      requesterId: user.id,
      requesterName: user.name,
      accountId: account.id,
      accountLabel: account.label,
      ownerId: account.occupiedBy,
      ownerName: account.occupiedByName,
      status: 'pending',
      requestedAt: Date.now() / 1000,
      ...(note && note.trim() && { requesterNote: note.trim() }),
    }
    await firebaseService.createAccessRequest(activeWsId, request)
  },

  releaseAccountForRequest: async (request, responseNote) => {
    if (!activeWsId) return
    await firebaseService.releaseAccount(activeWsId, request.accountId)
    await firebaseService.updateAccessRequestStatus(activeWsId, request.id, 'released', responseNote)
    // Clean up any OTHER pending requests for the same account
    const otherPending = get().accessRequests.filter(
      (r) => r.accountId === request.accountId && r.id !== request.id && r.status === 'pending'
    )
    for (const r of otherPending) {
      try {
        await firebaseService.updateAccessRequestStatus(activeWsId, r.id, 'released')
      } catch (err) {
        console.warn('[AppStore] Failed to auto-resolve sibling request:', r.id, err)
      }
    }
  },

  rejectRequest: async (requestId, responseNote) => {
    if (!activeWsId) return
    await firebaseService.updateAccessRequestStatus(activeWsId, requestId, 'rejected', responseNote)
  },

  cancelRequest: async (requestId) => {
    if (!activeWsId) return
    await firebaseService.deleteAccessRequest(activeWsId, requestId)
  },
}))
