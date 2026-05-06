// ─── Access Request Status ───

export type AccessRequestStatus = 'pending' | 'approved' | 'released' | 'rejected' | 'cancelled'

// ─── User ───

export interface User {
  id: string
  name: string
  email?: string
  deviceId?: string
  isOnline: boolean
  lastSeen: number // seconds since epoch
  profileIcon?: string
  profileColor?: string
  isAdmin?: boolean // Bug #2 fix: role from Firebase, not hardcoded UUID
}

// ─── Account (Internal Webflow Account Slot) ───

export interface Account {
  id: string
  label?: string
  isOccupied: boolean
  occupiedBy?: string
  occupiedByName?: string
  occupiedSince?: number // seconds since epoch
  hasPendingRequest: boolean
}

// ─── Client Account ───

export interface ClientAccount {
  id: string
  clientName: string
  createdAt: number // seconds since epoch
  createdBy: string
  createdByName: string
  isActive?: boolean
}

// ─── Access Request ───

export interface AccessRequest {
  id: string
  requesterId: string
  requesterName: string
  accountId: string
  accountLabel?: string
  ownerId: string
  ownerName: string
  status: AccessRequestStatus
  requestedAt: number // seconds since epoch
  requesterNote?: string
  responseNote?: string
}

// ─── Workspace ───

export type UserRole = 'owner' | 'admin' | 'member'

export interface Workspace {
  id: string           // short shareable ID, e.g. "EF-7X3K9"
  name: string         // agency name
  ownerId: string      // Firebase Auth UID of creator
  createdAt: number    // seconds since epoch
}

export interface WorkspaceMember {
  userId: string
  name: string
  email?: string
  role: UserRole
  joinedAt: number     // seconds since epoch
  profileIcon?: string
  profileColor?: string
}

// ─── Helpers ───
// Bug #5 fix: formatDuration only lives in utils/helpers.ts now

export function isAccountAvailable(account: Account): boolean {
  return !account.isOccupied
}
