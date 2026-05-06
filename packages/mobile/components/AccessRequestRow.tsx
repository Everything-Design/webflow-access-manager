import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native'
import { useAppStore, getAccountDisplayName } from '@wam/shared'
import type { AccessRequest } from '@wam/shared'
import { useTheme } from '../utils/theme'

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
      releaseAccountForRequest(request, note.trim() || undefined)
    } else if (mode === 'reject') {
      rejectRequest(request.id, note.trim() || undefined)
    }
    setMode(null)
    setNote('')
  }

  return (
    <View style={[s.card, { backgroundColor: t.cardHighlightOrange }]}>
      <View style={s.header}>
        <Text style={{ fontSize: 16, color: t.orange, fontWeight: '700' }}>!</Text>
        <Text style={[s.title, { color: t.text }]}>{request.requesterName} requests {accountName}</Text>
      </View>
      {request.requesterNote && (
        <Text style={[s.note, { color: t.textSecondary }]}>"{request.requesterNote}"</Text>
      )}
      <View style={s.actions}>
        <TouchableOpacity style={[s.acceptBtn, { backgroundColor: t.accent }]} onPress={() => setMode('accept')}>
          <Text style={s.acceptText}>Release & Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.rejectBtn, { borderColor: `${t.red}30` }]} onPress={() => setMode('reject')}>
          <Text style={{ color: t.red, fontSize: 12, fontWeight: '500' }}>Reject</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={() => setMode(null)}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[s.modalContent, { backgroundColor: t.bgElevated }]}>
            <Text style={[s.modalTitle, { color: t.text }]}>
              {mode === 'accept' ? 'Release & accept' : 'Reject request'}
            </Text>
            <Text style={[s.modalSub, { color: t.textSecondary }]}>
              {mode === 'accept'
                ? `Release ${accountName} for ${request.requesterName}.`
                : `Reject ${request.requesterName}'s request.`}
            </Text>

            <Text style={[s.modalLabel, { color: t.textSecondary }]}>Add a note (optional)</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.bg, borderColor: t.border, color: t.text }]}
              placeholder={mode === 'accept' ? 'e.g., Done in 5 mins' : 'e.g., Working on a live deploy'}
              placeholderTextColor={t.textTertiary}
              value={note}
              onChangeText={setNote}
              autoFocus
              multiline
            />

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: t.bg, borderColor: t.border }]}
                onPress={() => { setMode(null); setNote('') }}
              >
                <Text style={{ color: t.text, fontSize: 13, fontWeight: '500' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.modalBtn, { backgroundColor: mode === 'accept' ? t.accent : t.red, borderColor: 'transparent' }]}
                onPress={handleConfirm}
              >
                <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>
                  {mode === 'accept' ? 'Release & Accept' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  card: { borderRadius: 10, padding: 12, marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  title: { fontSize: 14, fontWeight: '500', flex: 1 },
  note: { fontSize: 12, fontStyle: 'italic', marginBottom: 8, marginLeft: 22 },
  actions: { flexDirection: 'row', gap: 8, marginLeft: 22 },
  acceptBtn: { borderRadius: 6, paddingHorizontal: 14, paddingVertical: 7 },
  acceptText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  rejectBtn: { borderRadius: 6, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', padding: 20 },
  modalContent: { width: '100%', maxWidth: 360, borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 17, fontWeight: '600' },
  modalSub: { fontSize: 12, marginTop: 4, marginBottom: 16 },
  modalLabel: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, fontSize: 14, minHeight: 60 },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginTop: 16 },
  modalBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: 'center' },
})
