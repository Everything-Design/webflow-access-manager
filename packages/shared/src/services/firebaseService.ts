import {
  ref,
  onValue,
  set,
  update,
  remove,
  get,
  runTransaction,
  serverTimestamp,
  onDisconnect,
  Unsubscribe,
} from 'firebase/database'
import { getDb } from './firebase'
import type {
  User,
  Account,
  ClientAccount,
  AccessRequest,
  AccessRequestStatus,
  TeamMemberStatus,
} from '../types/models'
import { generateId } from '../utils/helpers'

function toTimestamp(val: unknown): number | undefined {
  if (typeof val === 'number' && val > 0) return val
  return undefined
}

// ─── Connection Status ───

export function observeConnection(callback: (connected: boolean) => void): Unsubscribe {
  return onValue(
    ref(getDb(), '.info/connected'),
    (snapshot) => callback(snapshot.val() === true),
    (error) => console.error('[Firebase] Connection error:', error)
  )
}

// ─── Admin (single-tenant: one UID lives at /admin/uid) ───

export function observeAdmin(callback: (adminUid: string | null) => void): Unsubscribe {
  return onValue(
    ref(getDb(), 'admin/uid'),
    (snapshot) => callback(snapshot.val() ?? null),
    (error) => {
      // If rules deny the read (e.g. published rules don't match this client yet) we still
      // need the gate to advance — otherwise the app sits on a spinner forever. Surfacing
      // adminUid=null falls through to the ClaimAdmin screen, where any subsequent write
      // attempt will produce a real error message instead of a silent hang.
      console.error('[Firebase] Admin observer error — treating as no admin:', error)
      callback(null)
    }
  )
}

export async function getAdminUid(): Promise<string | null> {
  const snap = await get(ref(getDb(), 'admin/uid'))
  return snap.val() ?? null
}

// First-user bootstrap: claim the empty admin slot. Rules allow this only when /admin/uid
// doesn't yet exist. Then approve self in the same flow.
export async function claimAdmin(uid: string): Promise<void> {
  await set(ref(getDb(), 'admin/uid'), uid)
  await update(ref(getDb(), `team/${uid}`), { status: 'approved' })
}

// ─── Team (was /users; now flat under /team) ───

export function observeTeam(callback: (members: User[]) => void): Unsubscribe {
  return onValue(
    ref(getDb(), 'team'),
    (snapshot) => {
      const members: User[] = []
      snapshot.forEach((child) => {
        const data = child.val()
        if (data) {
          members.push({
            id: child.key!,
            name: data.name || '',
            email: data.email,
            deviceId: data.deviceId,
            isOnline: data.isOnline === true,
            lastSeen: toTimestamp(data.lastSeen) ?? Date.now() / 1000,
            profileIcon: data.profileIcon,
            profileColor: data.profileColor,
            status: (data.status as TeamMemberStatus) || 'pending',
            addedAt: toTimestamp(data.addedAt),
          })
        }
      })
      callback(members)
    },
    (error) => console.error('[Firebase] Team error:', error)
  )
}

// Pending users can read their own /team/{uid} but not the whole /team — use this
// observer in the gate so they see admin approval as it happens.
export function observeOwnTeamRecord(
  uid: string,
  callback: (user: User | null) => void
): Unsubscribe {
  return onValue(
    ref(getDb(), `team/${uid}`),
    (snapshot) => {
      const data = snapshot.val()
      if (!data) {
        callback(null)
        return
      }
      callback({
        id: uid,
        name: data.name || '',
        email: data.email,
        deviceId: data.deviceId,
        isOnline: data.isOnline === true,
        lastSeen: toTimestamp(data.lastSeen) ?? Date.now() / 1000,
        profileIcon: data.profileIcon,
        profileColor: data.profileColor,
        status: (data.status as TeamMemberStatus) || 'pending',
        addedAt: toTimestamp(data.addedAt),
      })
    },
    (error) => console.error('[Firebase] Own team record error:', error)
  )
}

