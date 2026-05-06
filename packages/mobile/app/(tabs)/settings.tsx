import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore, useAppStore, useWorkspaceStore } from '@wam/shared'
import { useTheme } from '../../utils/theme'

const ICONS = [
  { id: 'user', emoji: '👤' }, { id: 'star', emoji: '⭐' }, { id: 'heart', emoji: '❤️' },
  { id: 'bolt', emoji: '⚡' }, { id: 'flame', emoji: '🔥' }, { id: 'moon', emoji: '🌙' },
  { id: 'sun', emoji: '☀️' }, { id: 'cloud', emoji: '☁️' }, { id: 'leaf', emoji: '🍃' },
  { id: 'sparkles', emoji: '✨' }, { id: 'crown', emoji: '👑' }, { id: 'rocket', emoji: '🚀' },
]

const COLORS = [
  { name: 'Blue', hex: '0066CC' }, { name: 'Purple', hex: '7C3AED' },
  { name: 'Pink', hex: 'EC4899' }, { name: 'Red', hex: 'EF4444' },
  { name: 'Orange', hex: 'F97316' }, { name: 'Green', hex: '10B981' },
  { name: 'Teal', hex: '14B8A6' }, { name: 'Indigo', hex: '6366F1' },
]

export default function SettingsScreen() {
  const t = useTheme()
  const currentUser = useAuthStore((s) => s.currentUser)
  const updateUser = useAuthStore((s) => s.updateUser)
  const signOut = useAuthStore((s) => s.signOut)
  const isConnected = useAppStore((s) => s.isConnected)
  const accounts = useAppStore((s) => s.accounts)
  const clientAccounts = useAppStore((s) => s.clientAccounts)
  const users = useAppStore((s) => s.users)
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace)
  const myRole = useWorkspaceStore((s) => s.myRole)
  const members = useWorkspaceStore((s) => s.members)
  const memberCount = members.length

  const onlineMemberCount = members.filter((m) =>
    users.some((u) => u.id === m.userId && u.isOnline)
  ).length
  const occupiedAccounts = accounts.filter((a) => a.isOccupied).length
  const availableAccounts = accounts.length - occupiedAccounts

  const [name, setName] = useState(currentUser?.name ?? '')
  const [icon, setIcon] = useState(currentUser?.profileIcon ?? 'user')
  const [color, setColor] = useState(currentUser?.profileColor ?? '0066CC')

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name)
      setIcon(currentUser.profileIcon ?? 'user')
      setColor(currentUser.profileColor ?? '0066CC')
    }
  }, [currentUser])

  const handleSave = async () => {
    await updateUser({ name: name.trim(), profileIcon: icon, profileColor: color })
    Alert.alert('Saved', 'Profile updated successfully')
  }

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/onboarding') } },
    ])
  }

  return (
    <SafeAreaView style={[s.container, { backgroundColor: t.bg }]}>
      <View style={s.header}>
        <Text style={[s.title, { color: t.text }]}>Settings</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <Text style={[s.sectionTitle, { color: t.text }]}>Profile</Text>
        <View style={[s.card, { backgroundColor: t.bgElevated }]}>
          <View style={s.profileRow}>
            <View style={[s.avatar, { backgroundColor: `#${color}20` }]}>
              <Text style={s.avatarEmoji}>{ICONS.find((i) => i.id === icon)?.emoji ?? '👤'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.label, { color: t.textSecondary }]}>Name</Text>
              <TextInput
                style={[s.input, { backgroundColor: t.bg, color: t.text }]}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={t.textTertiary}
              />
              {currentUser?.email && <Text style={[s.emailText, { color: t.textSecondary }]}>{currentUser.email}</Text>}
            </View>
          </View>

          <Text style={[s.label, { color: t.textSecondary, marginTop: 12 }]}>Icon</Text>
          <View style={s.grid}>
            {ICONS.map((i) => (
              <TouchableOpacity
                key={i.id}
                style={[s.iconBtn, { backgroundColor: t.bg, borderColor: icon === i.id ? `#${color}` : t.border }, icon === i.id && { borderWidth: 2 }]}
                onPress={() => setIcon(i.id)}
              >
                <Text style={{ fontSize: 20 }}>{i.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { color: t.textSecondary, marginTop: 12 }]}>Color</Text>
          <View style={s.colorGrid}>
            {COLORS.map((c) => (
              <TouchableOpacity key={c.hex} onPress={() => setColor(c.hex)} style={s.colorWrap}>
                <View style={[s.colorDot, { backgroundColor: `#${c.hex}` }, color === c.hex && { borderWidth: 3, borderColor: t.text }]} />
                <Text style={[s.colorName, { color: t.textSecondary }]}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {currentWorkspace && (
          <>
            <Text style={[s.sectionTitle, { color: t.text, marginTop: 24 }]}>Workspace</Text>
            <View style={[s.card, { backgroundColor: t.bgElevated }]}>
              <Text style={[s.label, { color: t.textSecondary }]}>Name</Text>
              <Text style={{ fontSize: 15, color: t.text, fontWeight: '500', marginBottom: 10 }}>
                {currentWorkspace.name}
              </Text>

              <Text style={[s.label, { color: t.textSecondary }]}>Workspace ID (share to invite)</Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Workspace ID', currentWorkspace.id, [{ text: 'OK' }])}
                style={{ paddingVertical: 4 }}
              >
                <Text selectable style={{ fontSize: 18, color: t.accent, fontWeight: '600', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                  {currentWorkspace.id}
                </Text>
              </TouchableOpacity>

              <View style={{ marginTop: 12 }}>
                <Text style={[s.label, { color: t.textSecondary }]}>Your role</Text>
                <Text style={{ fontSize: 13, color: t.text, textTransform: 'capitalize' }}>{myRole ?? 'member'}</Text>
              </View>
            </View>

            {/* Overview */}
            <Text style={[s.sectionTitle, { color: t.text, marginTop: 24 }]}>Overview</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View style={[s.statCard, { backgroundColor: t.bgElevated }]}>
                <Text style={[s.statLabel, { color: t.textSecondary }]}>MEMBERS</Text>
                <Text style={[s.statValue, { color: t.text }]}>{memberCount}</Text>
                <Text style={{ fontSize: 11, color: t.green, marginTop: 2 }}>{onlineMemberCount} online</Text>
              </View>

              <View style={[s.statCard, { backgroundColor: t.bgElevated }]}>
                <Text style={[s.statLabel, { color: t.textSecondary }]}>INTERNAL</Text>
                <Text style={[s.statValue, { color: t.text }]}>{accounts.length}</Text>
                <Text style={{ fontSize: 11, marginTop: 2 }}>
                  <Text style={{ color: t.green }}>{availableAccounts} free</Text>
                  <Text style={{ color: t.textSecondary }}> · </Text>
                  <Text style={{ color: t.red }}>{occupiedAccounts} in use</Text>
                </Text>
              </View>

              <View style={[s.statCard, { backgroundColor: t.bgElevated, flexBasis: '100%' }]}>
                <Text style={[s.statLabel, { color: t.textSecondary }]}>CLIENT ACCOUNTS</Text>
                <Text style={[s.statValue, { color: t.text }]}>{clientAccounts.length}</Text>
              </View>
            </View>
          </>
        )}

        <Text style={[s.sectionTitle, { color: t.text, marginTop: 24 }]}>Connection</Text>
        <View style={[s.card, { backgroundColor: t.bgElevated }]}>
          <View style={s.statusRow}>
            <View style={[s.dot, { backgroundColor: isConnected ? t.green : t.red }]} />
            <Text style={{ fontSize: 13, color: t.text }}>{isConnected ? 'Connected to Firebase' : 'Disconnected'}</Text>
          </View>
        </View>

        <View style={{ marginTop: 24, gap: 10 }}>
          <TouchableOpacity style={[s.saveBtn, { backgroundColor: t.accent }]} onPress={handleSave} disabled={!name.trim()}>
            <Text style={s.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.signOutBtn, { backgroundColor: t.bgElevated, borderColor: t.border }]} onPress={handleSignOut}>
            <Text style={[s.signOutBtnText, { color: t.text }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 22, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  card: { borderRadius: 12, padding: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarEmoji: { fontSize: 24 },
  label: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  input: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 15 },
  emailText: { fontSize: 11, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  colorWrap: { alignItems: 'center', gap: 4 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorName: { fontSize: 9 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  saveBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  signOutBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  signOutBtnText: { fontSize: 15, fontWeight: '500' },
  statCard: { flex: 1, minWidth: 140, borderRadius: 12, padding: 12 },
  statLabel: { fontSize: 9, fontWeight: '600', letterSpacing: 0.5 },
  statValue: { fontSize: 22, fontWeight: '600', marginTop: 4 },
})
