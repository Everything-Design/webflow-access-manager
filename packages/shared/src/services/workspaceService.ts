import { ref, get, set, update, remove, onValue, serverTimestamp, Unsubscribe } from 'firebase/database'
import { getDb } from './firebase'
import type { User, Workspace, WorkspaceMember, UserRole } from '../types/models'

// Generate a short, shareable workspace ID (e.g., "EF-7X3K9PR").
// 8 chars from a 32-char alphabet = 32^8 ≈ 1.1 trillion combinations — collisions effectively zero.
function generateWorkspaceId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I/O/0/1 to avoid confusion
  let id = ''
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return `${id.slice(0, 2)}-${id.slice(2)}`
}

async function generateUniqueWorkspaceId(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateWorkspaceId()
    const snap = await get(ref(getDb(), `workspaces/${candidate}/meta`))
    if (!snap.exists()) return candidate
  }
  throw new Error('Failed to generate a unique workspace ID. Please try again.')
}

// ─── Create Workspace ───

export async function createWorkspace(name: string, user: User): Promise<string> {
  const wsId = await generateUniqueWorkspaceId()

  try {
    // Write workspace meta
    await set(ref(getDb(), `workspaces/${wsId}/meta`), {
      id: wsId,
      name,
      ownerId: user.id,
      createdAt: serverTimestamp(),
    })

    // Add creator as owner member
    await set(ref(getDb(), `workspaces/${wsId}/members/${user.id}`), {
      userId: user.id,
      name: user.name,
      email: user.email || null,
      role: 'owner',
      joinedAt: serverTimestamp(),
      profileIcon: user.profileIcon || null,
      profileColor: user.profileColor || null,
    })

    // Add workspace to user's membership index
    await set(ref(getDb(), `users/${user.id}/workspaces/${wsId}`), true)

    console.log('[Workspace] Created:', wsId, name)
    return wsId
  } catch (error) {
    console.error('[Workspace] Failed to create:', error)
    throw error
  }
}

// ─── Join Workspace ───

export async function joinWorkspace(wsId: string, user: User): Promise<Workspace> {
  try {
    // Verify workspace exists
    const metaSnap = await get(ref(getDb(), `workspaces/${wsId}/meta`))
    if (!metaSnap.exists()) {
      throw new Error('Workspace not found. Check the ID and try again.')
    }

    const meta = metaSnap.val()

    // Check if already a member
    const memberSnap = await get(ref(getDb(), `workspaces/${wsId}/members/${user.id}`))
    if (memberSnap.exists()) {
      throw new Error('You are already a member of this workspace.')
    }

    // Add as member
    await set(ref(getDb(), `workspaces/${wsId}/members/${user.id}`), {
      userId: user.id,
      name: user.name,
      email: user.email || null,
      role: 'member',
      joinedAt: serverTimestamp(),
      profileIcon: user.profileIcon || null,
      profileColor: user.profileColor || null,
    })

    // Add to user's workspace index
    await set(ref(getDb(), `users/${user.id}/workspaces/${wsId}`), true)

    console.log('[Workspace] Joined:', wsId)
    return {
      id: wsId,
      name: meta.name,
      ownerId: meta.ownerId,
      createdAt: meta.createdAt,
    }
  } catch (error) {
    console.error('[Workspace] Failed to join:', error)
    throw error
  }
}

// ─── Leave Workspace ───

export async function leaveWorkspace(wsId: string, userId: string): Promise<void> {
  try {
    await remove(ref(getDb(), `workspaces/${wsId}/members/${userId}`))
    await remove(ref(getDb(), `users/${userId}/workspaces/${wsId}`))
    console.log('[Workspace] Left:', wsId)
  } catch (error) {
    console.error('[Workspace] Failed to leave:', error)
    throw error
  }
}

// ─── Get User's Workspaces ───

export async function getUserWorkspaces(userId: string): Promise<Workspace[]> {
  try {
    const indexSnap = await get(ref(getDb(), `users/${userId}/workspaces`))
    if (!indexSnap.exists()) return []

    const wsIds = Object.keys(indexSnap.val())
    const metaSnaps = await Promise.all(
      wsIds.map((wsId) => get(ref(getDb(), `workspaces/${wsId}/meta`)))
    )

    const workspaces: Workspace[] = []
    metaSnaps.forEach((snap, i) => {
      if (snap.exists()) {
        const meta = snap.val()
        workspaces.push({
          id: wsIds[i],
          name: meta.name,
          ownerId: meta.ownerId,
          createdAt: meta.createdAt ?? 0,
        })
      }
    })

    return workspaces
  } catch (error) {
    console.error('[Workspace] Failed to get workspaces:', error)
    return []
  }
}

// ─── Get Workspace Meta ───

export async function getWorkspaceMeta(wsId: string): Promise<Workspace | null> {
  try {
    const snap = await get(ref(getDb(), `workspaces/${wsId}/meta`))
    if (!snap.exists()) return null
    const meta = snap.val()
    return { id: wsId, name: meta.name, ownerId: meta.ownerId, createdAt: meta.createdAt ?? 0 }
  } catch (error) {
    console.error('[Workspace] Failed to get meta:', error)
    return null
  }
}

// ─── Observe Members ───

export function observeWorkspaceMembers(wsId: string, callback: (members: WorkspaceMember[]) => void): Unsubscribe {
  return onValue(
    ref(getDb(), `workspaces/${wsId}/members`),
    (snapshot) => {
      const members: WorkspaceMember[] = []
      snapshot.forEach((child) => {
        const data = child.val()
        if (data) {
          members.push({
            userId: child.key!,
            name: data.name || '',
            email: data.email,
            role: data.role || 'member',
            joinedAt: data.joinedAt ?? 0,
            profileIcon: data.profileIcon,
            profileColor: data.profileColor,
          })
        }
      })
      callback(members)
    },
    (error) => console.error('[Workspace] Members observer error:', error)
  )
}

// ─── Update Member Role ───

export async function updateMemberRole(wsId: string, userId: string, role: UserRole): Promise<void> {
  try {
    await update(ref(getDb(), `workspaces/${wsId}/members/${userId}`), { role })
  } catch (error) {
    console.error('[Workspace] Failed to update role:', error)
    throw error
  }
}
