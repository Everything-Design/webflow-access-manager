import { create } from 'zustand'
import type { Account, ClientAccount, AccessRequest, User } from '../types/models'
import * as firebaseService from '../services/firebaseService'
import { getPlatform } from '../platform/adapters'
import { generateId } from '../utils/helpers'
import type { Unsubscribe } from 'firebase/database'

export interface AppState {
  accounts: Account[]
  clientAccounts: ClientAccount[]
  team: User[]
  // accessRequests: pending requests only — used for "active request" UI checks
  accessRequests: AccessRequest[]
  // allAccessRequests: everything we've seen (incl. resolved) — kept in memory so the
  // recent-activity view can render. Trimmed to the last 25 for memory bounds.
  allAccessRequests: AccessRequest[]
  pendingRequestsForCurrentUser: AccessRequest[]
  pendingTeamMembers: User[]
  isConnected: boolean

  setupListeners: (userId: string) => void
  removeListeners: () => void

  claimAccount: (account: Account, user: User) => Promise<void>
  releaseAccount: (accountId: string) => Promise<void>
  forceReleaseAccount: (accountId: string) => Promise<void>
  createAccountSlot: (accountId: string, label?: string) => Promise<void>
  deleteAccountSlot: (accountId: string) => Promise<void>
  updateAccountLabel: (accountId: string, label: string) => Promise<void>

  setClientAccount: (clientName: string, user: User) => Promise<void>
  clearClientAccount: (clientAccountId: string) => Promise<void>

  requestAccess: (account: Account, user: User, note?: string) => Promise<void>
  releaseAccountForRequest: (request: AccessRequest, responseNote?: string) => Promise<void>
  rejectRequest: (requestId: string, responseNote?: string) => Promise<void>
  cancelRequest: (requestId: string) => Promise<void>

  approveTeamMember: (uid: string) => Promise<void>
  rejectTeamMember: (uid: string) => Promise<void>
  removeTeamMember: (uid: string) => Promise<void>
}

let unsubscribers: Unsubscribe[] = []

export const useAppStore = create<AppState>((set, get) => ({
  accounts: [],
  clientAccounts: [],
  team: [],
  accessRequests: [],
  allAccessRequests: [],
  pendingRequestsForCurrentUser: [],
  pendingTeamMembers: [],
  isConnected: false,

  setupListeners: (userId) => {
    get().removeListeners()
    console.log('[AppStore] Setting up listeners for user:', userId)

    unsubscribers.push(
      firebaseService.observeConnection((connected) => {
        set({ isConnected: connected })
        // On every (re)connect, re-arm presence so a member doesn't get stuck "offline"
        // to the team after a network drop (onDisconnect already flipped them to false).
        if (connected) {
          firebaseService.reassertPresence(userId).catch((err) =>
            console.error('[AppStore] Failed to re-assert presence on reconnect:', err)
          )
        }
      })
    )

    unsubscribers.push(
      firebaseService.observeAccounts((accounts) => set({ accounts }))
    )

    unsubscribers.push(
      firebaseService.observeClientAccounts((clientAccounts) => set({ clientAccounts }))
    )

    unsubscribers.push(
      firebaseService.observeTeam((team) => {
        set({
          team,
          pendingTeamMembers: team.filter((m) => m.status === 'pending'),
        })
      })
    )

    unsubscribers.push(
      firebaseService.observeAccessRequests((allRequests) => {
        const previous = get().accessRequests

        const incomingPending = allRequests.filter(
          (r) => r.ownerId === userId && r.status === 'pending'
        )

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

        const previousById = new Map(previous.map((r) => [r.id, r]))
        for (const request of allRequests) {
          if (request.requesterId !== userId) continue
          const before = previousById.get(request.id)
          if (!before) continue
          if (before.status !== 'pending') continue
          if (request.status === 'pending') continue
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

        const pending = allRequests.filter((r) => r.status === 'pending')

        // Keep the last 25 requests (any status) for the "Recent activity" view.
        // Sort by requestedAt desc so newest first, slice for memory bound.
        const sortedAll = [...allRequests].sort((a, b) => (b.requestedAt ?? 0) - (a.requestedAt ?? 0))
        const allAccessRequests = sortedAll.slice(0, 25)

        set({
          accessRequests: pending,
          allAccessRequests,
          pendingRequestsForCurrentUser: incomingPending,
        })
      })
    )
  },

  removeListeners: () => {
    for (const unsub of unsubscribers) unsub()
    unsubscribers = []
  },

  claimAccount: async (account, user) => {
    await firebaseService.claimAccount(account.id, user)
  },

  releaseAccount: async (accountId) => {
    await firebaseService.releaseAccount(accountId)
    const stalePending = get().accessRequests.filter(
      (r) => r.accountId === accountId && r.status === 'pending'
    )
    for (const req of stalePending) {
      try {
        await firebaseService.updateAccessRequestStatus(req.id, 'released')
      } catch (err) {
        console.warn('[AppStore] Failed to auto-resolve stale request:', req.id, err)
      }
    }
  },

  createAccountSlot: async (accountId, label) => {
    await firebaseService.createAccountSlot(accountId, label)
  },

  deleteAccountSlot: async (accountId) => {
    await firebaseService.deleteAccountSlot(accountId)
  },

  updateAccountLabel: async (accountId, label) => {
    await firebaseService.updateAccountLabel(accountId, label.trim())
  },

  // Admin override of releaseAccount. Same side-effect surface (auto-resolves stale
  // pending requests) so the rest of the UI doesn't need a different code path.
  forceReleaseAccount: async (accountId) => {
    await firebaseService.forceReleaseAccount(accountId)
    const stalePending = get().accessRequests.filter(
      (r) => r.accountId === accountId && r.status === 'pending'
    )
    for (const req of stalePending) {
      try {
        await firebaseService.updateAccessRequestStatus(req.id, 'released')
      } catch (err) {
        console.warn('[AppStore] Failed to auto-resolve stale request after force release:', req.id, err)
      }
    }
  },

  setClientAccount: async (clientName, user) => {
    await firebaseService.setClientAccount(clientName, user)
  },

  clearClientAccount: async (clientAccountId) => {
    await firebaseService.clearClientAccount(clientAccountId)
  },

  requestAccess: async (account, user, note) => {
    if (!account.occupiedBy || !account.occupiedByName) return
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
    await firebaseService.createAccessRequest(request)
  },

  releaseAccountForRequest: async (request, responseNote) => {
    await firebaseService.releaseAccount(request.accountId)
    await firebaseService.updateAccessRequestStatus(request.id, 'released', responseNote)
    const otherPending = get().accessRequests.filter(
      (r) => r.accountId === request.accountId && r.id !== request.id && r.status === 'pending'
    )
    for (const r of otherPending) {
      try {
        await firebaseService.updateAccessRequestStatus(r.id, 'released')
      } catch (err) {
        console.warn('[AppStore] Failed to auto-resolve sibling request:', r.id, err)
      }
    }
  },

  rejectRequest: async (requestId, responseNote) => {
    await firebaseService.updateAccessRequestStatus(requestId, 'rejected', responseNote)
  },

  cancelRequest: async (requestId) => {
    await firebaseService.deleteAccessRequest(requestId)
  },

  approveTeamMember: async (uid) => {
    await firebaseService.updateMemberStatus(uid, 'approved')
  },

  rejectTeamMember: async (uid) => {
    await firebaseService.updateMemberStatus(uid, 'rejected')
  },

  removeTeamMember: async (uid) => {
    await firebaseService.removeTeamMember(uid)
  },
}))
