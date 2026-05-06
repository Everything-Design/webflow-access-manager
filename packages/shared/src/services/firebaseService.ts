import {
  ref,
  onValue,
  set,
  update,
  remove,
  serverTimestamp,
  onDisconnect,
  Unsubscribe,
} from 'firebase/database'
import { getDb } from './firebase'
import type { User, Account, ClientAccount, AccessRequest, AccessRequestStatus } from '../types/models'
import { generateId } from '../utils/helpers'

function toTimestamp(val: unknown): number | undefined {
  if (typeof val === 'number' && val > 0) return val
  return undefined
}

// Helper: workspace-scoped path
function wsPath(wsId: string, path: string) {
  return `workspaces/${wsId}/${path}`
}

// ─── Connection Status (global) ───

export function observeConnection(callback: (connected: boolean) => void): Unsubscribe {
  return onValue(
    ref(getDb(), '.info/connected'),
    (snapshot) => callback(snapshot.val() === true),
    (error) => console.error('[Firebase] Connection error:', error)
  )
}

// ─── Accounts (workspace-scoped) ───

export function observeAccounts(wsId: string, callback: (accounts: Account[]) => void): Unsubscribe {
  return onValue(
    ref(getDb(), wsPath(wsId, 'accounts')),
    (snapshot) => {
      const accounts: Account[] = []
      snapshot.forEach((child) => {
        const data = child.val()
        if (data) {
          accounts.push({
            id: child.key!,
            label: data.label || undefined,
            isOccupied: data.isOccupied === true,
            occupiedBy: data.occupiedBy || undefined,
            occupiedByName: data.occupiedByName || undefined,
            occupiedSince: toTimestamp(data.occupiedSince),
            hasPendingRequest: data.hasPendingRequest === true,
          })
        }
      })
      callback(accounts.sort((a, b) => a.id.localeCompare(b.id)))
    },
    (error) => console.error('[Firebase] Accounts error:', error)
  )
}

export async function claimAccount(wsId: string, accountId: string, user: User): Promise<void> {
  try {
    await update(ref(getDb(), wsPath(wsId, `accounts/${accountId}`)), {
      isOccupied: true,
      occupiedBy: user.id,
      occupiedByName: user.name,
      occupiedSince: serverTimestamp(),
    })
  } catch (error) {
    console.error('[Firebase] Failed to claim account:', error)
    throw error
  }
}

export async function releaseAccount(wsId: string, accountId: string): Promise<void> {
  try {
    await update(ref(getDb(), wsPath(wsId, `accounts/${accountId}`)), {
      isOccupied: false,
      occupiedBy: null,
      occupiedByName: null,
      occupiedSince: null,
      hasPendingRequest: false,
    })
  } catch (error) {
    console.error('[Firebase] Failed to release account:', error)
    throw error
  }
}

export async function deleteAccountSlot(wsId: string, accountId: string): Promise<void> {
  try {
    await remove(ref(getDb(), wsPath(wsId, `accounts/${accountId}`)))
  } catch (error) {
    console.error('[Firebase] Failed to delete account slot:', error)
    throw error
  }
}

export async function createAccountSlot(wsId: string, accountId: string, label?: string): Promise<void> {
  try {
    await set(ref(getDb(), wsPath(wsId, `accounts/${accountId}`)), {
      id: accountId,
      isOccupied: false,
      hasPendingRequest: false,
      ...(label && { label }),
    })
  } catch (error) {
    console.error('[Firebase] Failed to create account slot:', error)
    throw error
  }
}

// ─── Client Accounts (workspace-scoped) ───

export function observeClientAccounts(wsId: string, callback: (accounts: ClientAccount[]) => void): Unsubscribe {
  return onValue(
    ref(getDb(), wsPath(wsId, 'clientAccounts')),
    (snapshot) => {
      const accounts: ClientAccount[] = []
      snapshot.forEach((child) => {
        const data = child.val()
        if (data) {
          accounts.push({
            id: child.key!,
            clientName: data.clientName || '',
            createdAt: toTimestamp(data.createdAt) ?? Date.now() / 1000,
            createdBy: data.createdBy || '',
            createdByName: data.createdByName || '',
            isActive: data.isActive,
          })
        }
      })
      callback(accounts)
    },
    (error) => console.error('[Firebase] Client accounts error:', error)
  )
}

export async function setClientAccount(wsId: string, clientName: string, user: User): Promise<void> {
  try {
    const id = generateId()
    await set(ref(getDb(), wsPath(wsId, `clientAccounts/${id}`)), {
      id,
      clientName,
      createdBy: user.id,
      createdByName: user.name,
      createdAt: serverTimestamp(),
      isActive: true,
    })
  } catch (error) {
    console.error('[Firebase] Failed to set client account:', error)
    throw error
  }
}

