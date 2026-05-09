import { useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuthStore } from '@wam/shared'
import { useTheme } from '../utils/theme'

export default function PendingApprovalScreen() {
  const t = useTheme()
  const currentUser = useAuthStore((s) => s.currentUser)
  const signOut = useAuthStore((s) => s.signOut)
  const subscribe = useAuthStore((s) => s.subscribeOwnStatus)

  useEffect(() => subscribe(), [subscribe])

  const status = currentUser?.status

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <Text style={s.icon}>{status === 'rejected' ? '🚫' : '⏳'}</Text>
      <Text style={[s.title, { color: t.text }]}>
        {status === 'rejected' ? 'Access denied' : 'Waiting for approval'}
      </Text>
      <Text style={[s.body, { color: t.textSecondary }]}>
        {status === 'rejected'
          ? 'Your admin declined access. Reach out to them if this is a mistake.'
          : 'Your admin needs to approve you before you can use the app.'}
      </Text>
      <Text style={[s.email, { color: t.textTertiary }]}>
        Signed in as <Text style={{ color: t.text }}>{currentUser?.email ?? currentUser?.name}</Text>
      </Text>
      {status !== 'rejected' && (
        <Text style={[s.hint, { color: t.textTertiary }]}>This screen will update automatically.</Text>
      )}
      <TouchableOpacity style={[s.btn, { backgroundColor: t.inputBg, borderColor: t.border }]} onPress={() => signOut()}>
        <Text style={[s.btnText, { color: t.text }]}>Sign out</Text>
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  icon: { fontSize: 48 },
  title: { fontSize: 20, fontWeight: '600' },
  body: { fontSize: 14, textAlign: 'center', maxWidth: 280, marginBottom: 8 },
  email: { fontSize: 12, marginTop: 4 },
  hint: { fontSize: 11, marginTop: 8 },
  btn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, borderWidth: 1 },
  btnText: { fontSize: 13, fontWeight: '500' },
})
