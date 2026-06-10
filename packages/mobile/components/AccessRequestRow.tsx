import { useState } from 'react'
import { View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAppStore, getAccountDisplayName } from '@wam/shared'
import type { AccessRequest } from '@wam/shared'
import { useTheme } from '../utils/theme'
import { Text, Button, Card, IconCircle, Sheet, haptic, spacing } from '../ui'

type Mode = 'accept' | 'reject' | null

export function AccessRequestRow({ request }: { request: AccessRequest }) {
  const t = useTheme()
  const releaseAccountForRequest = useAppStore((s) => s.releaseAccountForRequest)
  const rejectRequest = useAppStore((s) => s.rejectRequest)
  const accountName = getAccountDisplayName(request.accountId, request.accountLabel)

  const [mode, setMode] = useState<Mode>(null)
  const [note, setNote] = useState('')

  const handleConfirm = () => {
    if (mode === 'accept') {
      haptic.success()
      releaseAccountForRequest(request, note.trim() || undefined)
    } else if (mode === 'reject') {
      haptic.warn()
      rejectRequest(request.id, note.trim() || undefined)
    }
    setMode(null)
    setNote('')
  }

  return (
    <>
      <Card tone="warning" bordered padding="md">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
          <IconCircle
            glyph={<Ionicons name="alert" size={16} color={t.orange} />}
            color="orange"
            size={32}
          />

          <View style={{ flex: 1, gap: spacing.sm }}>
            <Text variant="callout" weight="semibold">
              {request.requesterName} wants {accountName}
            </Text>

            {/* Always render the note line — falls back to a neutral hint so the card
                height stays constant whether the requester left a note or not. */}
            <Text
              variant="footnote"
              color={request.requesterNote ? 'secondary' : 'tertiary'}
              style={request.requesterNote ? undefined : { fontStyle: 'italic' }}
            >
              {request.requesterNote ? `"${request.requesterNote}"` : 'No note attached'}
            </Text>

            <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
              <Button title="Hand over" variant="filled" size="sm" onPress={() => setMode('accept')} />
              <Button title="Decline" variant="gray" size="sm" destructive onPress={() => setMode('reject')} />
            </View>
          </View>
        </View>
      </Card>

      <Sheet
        open={mode !== null}
        onClose={() => {
          setMode(null)
          setNote('')
        }}
        title={mode === 'accept' ? 'Hand over account' : 'Decline request'}
        body={
          mode === 'accept'
            ? `Release ${accountName} for ${request.requesterName}.`
            : `Decline ${request.requesterName}'s request.`
        }
        inputLabel="Add a note (optional)"
        inputValue={note}
        onChangeInput={setNote}
        inputPlaceholder={mode === 'accept' ? 'e.g., Done in 5 mins' : 'e.g., In a live deploy'}
        primaryTitle={mode === 'accept' ? 'Hand over' : 'Decline'}
        primaryDestructive={mode === 'reject'}
        onPrimary={handleConfirm}
      />
    </>
  )
}
