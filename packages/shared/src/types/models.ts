// ─── Access Request Status ───

export type AccessRequestStatus = 'pending' | 'approved' | 'released' | 'rejected' | 'cancelled'

// ─── Team Member Status ───
// Single-tenant access control — admin approves new sign-ins.

export type TeamMemberStatus = 'pending' | 'approved' | 'rejected'

// ─── User / Team Member ───

export interface User {
  id: string
  name: string
  email?: string
  deviceId?: string
  isOnline: boolean
  lastSeen: number // seconds since epoch
  profileIcon?: string
  profileColor?: string
  status: TeamMemberStatus
  addedAt?: number // seconds since epoch
}

// ─── Account (Internal Webflow Account Slot) ───

export interface Account {
  id: string
  label?: string
  isOccupied: boolean
  occupiedBy?: string
  occupiedByName?: string
  occupiedSince?: number // seconds since epoch
  // Stamped whenever the account flips from occupied → free. Lets a row show
  // "Free for 3 days" vs "Free for 30 sec" so members can read recency at a glance.
  lastReleasedAt?: number
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

// ─── Helpers ───

export function isAccountAvailable(account: Account): boolean {
  return !account.isOccupied
}
