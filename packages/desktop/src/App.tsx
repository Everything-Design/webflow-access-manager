import { useEffect, useRef } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { configurePlatform, initFirebase, useAuthStore, useAppStore, useWorkspaceStore } from '@wam/shared'
import { electronAdapters } from './adapters/electronAdapters'
import { TrayPopup } from './pages/TrayPopup'
import { Dashboard } from './pages/Dashboard'
import { Onboarding } from './pages/Onboarding'
import { WorkspaceSetup } from './pages/WorkspaceSetup'

configurePlatform(electronAdapters)
initFirebase({
  apiKey: 'AIzaSyDeKYyDJe226JvamBZi_n6XRxDDfU6Qve0',
  projectId: 'webflow-team-login',
  storageBucket: 'webflow-team-login.firebasestorage.app',
  messagingSenderId: '1069127337276',
  appId: '1:1069127337276:ios:9f42018b28cfdc60678a39',
  databaseURL: 'https://webflow-team-login-default-rtdb.asia-southeast1.firebasedatabase.app',
})

function AppGate({ children }: { children: React.ReactNode }) {
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isWsLoading = useWorkspaceStore((s) => s.isLoading)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const userWorkspaces = useWorkspaceStore((s) => s.userWorkspaces)

  if (isAuthLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background-primary">
        <span className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) return <Onboarding />

  if (isWsLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background-primary">
        <span className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // No workspaces — show create/join
  if (userWorkspaces.length === 0 || !currentWorkspaceId) {
    return <WorkspaceSetup />
  }

  return <>{children}</>
}

export function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentUser = useAuthStore((s) => s.currentUser)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const hasInitRef = useRef(false)

  // Initialize auth
  useEffect(() => {
    if (!hasInitRef.current) {
      hasInitRef.current = true
      useAuthStore.getState().init()
    }
  }, [])

  // Load workspaces after auth
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      useWorkspaceStore.getState().loadWorkspaces(currentUser.id)
    }
  }, [isAuthenticated, currentUser?.id])

  // Setup app listeners when workspace is selected
  useEffect(() => {
    if (isAuthenticated && currentUser?.id && currentWorkspaceId) {
      useAppStore.getState().setupListeners(currentUser.id, currentWorkspaceId)
      return () => useAppStore.getState().removeListeners()
    }
  }, [isAuthenticated, currentUser?.id, currentWorkspaceId])

  // Derive role from members
  const members = useWorkspaceStore((s) => s.members)
  useEffect(() => {
    if (currentUser?.id && members.length > 0) {
      const me = members.find((m) => m.userId === currentUser.id)
      if (me) {
        useWorkspaceStore.setState({ myRole: me.role })
      }
    }
  }, [members, currentUser?.id])

  // Dark mode
  useEffect(() => {
    if (!window.electronAPI) return
    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.toggle('dark', isDark)
    }
    window.electronAPI.getDarkMode().then(applyTheme)
    return window.electronAPI.onThemeChanged(applyTheme)
  }, [])

  return (
    <HashRouter>
      <Routes>
        <Route path="/popup" element={<AppGate><TrayPopup /></AppGate>} />
        <Route path="/dashboard" element={<AppGate><Dashboard /></AppGate>} />
        <Route path="*" element={<Navigate to="/popup" replace />} />
      </Routes>
    </HashRouter>
  )
}
