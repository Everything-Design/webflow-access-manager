import { useEffect, useRef } from 'react'
import { ActivityIndicator, View, AppState as RNAppState } from 'react-native'
import { Slot } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { configurePlatform, initFirebase, useAuthStore, useAppStore, useWorkspaceStore, firebaseService } from '@wam/shared'
import { mobileAdapters } from '../adapters/mobileAdapters'

configurePlatform(mobileAdapters)
initFirebase({
  apiKey: 'AIzaSyDeKYyDJe226JvamBZi_n6XRxDDfU6Qve0',
  authDomain: 'webflow-team-login.firebaseapp.com',
  projectId: 'webflow-team-login',
  storageBucket: 'webflow-team-login.firebasestorage.app',
  messagingSenderId: '1069127337276',
  appId: '1:1069127337276:ios:9f42018b28cfdc60678a39',
  databaseURL: 'https://webflow-team-login-default-rtdb.asia-southeast1.firebasedatabase.app',
})

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isFirebaseReady = useAuthStore((s) => s.isFirebaseReady)
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const currentUser = useAuthStore((s) => s.currentUser)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const isWsLoading = useWorkspaceStore((s) => s.isLoading)
  const members = useWorkspaceStore((s) => s.members)
  const hasInitRef = useRef(false)

  // Initialize auth
  useEffect(() => {
    if (!hasInitRef.current) {
      hasInitRef.current = true
      useAuthStore.getState().init()
    }
  }, [])

  // Request notification permissions
  useEffect(() => { Notifications.requestPermissionsAsync() }, [])

  // Load workspaces only after Firebase Auth has confirmed the session — otherwise
  // the database read fires before the auth token is issued and security rules deny it.
  useEffect(() => {
    if (isFirebaseReady && isAuthenticated && currentUser?.id) {
      useWorkspaceStore.getState().loadWorkspaces(currentUser.id)
    }
  }, [isFirebaseReady, isAuthenticated, currentUser?.id])

  // Setup app listeners when workspace is selected
  useEffect(() => {
    if (isAuthenticated && currentUser?.id && currentWorkspaceId) {
      useAppStore.getState().setupListeners(currentUser.id, currentWorkspaceId)
      return () => useAppStore.getState().removeListeners()
    }
  }, [isAuthenticated, currentUser?.id, currentWorkspaceId])

  // Derive role from members
  useEffect(() => {
    if (currentUser?.id && members.length > 0) {
      const me = members.find((m) => m.userId === currentUser.id)
      if (me) useWorkspaceStore.setState({ myRole: me.role })
    }
  }, [members, currentUser?.id])

  // App lifecycle presence
  useEffect(() => {
    if (!currentUser?.id) return
    const sub = RNAppState.addEventListener('change', (state) => {
      if (state === 'active') firebaseService.updateUserPresence(currentUser.id, true)
      else if (state === 'background' || state === 'inactive') firebaseService.updateUserPresence(currentUser.id, false)
    })
    return () => sub.remove()
  }, [currentUser?.id])

  if (isAuthLoading || (isAuthenticated && isWsLoading)) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f6f6' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return <Slot />
}
