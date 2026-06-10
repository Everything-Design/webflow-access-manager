import { useCallback, useMemo, useState } from 'react'
import { View, Alert } from 'react-native'
import { useAppStore, useAuthStore, isAccountAvailable, formatDuration, getAccountDisplayName } from '@wam/shared'
import type { Account } from '@wam/shared'
import { Text, Button, StatusDot, Sheet, ListRow, haptic, spacing } from '../ui'

export function AccountRow({ account }: { account: Account }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const accounts = useAppStore((s) => s.accounts)
  const accessRequests = useAppStore((s) => s.accessRequests)
  const claimAccount = useAppStore((s) => s.claimAccount)
  const releaseAccount = useAppStore((s) => s.releaseAccount)
  const requestAccess = useAppStore((s) => s.requestAccess)
  const cancelRequest = useAppStore((s) => s.cancelRequest)

  const myAccount = useMemo(
    () => accounts.find((a) => a.occupiedBy === currentUser?.id),
    [accounts, currentUser?.id]
  )

  const isMyAccount = currentUser?.id === account.occupiedBy
  const available = isAccountAvailable(account)
  const hasActiveRequest = accessRequests.some(
    (r) => r.accountId === account.id && r.requesterId === currentUser?.id && r.status === 'pending'
  )

  // Map state → semantic colour. Same vocabulary as the desktop tray icon so the visual
  // language is consistent across platforms.
  const dotTone: 'success' | 'warning' | 'danger' = isMyAccount
    ? 'success'
    : available
      ? 'success'
      : hasActiveRequest
        ? 'warning'
        : 'danger'

  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestNote, setRequestNote] = useState('')

  const handleSendRequest = () => {
    if (!currentUser) return
    haptic.impact()
    requestAccess(account, currentUser, requestNote)
    setRequestNote('')
    setShowRequestModal(false)
  }

  const handleRelease = () => {
    Alert.alert(
      'Release Account',
      `Release ${getAccountDisplayName(account.id, account.label)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Release',
          style: 'destructive',
          onPress: () => {
            haptic.success()
            releaseAccount(account.id)
          },
        },
      ],
    )
  }

  const handleClaim = () => {
    if (!currentUser) return
    haptic.success()
    claimAccount(account, currentUser)
  }

  // Stable callback — finds the row's own pending request at call time so the closure
  // never holds a stale `accessRequests` snapshot. Without this the trailing arrow
  // would capture an old store snapshot and could cancel the wrong (or no longer
  // existing) request id after a re-render.
  const handleCancelRequest = useCallback(() => {
    const latestRequests = useAppStore.getState().accessRequests
    const req = latestRequests.find(
      (r) => r.accountId === account.id && r.requesterId === currentUser?.id && r.status === 'pending'
    )
    if (req) {
      haptic.warn()
      cancelRequest(req.id)
    }
  }, [account.id, currentUser?.id, cancelRequest])

  // Subtitle composes whatever is most useful for the row's current state — falls back
  // to "Available" so the row height stays constant when status flips.
  const subtitle =
    isMyAccount
      ? account.occupiedSince ? `You · ${formatDuration(account.occupiedSince)}` : 'You'
    : !available && account.occupiedByName
      ? `${account.occupiedByName}${account.occupiedSince ? ` · ${formatDuration(account.occupiedSince)}` : ''}`
      : 'Available'

  return (
    <>
      <ListRow
        leading={<StatusDot tone={dotTone} size={10} />}
        title={getAccountDisplayName(account.id, account.label)}
        subtitle={subtitle}
        trailing={
          <ActionButton
            isMine={isMyAccount}
            available={available}
            hasRequest={hasActiveRequest}
            blockedByMine={!!myAccount && !isMyAccount}
            onClaim={handleClaim}
            onRelease={handleRelease}
            onRequest={() => setShowRequestModal(true)}
            onCancelRequest={handleCancelRequest}
          />
        }
      />

      <Sheet
        open={showRequestModal}
        onClose={() => {
          setShowRequestModal(false)
          setRequestNote('')
        }}
        title="Request access"
        body={`${getAccountDisplayName(account.id, account.label)} is being used by ${account.occupiedByName}.`}
        inputLabel="Add a note (optional)"
        inputValue={requestNote}
        onChangeInput={setRequestNote}
        inputPlaceholder="e.g., Need to push client changes"
        primaryTitle="Send Request"
        onPrimary={handleSendRequest}
      />
    </>
  )
}

// Encapsulates the four mutually-exclusive states of the trailing action: release
// (mine), claim (available + I have no claim), cancel (I have a pending request),
// request (occupied + I have no claim). Kept inline since it has zero reuse outside this row.
function ActionButton({
  isMine,
  available,
  hasRequest,
  blockedByMine,
  onClaim,
  onRelease,
  onRequest,
  onCancelRequest,
}: {
  isMine: boolean
  available: boolean
  hasRequest: boolean
  blockedByMine: boolean
  onClaim: () => void
  onRelease: () => void
  onRequest: () => void
  onCancelRequest: () => void
}) {
  if (isMine) return <Button title="Release" variant="tinted" size="sm" onPress={onRelease} />
  if (available && !blockedByMine) return <Button title="Claim" variant="filled" size="sm" onPress={onClaim} />
  if (available && blockedByMine) {
    return (
      <View style={{ paddingHorizontal: spacing.sm }}>
        <Text variant="caption2" color="tertiary">—</Text>
      </View>
    )
  }
  if (hasRequest) return <Button title="Cancel" variant="tinted" size="sm" destructive onPress={onCancelRequest} />
  return <Button title="Request" variant="gray" size="sm" onPress={onRequest} />
}
