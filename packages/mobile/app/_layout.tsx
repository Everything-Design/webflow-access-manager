import { useEffect, useRef } from 'react'
import { ActivityIndicator, View, AppState as RNAppState } from 'react-native'
import { Slot } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { configurePlatform, initFirebase, useAuthStore, useAppStore, useAdminStore, firebaseService } from '@wam/shared'
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
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export default function RootLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isFirebaseReady = useAuthStore((s) => s.isFirebaseReady)
  const isAuthLoading = useAuthStore((s) => s.isLoading)
  const currentUser = useAuthStore((s) => s.currentUser)
  const subscribeOwnStatus = useAuthStore((s) => s.subscribeOwnStatus)
  const hasInitRef = useRef(false)

  useEffect(() => {
    if (!hasInitRef.current) {
      hasInitRef.current = true
      useAuthStore.getState().init()
      useAdminStore.getState().start()
    }
  }, [])

  // Notification permissions
  useEffect(() => { Notifications.requestPermissionsAsync() }, [])

  // Mirror own /team/{uid} status into the store
  useEffect(() => {
    if (!isFirebaseReady || !isAuthenticated || !currentUser?.id) return
    return subscribeOwnStatus()
  }, [isFirebaseReady, isAuthenticated, currentUser?.id, subscribeOwnStatus])

  // Subscribe to app data only when approved
  useEffect(() => {
    if (!isFirebaseReady || !isAuthenticated || !currentUser?.id) return
    if (currentUser.status !== 'approved') return
    useAppStore.getState().setupListeners(currentUser.id)
    return () => useAppStore.getState().removeListeners()
  }, [isFirebaseReady, isAuthenticated, currentUser?.id, currentUser?.status])

  // App lifecycle presence
  useEffect(() => {
    if (!currentUser?.id || currentUser.status !== 'approved') return
    const sub = RNAppState.addEventListener('change', (state) => {
      if (state === 'active') firebaseService.updateUserPresence(currentUser.id, true)
      else if (state === 'background' || state === 'inactive') firebaseService.updateUserPresence(currentUser.id, false)
    })
    return () => sub.remove()
  }, [currentUser?.id, currentUser?.status])

  if (isAuthLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f6f6f6' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    )
  }

  return <Slot />
}
