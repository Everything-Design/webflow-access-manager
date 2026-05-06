import { create } from 'zustand'
import type { Workspace, WorkspaceMember, UserRole, User } from '../types/models'
import * as workspaceService from '../services/workspaceService'
import { getPlatform } from '../platform/adapters'
import type { Unsubscribe } from 'firebase/database'

const WS_STORAGE_KEY = 'webflow_current_workspace'

export interface WorkspaceState {
  currentWorkspaceId: string | null
  currentWorkspace: Workspace | null
  userWorkspaces: Workspace[]
  members: WorkspaceMember[]
  myRole: UserRole | null
  isLoading: boolean

  loadWorkspaces: (userId: string) => Promise<void>
  createWorkspace: (name: string, user: User) => Promise<string>
  joinWorkspace: (wsId: string, user: User) => Promise<void>
  switchWorkspace: (wsId: string) => Promise<void>
  leaveWorkspace: (wsId: string, userId: string) => Promise<void>
  updateMemberRole: (userId: string, role: UserRole) => Promise<void>
  reset: () => void
}

let membersUnsub: Unsubscribe | null = null

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentWorkspaceId: null,
  currentWorkspace: null,
  userWorkspaces: [],
  members: [],
  myRole: null,
  isLoading: true,

  loadWorkspaces: async (userId) => {
    set({ isLoading: true })
    const { storage } = getPlatform()

    const workspaces = await workspaceService.getUserWorkspaces(userId)
    set({ userWorkspaces: workspaces })

    if (workspaces.length === 0) {
      set({ currentWorkspaceId: null, currentWorkspace: null, isLoading: false })
      return
    }

    // Restore last used workspace
    const lastWsId = await storage.getItem(WS_STORAGE_KEY)
    const targetWs = lastWsId
      ? workspaces.find((w) => w.id === lastWsId) ?? workspaces[0]
      : workspaces[0]

    await get().switchWorkspace(targetWs.id)
    set({ isLoading: false })
  },

  createWorkspace: async (name, user) => {
    const wsId = await workspaceService.createWorkspace(name, user)
    const workspace: Workspace = {
      id: wsId,
      name,
      ownerId: user.id,
      createdAt: Date.now() / 1000,
    }
    set((s) => ({ userWorkspaces: [...s.userWorkspaces, workspace] }))
    await get().switchWorkspace(wsId)
    return wsId
  },

  joinWorkspace: async (wsId, user) => {
    const workspace = await workspaceService.joinWorkspace(wsId, user)
    set((s) => ({ userWorkspaces: [...s.userWorkspaces, workspace] }))
    await get().switchWorkspace(wsId)
  },

  switchWorkspace: async (wsId) => {
    const { storage } = getPlatform()

    // Unsubscribe previous members listener
    if (membersUnsub) {
      membersUnsub()
      membersUnsub = null
    }

    const meta = await workspaceService.getWorkspaceMeta(wsId)
    await storage.setItem(WS_STORAGE_KEY, wsId)

    set({ currentWorkspaceId: wsId, currentWorkspace: meta })

    // Subscribe to members
    membersUnsub = workspaceService.observeWorkspaceMembers(wsId, (members) => {
      set({ members })
      // Derive current user's role
      const { currentWorkspaceId } = get()
      if (currentWorkspaceId === wsId) {
        // Get userId from auth store — we read it from members list
        // The caller will set myRole after loading
      }
    })

    console.log('[Workspace] Switched to:', wsId, meta?.name)
  },

  leaveWorkspace: async (wsId, userId) => {
    await workspaceService.leaveWorkspace(wsId, userId)
    set((s) => ({
      userWorkspaces: s.userWorkspaces.filter((w) => w.id !== wsId),
    }))

    // If leaving current workspace, switch to another
    const { currentWorkspaceId, userWorkspaces } = get()
    if (currentWorkspaceId === wsId) {
      if (userWorkspaces.length > 0) {
        await get().switchWorkspace(userWorkspaces[0].id)
      } else {
        set({ currentWorkspaceId: null, currentWorkspace: null, members: [], myRole: null })
      }
    }
  },

  updateMemberRole: async (userId, role) => {
    const { currentWorkspaceId } = get()
    if (!currentWorkspaceId) return
    await workspaceService.updateMemberRole(currentWorkspaceId, userId, role)
  },

  reset: () => {
    if (membersUnsub) {
      membersUnsub()
      membersUnsub = null
    }
    set({
      currentWorkspaceId: null,
      currentWorkspace: null,
      userWorkspaces: [],
      members: [],
      myRole: null,
      isLoading: true,
    })
  },
}))
