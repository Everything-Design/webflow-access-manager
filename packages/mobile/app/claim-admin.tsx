import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore, useAdminStore } from '@wam/shared'
import { useTheme } from '../utils/theme'
import { Text, Button, Card, IconCircle, Tag, spacing } from '../ui'

export default function ClaimAdminScreen() {
  const t = useTheme()
  const currentUser = useAuthStore((s) => s.currentUser)
  const signOut = useAuthStore((s) => s.signOut)
  const claim = useAdminStore((s) => s.claim)
  const adminUid = useAdminStore((s) => s.adminUid)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Once the observers have caught up and an admin exists, route back through the
  // gate at '/' so it can decide where to send the user (dashboard if they're the
  // admin and approved, pending-approval otherwise). Without this redirect the
  // screen stays mounted with the claim spinner running forever even though the
  // write succeeded.
  useEffect(() => {
    if (adminUid && currentUser?.status === 'approved') {
      router.replace('/')
    }
  }, [adminUid, currentUser?.status])

  const onClaim = async () => {
    if (!currentUser) return
    setIsClaiming(true)
    setError(null)
    try {
      await claim(currentUser.id)
      // Spinner stays on while we wait for the observers to flip state; the effect
      // above will then redirect us.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not claim admin')
      setIsClaiming(false)
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: t.bgGrouped,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xxl,
        gap: spacing.lg,
      }}
    >
      <IconCircle emoji="👑" color="purple" size={72} />

      <View style={{ gap: spacing.sm, alignItems: 'center' }}>
        <Text variant="title2" align="center">
          No admin yet
        </Text>
        <Text variant="body" color="secondary" align="center" style={{ maxWidth: 320 }}>
          This workspace doesn't have an admin. Claim it to manage the team and account
          slots.
        </Text>
      </View>

      {(currentUser?.email || currentUser?.name) && (
        <Tag label={`Signed in as ${currentUser.email ?? currentUser.name}`} tone="neutral" />
      )}

      <Button
        title="Claim admin"
        variant="filled"
        size="lg"
        fullWidth
        loading={isClaiming}
        onPress={onClaim}
      />

      {error && (
        <Card tone="danger" padding="md" bordered style={{ alignSelf: 'stretch' }}>
          <Text variant="footnote" color="danger" align="center">
            {error}
          </Text>
        </Card>
      )}

      <Button title="Sign out" variant="plain" onPress={() => signOut()} />
    </View>
  )
}
