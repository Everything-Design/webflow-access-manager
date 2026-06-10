import { useEffect } from 'react'
import { View } from 'react-native'
import { useAuthStore } from '@wam/shared'
import { useTheme } from '../utils/theme'
import { Text, Button, IconCircle, Tag, spacing } from '../ui'

export default function PendingApprovalScreen() {
  const t = useTheme()
  const currentUser = useAuthStore((s) => s.currentUser)
  const signOut = useAuthStore((s) => s.signOut)
  const subscribe = useAuthStore((s) => s.subscribeOwnStatus)

  useEffect(() => subscribe(), [subscribe])

  const status = currentUser?.status
  const isRejected = status === 'rejected'

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
      <IconCircle emoji={isRejected ? '🚫' : '⏳'} color={isRejected ? 'red' : 'orange'} size={72} />

      <View style={{ gap: spacing.sm, alignItems: 'center' }}>
        <Text variant="title2" align="center">
          {isRejected ? 'Access denied' : 'Waiting for approval'}
        </Text>
        <Text
          variant="body"
          color="secondary"
          align="center"
          style={{ maxWidth: 320 }}
        >
          {isRejected
            ? 'Your admin declined access. Reach out to them if this is a mistake.'
            : 'Your admin needs to approve you before you can use the app.'}
        </Text>
      </View>

      {(currentUser?.email || currentUser?.name) && (
        <Tag label={`Signed in as ${currentUser.email ?? currentUser.name}`} tone="neutral" />
      )}

      {!isRejected && (
        <Text variant="footnote" color="tertiary" align="center">
          This screen will update automatically once you're approved.
        </Text>
      )}

      <Button title="Sign out" variant="plain" onPress={() => signOut()} />
    </View>
  )
}
