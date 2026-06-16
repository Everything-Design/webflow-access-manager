import { useCallback, useMemo, useState } from 'react'
import { View, Pressable, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppStore, useAuthStore, useAdminStore, isAccountAvailable, formatDuration, getAccountDisplayName } from '@wam/shared'
import type { Account } from '@wam/shared'
import { useTheme } from '../utils/theme'
import { Text, Button, StatusDot, Sheet, ListRow, haptic, spacing } from '../ui'

export function AccountRow({ account }: { account: Account }) {
  const t = useTheme()
  const currentUser = useAuthStore((s) => s.currentUser)
  const accounts = useAppStore((s) => s.accounts)
  const accessRequests = useAppStore((s) => s.accessRequests)
  const claimAccount = useAppStore((s) => s.claimAccount)
  const releaseAccount = useAppStore((s) => s.releaseAccount)
  const requestAccess = useAppStore((s) => s.requestAccess)
  const cancelRequest = useAppStore((s) => s.cancelRequest)
  const deleteAccountSlot = useAppStore((s) => s.deleteAccountSlot)
  const forceReleaseAccount = useAppStore((s) => s.forceReleaseAccount)
  const updateAccountLabel = useAppStore((s) => s.updateAccountLabel)
  const adminUid = useAdminStore((s) => s.adminUid)
  const isAdmin = currentUser?.id === adminUid

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

  // Admin rename sheet
  const [showRenameSheet, setShowRenameSheet] = useState(false)
  const [renameValue, setRenameValue] = useState(account.label ?? '')

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

  const handleDelete = () => {
    const name = getAccountDisplayName(account.id, account.label)
    Alert.alert(
      `Delete ${name}?`,
      account.isOccupied
        ? `This slot is currently used by ${account.occupiedByName ?? 'someone'}. Deleting it will end their session immediately.`
        : 'Anyone with a pending request for this slot will see it disappear.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            haptic.warn()
            try {
              await deleteAccountSlot(account.id)
            } catch (err) {
              console.error('[AccountRow] delete failed:', err)
              Alert.alert("Couldn't delete", err instanceof Error ? err.message : 'Unknown error')
            }
          },
        },
      ],
    )
  }

  const handleForceRelease = () => {
    const name = getAccountDisplayName(account.id, account.label)
    if (!account.isOccupied) return
    Alert.alert(
      `Force release ${name}?`,
      `This will end ${account.occupiedByName ?? "someone's"} session. Use this when the occupier is unreachable.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Force release',
          style: 'destructive',
          onPress: async () => {
            haptic.warn()
            try {
              await forceReleaseAccount(account.id)
            } catch (err) {
              console.error('[AccountRow] force release failed:', err)
              Alert.alert("Couldn't release", err instanceof Error ? err.message : 'Unknown error')
            }
          },
        },
      ],
    )
  }

  const handleRename = async () => {
    const next = renameValue.trim()
    if (!next || next === (account.label ?? '')) {
      setShowRenameSheet(false)
      return
    }
    try {
      await updateAccountLabel(account.id, next)
      haptic.success()
      setShowRenameSheet(false)
    } catch (err) {
      console.error('[AccountRow] rename failed:', err)
      Alert.alert("Couldn't rename", err instanceof Error ? err.message : 'Unknown error')
    }
  }

  // iOS-style action sheet for admin row controls. Force release is conditional
  // on the slot actually being occupied — no point offering it on a free slot.
  const openAdminMenu = () => {
    haptic.tap()
    const options: { text: string; style?: 'destructive' | 'cancel' | 'default'; onPress?: () => void }[] = [
      {
        text: 'Rename',
        onPress: () => {
          setRenameValue(account.label ?? '')
          setShowRenameSheet(true)
        },
      },
    ]
    if (account.isOccupied) {
      options.push({ text: 'Force release', style: 'destructive', onPress: handleForceRelease })
    }
    options.push({ text: 'Delete slot', style: 'destructive', onPress: handleDelete })
    options.push({ text: 'Cancel', style: 'cancel' })
    Alert.alert(
      getAccountDisplayName(account.id, account.label),
      'Admin actions',
      options,
    )
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
  // to "Available" so the row height stays constant when status flips. For free slots
  // we additionally show how long they've been free so a slot released 30 seconds ago
  // reads differently from one that's been free for 3 days.
  const subtitle =
    isMyAccount
      ? account.occupiedSince ? `You · ${formatDuration(account.occupiedSince)}` : 'You'
    : !available && account.occupiedByName
      ? `${account.occupiedByName}${account.occupiedSince ? ` · ${formatDuration(account.occupiedSince)}` : ''}`
    : account.lastReleasedAt
      ? `Free for ${formatDuration(account.lastReleasedAt)}`
      : 'Available'

  return (
    <>
      <ListRow
        leading={<StatusDot tone={dotTone} size={10} />}
        title={getAccountDisplayName(account.id, account.label)}
        subtitle={subtitle}
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
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
            {isAdmin && (
              <Pressable
                onPress={openAdminMenu}
                hitSlop={8}
                style={({ pressed }) => ({
                  padding: spacing.sm,
                  borderRadius: 999,
                  opacity: pressed ? 0.5 : 1,
                  backgroundColor: pressed ? t.fill1 : 'transparent',
                })}
                accessibilityLabel="Admin actions"
              >
                <Ionicons name="ellipsis-horizontal" size={18} color={t.textSecondary} />
              </Pressable>
            )}
          </View>
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

      <Sheet
        open={showRenameSheet}
        onClose={() => setShowRenameSheet(false)}
        title="Rename account"
        body="Give the slot a label your team will recognise — it's purely cosmetic and doesn't reset the current claim or pending requests."
        inputLabel="Label"
        inputValue={renameValue}
        onChangeInput={setRenameValue}
        inputPlaceholder="e.g., Acme Client"
        primaryTitle="Save"
        onPrimary={handleRename}
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
