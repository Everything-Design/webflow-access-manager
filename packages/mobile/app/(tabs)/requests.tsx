import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '@wam/shared'
import { AccessRequestRow } from '../../components/AccessRequestRow'
import { useTheme } from '../../utils/theme'
import { Text, IconCircle, spacing } from '../../ui'

export default function RequestsScreen() {
  const t = useTheme()
  const pendingRequests = useAppStore((s) => s.pendingRequestsForCurrentUser)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bgGrouped }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.lg }}
      >
        <Text variant="largeTitle">Requests</Text>

        {pendingRequests.length > 0 ? (
          <View style={{ gap: spacing.md }}>
            <Text
              variant="caption2"
              color="secondary"
              style={{ textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: spacing.xs }}
            >
              Action required
            </Text>
            <View style={{ gap: spacing.sm }}>
              {pendingRequests.map((req) => (
                <AccessRequestRow key={req.id} request={req} />
              ))}
            </View>
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xxxl * 2, gap: spacing.md }}>
            <IconCircle emoji="📭" color="accent" size={64} />
            <Text variant="headline">No pending requests</Text>
            <Text variant="footnote" color="secondary" align="center" style={{ maxWidth: 280 }}>
              When someone asks for an account you're using, it'll show up here for a
              quick yes or no.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
