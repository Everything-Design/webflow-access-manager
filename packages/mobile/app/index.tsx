import { Redirect } from 'expo-router'
import { useAuthStore, useWorkspaceStore } from '@wam/shared'

export default function Index() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const userWorkspaces = useWorkspaceStore((s) => s.userWorkspaces)
  const isWsLoading = useWorkspaceStore((s) => s.isLoading)

  if (!isAuthenticated) return <Redirect href="/onboarding" />
  if (isWsLoading) return null // _layout shows spinner
  if (userWorkspaces.length === 0 || !currentWorkspaceId) return <Redirect href="/workspace-setup" />
  return <Redirect href="/(tabs)/accounts" />
}