// Called on every successful Google sign-in.
// Creates the team entry (status='pending') the first time; subsequent calls just refresh
// presence + profile fields. Status is never overwritten by this call.
export async function registerTeamMember(user: Omit<User, 'status'>): Promise<void> {
  const teamRef = ref(getDb(), `team/${user.id}`)
  const existing = await get(teamRef)

  const baseFields = {
    id: user.id,
    name: user.name,
    isOnline: true,
    lastSeen: serverTimestamp(),
    email: user.email ?? null,
    profileIcon: user.profileIcon ?? null,
    profileColor: user.profileColor ?? null,
  }

  if (!existing.exists()) {
    // First sign-in — create with pending status
    await set(teamRef, {
      ...baseFields,
      status: 'pending',
      addedAt: serverTimestamp(),
    })
  } else {
    // Refresh profile + presence; preserve status and addedAt
    await update(teamRef, baseFields)
  }

  await onDisconnect(ref(getDb(), `team/${user.id}/isOnline`)).set(false)
}

export async function updateMemberStatus(uid: string, status: TeamMemberStatus): Promise<void> {
  await update(ref(getDb(), `team/${uid}`), { status })
}

export async function removeTeamMember(uid: string): Promise<void> {
  await remove(ref(getDb(), `team/${uid}`))
}

export async function updateUserPresence(userId: string, online: boolean): Promise<void> {
  try {
    await update(ref(getDb(), `team/${userId}`), {
      isOnline: online,
      lastSeen: serverTimestamp(),
    })
  } catch (error) {
    console.error('[Firebase] Failed to update presence:', error)
  }
}

export async function updateMemberProfile(
  uid: string,
  updates: Partial<Pick<User, 'name' | 'profileIcon' | 'profileColor'>>
): Promise<void> {
  await update(ref(getDb(), `team/${uid}`), updates)
}

// ─── Accounts ───

export function observeAccounts(callback: (accounts: Account[]) => void): Unsubscribe {
  return onValue(
    ref(getDb(), 'accounts'),
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

export async function claimAccount(accountId: string, user: User): Promise<void> {
  const result = await runTransaction(
    ref(getDb(), `accounts/${accountId}`),
    (current) => {
      if (current === null) return current
      if (current.isOccupied === true) return undefined
      return {
        ...current,
        isOccupied: true,
        occupiedBy: user.id,
        occupiedByName: user.name,
        occupiedSince: Date.now(),
      }
    },
    { applyLocally: false }
  )
  if (!result.committed) {
    throw new Error('This account was just claimed by someone else.')
  }
}

export async function releaseAccount(accountId: string): Promise<void> {
  await update(ref(getDb(), `accounts/${accountId}`), {
    isOccupied: false,
    occupiedBy: null,
    occupiedByName: null,
    occupiedSince: null,
    hasPendingRequest: false,
  })
}

export async function deleteAccountSlot(accountId: string): Promise<void> {
  await remove(ref(getDb(), `accounts/${accountId}`))
}

export async function createAccountSlot(accountId: string, label?: string): Promise<void> {
  await set(ref(getDb(), `accounts/${accountId}`), {
    id: accountId,
    isOccupied: false,
    hasPendingRequest: false,
    ...(label && { label }),
  })
}

// ─── Client Accounts ───

export function observeClientAccounts(callback: (accounts: ClientAccount[]) => void): Unsubscribe {
  return onValue(
    ref(getDb(), 'clientAccounts'),
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

export async function setClientAccount(clientName: string, user: User): Promise<void> {
  const id = generateId()
  await set(ref(getDb(), `clientAccounts/${id}`), {
    id,
    clientName,
    createdBy: user.id,
    createdByName: user.name,
    createdAt: serverTimestamp(),
    isActive: true,
  })
}

export async function clearClientAccount(clientAccountId: string): Promise<void> {
  await remove(ref(getDb(), `clientAccounts/${clientAccountId}`))
}

// ─── Access Requests ───

export function observeAccessRequests(callback: (requests: AccessRequest[]) => void): Unsubscribe {
  return onValue(
    ref(getDb(), 'accessRequests'),
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
      callback(requests)
    },
    (error) => console.error('[Firebase] Access requests error:', error)
  )
}

export async function createAccessRequest(request: AccessRequest): Promise<void> {
  await set(ref(getDb(), `accessRequests/${request.id}`), {
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
  await update(ref(getDb(), `accounts/${request.accountId}`), { hasPendingRequest: true })
}

export async function updateAccessRequestStatus(
  requestId: string,
  status: AccessRequestStatus,
  responseNote?: string
): Promise<void> {
  const updates: Record<string, unknown> = { status }
  if (responseNote) updates.responseNote = responseNote
  await update(ref(getDb(), `accessRequests/${requestId}`), updates)
}

export async function deleteAccessRequest(requestId: string): Promise<void> {
  await remove(ref(getDb(), `accessRequests/${requestId}`))
}
