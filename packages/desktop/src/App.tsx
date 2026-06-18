import { useEffect, useRef } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth'
import { configurePlatform, initFirebase, useAuthStore, useAppStore, useAdminStore } from '@wam/shared'
import { electronAdapters } from './adapters/electronAdapters'
import { TrayPopup } from './pages/TrayPopup'
import { Dashboard } from './pages/Dashboard'
import { Onboarding } from './pages/Onboarding'
import { PendingApproval } from './pages/PendingApproval'
import { ClaimAdmin } from './pages/ClaimAdmin'

configurePlatform(electronAdapters)
initFirebase({
  apiKey: 'AIzaSyDeKYyDJe226JvamBZi_n6XRxDDfU6Qve0',
  authDomain: 'webflow-team-login.firebaseapp.com',
  projectId: 'webflow-team-login',
  storageBucket: 'webflow-team-login.firebasestorage.app',
  messagingSenderId: '1069127337276',
  appId: '1:1069127337276:ios:9f42018b28cfdc60678a39',
  databaseURL: 'https://webflow-team-login-default-rtdb.asia-southeast1.firebasedatabase.app',
}, {
  // Persist the auth session durably (IndexedDB, falling back to localStorage) instead of
  // relying on the SDK default — so the session survives relaunches and reinstalls.
  authPersistence: [indexedDBLocalPersistence, browserLocalPersistence],
})

function Spinner() {
  return (
    <div className="flex items-center justify-center h-full bg-background-primary">
      <span className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function AppGate({ children }: { children: React.ReactNode }) {
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isFirebaseReady = useAuthStore((s) => s.isFirebaseReady)
  const currentUser = useAuthStore((s) => s.currentUser)
  const adminUid = useAdminStore((s) => s.adminUid)
  const adminLoaded = useAdminStore((s) => s.isLoaded)
  const adminReadFailed = useAdminStore((s) => s.readFailed)
  const subscribeOwnStatus = useAuthStore((s) => s.subscribeOwnStatus)

  // Keep my own status fresh — admin approval propagates here without a refresh.
  useEffect(() => {
    if (!isFirebaseReady || !isAuthenticated || !currentUser?.id) return
    return subscribeOwnStatus()
  }, [isFirebaseReady, isAuthenticated, currentUser?.id, subscribeOwnStatus])

  if (isAuthLoading) return <Spinner />
  if (!isAuthenticated) return <Onboarding />
  if (!isFirebaseReady || !adminLoaded) return <Spinner />

  // The admin read failed (most often: rules deny it). Treat as pending so we don't
  // send the user into a ClaimAdmin write that's guaranteed to also fail.
  if (adminReadFailed) return <PendingApproval />

  // No admin yet → first signed-in user can claim it
  if (adminUid === null) return <ClaimAdmin />

  // Signed in but not approved
  if (currentUser?.status !== 'approved') return <PendingApproval />

  return <>{children}</>
}

export function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isFirebaseReady = useAuthStore((s) => s.isFirebaseReady)
  const currentUser = useAuthStore((s) => s.currentUser)
  const hasInitRef = useRef(false)

  useEffect(() => {
    if (!hasInitRef.current) {
      hasInitRef.current = true
      useAuthStore.getState().init()
    }
  }, [])

  // Admin observer needs an auth token to read /admin per Firebase rules — start it only
  // once Firebase Auth has confirmed the session.
  useEffect(() => {
    if (!isFirebaseReady || !isAuthenticated) return
    useAdminStore.getState().start()
    return () => useAdminStore.getState().stop()
  }, [isFirebaseReady, isAuthenticated])

  // Setup app data listeners only once Firebase Auth is confirmed AND user is approved.
  // Pending users can't read /accounts etc. — so don't try.
  useEffect(() => {
    if (!isFirebaseReady || !isAuthenticated || !currentUser?.id) return
    if (currentUser.status !== 'approved') return
    useAppStore.getState().setupListeners(currentUser.id)
    return () => useAppStore.getState().removeListeners()
  }, [isFirebaseReady, isAuthenticated, currentUser?.id, currentUser?.status])

  // Dark mode
  useEffect(() => {
    if (!window.electronAPI) return
    const applyTheme = (isDark: boolean) => {
      document.documentElement.classList.toggle('dark', isDark)
    }
    window.electronAPI.getDarkMode().then(applyTheme)
    return window.electronAPI.onThemeChanged(applyTheme)
  }, [])

  // Live tray status — orange when there's a pending request waiting for me, red when
  // every account is occupied, green otherwise.
  const accounts = useAppStore((s) => s.accounts)
  const pendingForMe = useAppStore((s) => s.pendingRequestsForCurrentUser)
  useEffect(() => {
    if (!window.electronAPI?.setTrayStatus) return
    if (currentUser?.status !== 'approved') return
    let status: 'green' | 'orange' | 'red' = 'green'
    if (pendingForMe.length > 0) status = 'orange'
    else if (accounts.length > 0 && accounts.every((a) => a.isOccupied)) status = 'red'
    window.electronAPI.setTrayStatus(status)
  }, [accounts, pendingForMe, currentUser?.status])

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
