import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useAppStore, useAuthStore, formatDuration } from '@wam/shared'
import type { ClientAccount } from '@wam/shared'
import { useTheme } from '../utils/theme'

export function ClientAccountRow({ clientAccount }: { clientAccount: ClientAccount }) {
  const t = useTheme()
  const currentUser = useAuthStore((s) => s.currentUser)
  const clearClientAccount = useAppStore((s) => s.clearClientAccount)
  const isMyAccount = currentUser?.id === clientAccount.createdBy

  return (
    <View style={[s.card, { backgroundColor: t.bgElevated }]}>
      <View style={[s.dot, { backgroundColor: t.purple }]} />
      <View style={s.info}>
        <Text style={[s.name, { color: t.text }]}>{clientAccount.clientName}</Text>
        <Text style={[s.sub, { color: t.textSecondary }]}>{clientAccount.createdByName} · {formatDuration(clientAccount.createdAt)}</Text>
      </View>
      {isMyAccount && (
        <TouchableOpacity style={[s.btn, { backgroundColor: t.bg, borderColor: t.border }]} onPress={() => clearClientAccount(clientAccount.id)}>
          <Text style={[s.btnText, { color: t.text }]}>Clear</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 10, padding: 12, marginBottom: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '500' },
  sub: { fontSize: 11, marginTop: 1 },
  btn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1 },
  btnText: { fontSize: 12, fontWeight: '500' },
})