export async function clearClientAccount(wsId: string, clientAccountId: string): Promise<void> {
  try {
    await remove(ref(getDb(), wsPath(wsId, `clientAccounts/${clientAccountId}`)))
  } catch (error) {
    console.error('[Firebase] Failed to clear client account:', error)
    throw error
  }
}

// ─── Users (global — not workspace-scoped) ───

export function observeUsers(callback: (users: User[]) => void): Unsubscribe {
  return onValue(
    ref(getDb(), 'users'),
    (snapshot) => {
      const users: User[] = []
      snapshot.forEach((child) => {
        const data = child.val()
        if (data) {
          users.push({
            id: child.key!,
            name: data.name || '',
            email: data.email,
            deviceId: data.deviceId,
            isOnline: data.isOnline === true,
            lastSeen: toTimestamp(data.lastSeen) ?? Date.now() / 1000,
            profileIcon: data.profileIcon,
            profileColor: data.profileColor,
          })
        }
      })
      callback(users)
    },
    (error) => console.error('[Firebase] Users error:', error)
  )
}

export async function registerUser(user: User): Promise<void> {
  try {
    await set(ref(getDb(), `users/${user.id}`), {
      id: user.id,
      name: user.name,
      isOnline: true,
      lastSeen: serverTimestamp(),
      ...(user.email && { email: user.email }),
      ...(user.profileIcon && { profileIcon: user.profileIcon }),
      ...(user.profileColor && { profileColor: user.profileColor }),
    })
    await onDisconnect(ref(getDb(), `users/${user.id}/isOnline`)).set(false)
  } catch (error) {
    console.error('[Firebase] Failed to register user:', error)
    throw error
  }
}

export async function updateUserPresence(userId: string, online: boolean): Promise<void> {
  try {
    await update(ref(getDb(), `users/${userId}`), {
      isOnline: online,
      lastSeen: serverTimestamp(),
    })
  } catch (error) {
    console.error('[Firebase] Failed to update presence:', error)
    throw error
  }
}

// ─── Access Requests (workspace-scoped) ───

export function observeAccessRequests(wsId: string, callback: (requests: AccessRequest[]) => void): Unsubscribe {
  return onValue(
    ref(getDb(), wsPath(wsId, 'accessRequests')),
    (snapshot) => {
      const requests: AccessRequest[] = []
      snapshot.forEach((child) => {
        const data = child.val()
        if (data) {
          requests.push({
            id: child.key!,
            requesterId: data.requesterId || '',
            requesterName: data.requesterName || '',
            accountId: data.accountId || '',
            accountLabel: data.accountLabel,
            ownerId: data.ownerId || '',
            ownerName: data.ownerName || '',
            status: data.status || 'pending',
            requestedAt: toTimestamp(data.requestedAt) ?? Date.now() / 1000,
            requesterNote: data.requesterNote,
            responseNote: data.responseNote,
          })
        }
      })
      // Return ALL requests; consumer filters as needed (lets us detect status transitions)
      callback(requests)
    },
    (error) => console.error('[Firebase] Access requests error:', error)
  )
}

export async function createAccessRequest(wsId: string, request: AccessRequest): Promise<void> {
  try {
    await set(ref(getDb(), wsPath(wsId, `accessRequests/${request.id}`)), {
      id: request.id,
      requesterId: request.requesterId,
      requesterName: request.requesterName,
      accountId: request.accountId,
      accountLabel: request.accountLabel,
      ownerId: request.ownerId,
      ownerName: request.ownerName,
      status: 'pending',
      requestedAt: serverTimestamp(),
      ...(request.requesterNote && { requesterNote: request.requesterNote }),
    })
    await update(ref(getDb(), wsPath(wsId, `accounts/${request.accountId}`)), {
      hasPendingRequest: true,
    })
  } catch (error) {
    console.error('[Firebase] Failed to create access request:', error)
    throw error
  }
}

export async function updateAccessRequestStatus(
  wsId: string,
  requestId: string,
  status: AccessRequestStatus,
  responseNote?: string
): Promise<void> {
  try {
    const updates: Record<string, unknown> = { status }
    if (responseNote) updates.responseNote = responseNote
    await update(ref(getDb(), wsPath(wsId, `accessRequests/${requestId}`)), updates)
  } catch (error) {
    console.error('[Firebase] Failed to update request status:', error)
    throw error
  }
}

export async function deleteAccessRequest(wsId: string, requestId: string): Promise<void> {
  try {
    await remove(ref(getDb(), wsPath(wsId, `accessRequests/${requestId}`)))
  } catch (error) {
    console.error('[Firebase] Failed to delete request:', error)
    throw error
  }
}
