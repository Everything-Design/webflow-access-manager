import { useState } from 'react'
import { View } from 'react-native'
import { useAuthStore, useAdminStore } from '@wam/shared'
import { useTheme } from '../utils/theme'
import { Text, Button, Card, IconCircle, Tag, spacing } from '../ui'

export default function ClaimAdminScreen() {
  const t = useTheme()
  const currentUser = useAuthStore((s) => s.currentUser)
  const signOut = useAuthStore((s) => s.signOut)
  const claim = useAdminStore((s) => s.claim)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onClaim = async () => {
    if (!currentUser) return
    setIsClaiming(true)
    setError(null)
    try {
      await claim(currentUser.id)
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
