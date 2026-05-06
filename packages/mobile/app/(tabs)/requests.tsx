import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore } from '@wam/shared'
import { AccessRequestRow } from '../../components/AccessRequestRow'
import { useTheme } from '../../utils/theme'

export default function RequestsScreen() {
  const t = useTheme()
  const pendingRequests = useAppStore((s) => s.pendingRequestsForCurrentUser)

  return (
    <SafeAreaView style={[s.container, { backgroundColor: t.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: t.text }]}>Access Requests</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {pendingRequests.length > 0 ? (
          <>
            <Text style={[s.sectionTitle, { color: t.text }]}>Pending — Action Required</Text>
            {pendingRequests.map((req) => <AccessRequestRow key={req.id} request={req} />)}
          </>
        ) : (
          <View style={s.emptyContainer}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={[s.emptyTitle, { color: t.text }]}>No pending requests</Text>
            <Text style={[s.emptyText, { color: t.textSecondary }]}>
              When someone requests access to an account you're using, it'll appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 0, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontSize: 15, fontWeight: '600' },
  emptyText: { fontSize: 13, textAlign: 'center', maxWidth: 260 },
})
