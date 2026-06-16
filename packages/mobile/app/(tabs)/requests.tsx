import { useMemo } from 'react'
import { View, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore, useAuthStore, formatDuration, getAccountDisplayName } from '@wam/shared'
import type { AccessRequest } from '@wam/shared'
import { AccessRequestRow } from '../../components/AccessRequestRow'
import { useTheme } from '../../utils/theme'
import { Text, IconCircle, ListSection, ListRow, Tag, StatusDot, spacing } from '../../ui'

export default function RequestsScreen() {
  const t = useTheme()
  const pendingRequests = useAppStore((s) => s.pendingRequestsForCurrentUser)
  const allAccessRequests = useAppStore((s) => s.allAccessRequests)
  const currentUser = useAuthStore((s) => s.currentUser)

  // Recent activity = resolved requests involving me, newest first, capped at 10.
  // Filter to "involves me" so members don't see unrelated team-wide history; admin
  // gets a fuller picture from the Dashboard on desktop later if they want it.
  const recent = useMemo(() => {
    if (!currentUser) return []
    return allAccessRequests
      .filter((r) => r.status !== 'pending')
      .filter((r) => r.requesterId === currentUser.id || r.ownerId === currentUser.id)
      .slice(0, 10)
  }, [allAccessRequests, currentUser])

  const hasPending = pendingRequests.length > 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bgGrouped }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl }}
      >
        <Text variant="largeTitle">Requests</Text>

        {hasPending ? (
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
        ) : recent.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xxxl * 2, gap: spacing.md }}>
            <IconCircle emoji="📭" color="accent" size={64} />
            <Text variant="headline">No pending requests</Text>
            <Text variant="footnote" color="secondary" align="center" style={{ maxWidth: 280 }}>
              When someone asks for an account you're using, it'll show up here for a
              quick yes or no.
            </Text>
          </View>
        ) : null}

        {/* Recent activity — show even when there are no pending requests, but only
            if we have at least one resolved request to display. */}
        {recent.length > 0 && (
          <ListSection header="Recent activity">
            {recent.map((req) => (
              <RecentRow key={req.id} request={req} currentUserId={currentUser?.id} />
            ))}
          </ListSection>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

// Compact row for one resolved request. Renders direction (in/out), counterparty,
// outcome tag, and the timestamp — designed to be scannable, not actionable.
function RecentRow({
  request,
  currentUserId,
}: {
  request: AccessRequest
  currentUserId: string | undefined
}) {
  const accountName = getAccountDisplayName(request.accountId, request.accountLabel)
  const incoming = request.ownerId === currentUserId
  const outcome =
    request.status === 'released' || request.status === 'approved' ? 'success' : request.status === 'rejected' ? 'danger' : 'neutral'

  const outcomeLabel =
    request.status === 'released' || request.status === 'approved'
      ? incoming ? 'You handed over' : 'Handed to you'
      : request.status === 'rejected'
        ? incoming ? 'You declined' : 'Declined'
        : request.status === 'cancelled'
          ? incoming ? 'They cancelled' : 'You cancelled'
          : request.status

  const counterparty = incoming ? request.requesterName : request.ownerName

  return (
    <ListRow
      leading={<StatusDot tone={outcome === 'success' ? 'success' : outcome === 'danger' ? 'danger' : 'neutral'} size={10} />}
      title={`${accountName} — ${counterparty}`}
      subtitle={`${formatDuration(request.requestedAt)} ago${request.responseNote ? ` · "${request.responseNote}"` : ''}`}
      trailing={<Tag label={outcomeLabel} tone={outcome === 'success' ? 'success' : outcome === 'danger' ? 'danger' : 'neutral'} size="sm" />}
    />
  )
}
