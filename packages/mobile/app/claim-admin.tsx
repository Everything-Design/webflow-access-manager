import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { useAuthStore, useAdminStore } from '@wam/shared'
import { useTheme } from '../utils/theme'

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
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <Text style={s.icon}>👑</Text>
      <Text style={[s.title, { color: t.text }]}>No admin yet</Text>
      <Text style={[s.body, { color: t.textSecondary }]}>
        This workspace doesn't have an admin. Claim it to manage the team and account slots.
      </Text>
      <Text style={[s.email, { color: t.textTertiary }]}>
        Signed in as <Text style={{ color: t.text }}>{currentUser?.email ?? currentUser?.name}</Text>
      </Text>
      <TouchableOpacity
        style={[s.btnPrimary, { backgroundColor: t.accent }, isClaiming && { opacity: 0.5 }]}
        onPress={onClaim}
        disabled={isClaiming}
      >
        {isClaiming ? <ActivityIndicator color="#fff" /> : <Text style={s.btnPrimaryText}>Claim admin</Text>}
      </TouchableOpacity>
      {error && <Text style={[s.error, { color: t.red }]}>{error}</Text>}
      <TouchableOpacity onPress={() => signOut()}>
        <Text style={[s.linkText, { color: t.textSecondary }]}>Sign out</Text>
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
  btnPrimary: { marginTop: 16, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, alignSelf: 'stretch', alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  error: { fontSize: 12 },
  linkText: { fontSize: 13, marginTop: 8 },
})
