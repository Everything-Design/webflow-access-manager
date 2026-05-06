import { useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { useAppStore, useAuthStore, isAccountAvailable, formatDuration, getAccountDisplayName } from '@wam/shared'
import type { Account } from '@wam/shared'
import { useTheme } from '../utils/theme'

export function AccountRow({ account }: { account: Account }) {
  const t = useTheme()
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

  const dotColor = available ? t.green : hasActiveRequest ? t.yellow : t.red

  // Request note dialog
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestNote, setRequestNote] = useState('')

  const handleSendRequest = () => {
    if (currentUser) {
      requestAccess(account, currentUser, requestNote)
      setRequestNote('')
      setShowRequestModal(false)
    }
  }

  return (
    <View style={[s.card, { backgroundColor: t.bgElevated }]}>
      <View style={[s.dot, { backgroundColor: dotColor }]} />

      <View style={s.info}>
        <Text style={[s.name, { color: t.text }]}>{getAccountDisplayName(account.id, account.label)}</Text>
        {account.isOccupied && account.occupiedByName ? (
          <>
            <Text style={[s.sub, { color: t.textSecondary }]}>Used by {account.occupiedByName}</Text>
            {account.occupiedSince && (
              <Text style={[s.duration, { color: t.accent }]}>{formatDuration(account.occupiedSince)}</Text>
            )}
          </>
        ) : (
          <Text style={[s.sub, { color: t.green }]}>Available</Text>
        )}
      </View>

      <View style={s.actions}>
        {isMyAccount && (
          <TouchableOpacity
            style={[s.btn, { backgroundColor: t.bg, borderColor: t.border }]}
            onPress={() => Alert.alert('Release Account', `Release ${getAccountDisplayName(account.id, account.label)}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Release', style: 'destructive', onPress: () => releaseAccount(account.id) },
            ])}
          >
            <Text style={[s.btnText, { color: t.text }]}>Release</Text>
          </TouchableOpacity>
        )}
        {!isMyAccount && available && !myAccount && (
          <TouchableOpacity style={s.btnPrimary} onPress={() => currentUser && claimAccount(account, currentUser)}>
            <Text style={s.btnPrimaryText}>Claim</Text>
          </TouchableOpacity>
        )}
        {!isMyAccount && !available && !myAccount && !hasActiveRequest && (
          <TouchableOpacity
            style={[s.btn, { backgroundColor: t.bg, borderColor: t.border }]}
            onPress={() => setShowRequestModal(true)}
          >
            <Text style={[s.btnText, { color: t.text }]}>Request</Text>
          </TouchableOpacity>
        )}
        {/* Cancel only when account is still occupied — if available, show Claim instead */}
        {hasActiveRequest && !available && (
          <TouchableOpacity
            style={[s.btn, { backgroundColor: `${t.red}10`, borderColor: `${t.red}30` }]}
            onPress={() => {
              const req = accessRequests.find(
                (r) => r.accountId === account.id && r.requesterId === currentUser?.id && r.status === 'pending'
              )
              if (req) cancelRequest(req.id)
            }}
          >
            <Text style={[s.btnText, { color: t.red }]}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal visible={showRequestModal} transparent animationType="fade" onRequestClose={() => setShowRequestModal(false)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.modalContent, { backgroundColor: t.bgElevated }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>Request access</Text>
            <Text style={[s.modalSub, { color: t.textSecondary }]}>
              {getAccountDisplayName(account.id, account.label)} is being used by {account.occupiedByName}.
            </Text>

            <Text style={[s.modalLabel, { color: t.textSecondary }]}>Add a note (optional)</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              placeholder="e.g., Need to push client changes"
              placeholderTextColor={t.textTertiary}
              value={requestNote}
              onChangeText={setRequestNote}
              autoFocus
              multiline
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: t.bg, borderColor: t.border }]}
                onPress={() => { setShowRequestModal(false); setRequestNote('') }}
              >
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: t.accent, borderColor: t.accent }]}
                onPress={handleSendRequest}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 12, marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500' },
  sub: { fontSize: 11, marginTop: 1 },
  duration: { fontSize: 10, marginTop: 1 },
  actions: { flexDirection: 'row', gap: 6 },
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  btnText: { fontSize: 12, fontWeight: '500' },
  btnPrimary: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, backgroundColor: '#007AFF' },
  btnPrimaryText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  btnDisabled: { opacity: 0.4 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
  modalContent: { width: '100%', maxWidth: 360, borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalSub: { fontSize: 12, marginTop: 4, marginBottom: 16 },
  modalLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14, minHeight: 60 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
})
