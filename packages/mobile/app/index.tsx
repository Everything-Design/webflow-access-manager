import { Redirect } from 'expo-router'
import { useAuthStore, useAdminStore } from '@wam/shared'

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isFirebaseReady = useAuthStore((s) => s.isFirebaseReady)
  const currentUser = useAuthStore((s) => s.currentUser)
  const adminUid = useAdminStore((s) => s.adminUid)
  const adminLoaded = useAdminStore((s) => s.isLoaded)
  const adminReadFailed = useAdminStore((s) => s.readFailed)

  if (!isAuthenticated) return <Redirect href="/onboarding" />
  if (!isFirebaseReady || !adminLoaded) return null
  // If we couldn't even READ /admin, we can't safely route — sending to ClaimAdmin
  // here causes a failing write loop. Treat the user as pending so they wait for
  // admin approval (or for the rules issue to be fixed).
  if (adminReadFailed) return <Redirect href="/pending-approval" />
  if (adminUid === null) return <Redirect href="/claim-admin" />
  if (currentUser?.status !== 'approved') return <Redirect href="/pending-approval" />
  return <Redirect href="/(tabs)/accounts" />
}
