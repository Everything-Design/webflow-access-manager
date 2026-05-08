import { useEffect, useMemo, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore, useAuthStore, useWorkspaceStore, isAccountAvailable } from '@wam/shared'
import { AccountRow } from '../../components/AccountRow'
import { ClientAccountRow } from '../../components/ClientAccountRow'
import { useTheme } from '../../utils/theme'

export default function AccountsScreen() {
  const t = useTheme()
  const accounts = useAppStore((s) => s.accounts)
  const clientAccounts = useAppStore((s) => s.clientAccounts)
  const isConnected = useAppStore((s) => s.isConnected)
  const currentUser = useAuthStore((s) => s.currentUser)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)

  const availableCount = useMemo(() => accounts.filter(isAccountAvailable).length, [accounts])
  const myAccount = useMemo(
    () => accounts.find((a) => a.occupiedBy === currentUser?.id),
    [accounts, currentUser?.id]
  )

  // Duration timer
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  // Pull-to-refresh — re-subscribes listeners
  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    if (currentUser?.id && currentWorkspaceId) {
      useAppStore.getState().setupListeners(currentUser.id, currentWorkspaceId)
    }
    setTimeout(() => setRefreshing(false), 1000)
  }, [currentUser?.id, currentWorkspaceId])

  return (
    <SafeAreaView style={[s.container, { backgroundColor: t.bg }]}>
      <View style={s.header}>
        <Text style={[s.greeting, { color: t.text }]}>Hello, {currentUser?.name}</Text>
        <View style={s.statusRow}>
          <View style={[s.dot, { backgroundColor: isConnected ? t.green : t.red }]} />
          <Text style={[s.statusText, { color: t.textSecondary }]}>{isConnected ? 'Connected' : 'Offline'}</Text>
        </View>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        <View style={s.summaryRow}>
          {myAccount ? (
            <Text style={{ fontSize: 13, color: t.accent, fontWeight: '500' }}>
              You're using {myAccount.label ?? 'an account'}
            </Text>
          ) : (
            <Text style={{ fontSize: 13, color: t.green, fontWeight: '500' }}>
              {availableCount} account{availableCount !== 1 ? 's' : ''} available
            </Text>
          )}
        </View>

        <Text style={[s.sectionTitle, { color: t.text }]}>Internal Accounts</Text>
        {accounts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 24, gap: 6 }}>
            <Text style={{ fontSize: 28 }}>🔑</Text>
            <Text style={{ fontSize: 13, color: t.text, fontWeight: '500' }}>No accounts yet</Text>
            <Text style={{ fontSize: 11, color: t.textSecondary, textAlign: 'center', maxWidth: 260 }}>
              Ask an admin to add accounts to this workspace.
            </Text>
          </View>
        ) : (
          accounts.map((account) => <AccountRow key={account.id} account={account} />)
        )}

        {clientAccounts.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { color: t.text, marginTop: 24 }]}>Client Accounts</Text>
            {clientAccounts.map((ca) => <ClientAccountRow key={ca.id} clientAccount={ca} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  greeting: { fontSize: 22, fontWeight: '600' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 11 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 0, gap: 8 },
  summaryRow: { marginBottom: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  empty: { fontSize: 13, textAlign: 'center', paddingVertical: 20 },
})
