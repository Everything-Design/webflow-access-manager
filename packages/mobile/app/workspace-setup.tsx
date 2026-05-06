import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Switch } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore, useWorkspaceStore, migrateExistingDataToWorkspace } from '@wam/shared'
import { useTheme } from '../utils/theme'

type Mode = 'choose' | 'create' | 'join'

export default function WorkspaceSetupScreen() {
  const t = useTheme()
  const [mode, setMode] = useState<Mode>('choose')
  const [name, setName] = useState('')
  const [wsId, setWsId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [migrateData, setMigrateData] = useState(true)

  const currentUser = useAuthStore((s) => s.currentUser)
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace)
  const joinWorkspace = useWorkspaceStore((s) => s.joinWorkspace)

  const handleCreate = async () => {
    if (!currentUser || !name.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const newWsId = await createWorkspace(name.trim(), currentUser)
      if (migrateData) {
        await migrateExistingDataToWorkspace(newWsId)
      }
      router.replace('/(tabs)/accounts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!currentUser || !wsId.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      await joinWorkspace(wsId.trim().toUpperCase(), currentUser)
      router.replace('/(tabs)/accounts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join workspace')
      setIsLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <View style={[s.container, { backgroundColor: t.bg }]}>
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>🏢</Text>
          <Text style={[s.title, { color: t.text }]}>Set Up Your Workspace</Text>
          <Text style={[s.subtitle, { color: t.textSecondary }]}>
            Create a workspace for your agency or join an existing one
          </Text>
        </View>
        <View style={s.buttons}>
          <TouchableOpacity style={[s.primaryBtn, { backgroundColor: t.accent }]} onPress={() => setMode('create')}>
            <Text style={s.primaryBtnText}>Create Workspace</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.secondaryBtn, { backgroundColor: t.bgElevated, borderColor: t.border }]} onPress={() => setMode('join')}>
            <Text style={[s.secondaryBtnText, { color: t.text }]}>Join Workspace</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (mode === 'create') {
    return (
      <KeyboardAvoidingView style={[s.container, { backgroundColor: t.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
          <View style={s.center}>
            <Text style={{ fontSize: 48 }}>🏢</Text>
            <Text style={[s.title, { color: t.text }]}>Create Workspace</Text>
            <Text style={[s.subtitle, { color: t.textSecondary }]}>Your team will use the workspace ID to join</Text>
          </View>

          <View style={{ gap: 12 }}>
            <View>
              <Text style={[s.label, { color: t.textSecondary }]}>Agency / Team Name</Text>
              <TextInput
                style={[s.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
                placeholder="e.g., Everythingflow Studio"
                placeholderTextColor={t.textTertiary}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Switch value={migrateData} onValueChange={setMigrateData} />
              <Text style={[{ fontSize: 12, color: t.textSecondary, flex: 1 }]}>Migrate existing account data</Text>
            </View>

            {error && <Text style={{ fontSize: 11, color: t.red }}>{error}</Text>}

            <TouchableOpacity
              style={[s.primaryBtn, { backgroundColor: t.accent }, (!name.trim() || isLoading) && { opacity: 0.4 }]}
              onPress={handleCreate}
              disabled={!name.trim() || isLoading}
            >
              <Text style={s.primaryBtnText}>{isLoading ? 'Creating...' : 'Create Workspace'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => { setMode('choose'); setError(null) }}>
            <Text style={{ fontSize: 12, color: t.accent, textAlign: 'center' }}>Back</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: t.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.form} keyboardShouldPersistTaps="handled">
        <View style={s.center}>
          <Text style={{ fontSize: 48 }}>🔗</Text>
          <Text style={[s.title, { color: t.text }]}>Join Workspace</Text>
          <Text style={[s.subtitle, { color: t.textSecondary }]}>Enter the workspace ID shared by your team</Text>
        </View>

        <View style={{ gap: 12 }}>
          <View>
            <Text style={[s.label, { color: t.textSecondary }]}>Workspace ID</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
              placeholder="e.g., EF-7X3K9"
              placeholderTextColor={t.textTertiary}
              value={wsId}
              onChangeText={(v) => setWsId(v.toUpperCase())}
              autoCapitalize="characters"
              autoFocus
            />
          </View>

          {error && <Text style={{ fontSize: 11, color: t.red }}>{error}</Text>}

          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: t.accent }, (!wsId.trim() || isLoading) && { opacity: 0.4 }]}
            onPress={handleJoin}
            disabled={!wsId.trim() || isLoading}
          >
            <Text style={s.primaryBtnText}>{isLoading ? 'Joining...' : 'Join Workspace'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => { setMode('choose'); setError(null) }}>
          <Text style={{ fontSize: 12, color: t.accent, textAlign: 'center' }}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center: { alignItems: 'center', gap: 8 },
  form: { flexGrow: 1, justifyContent: 'space-between', padding: 32, paddingTop: 80 },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', maxWidth: 280 },
  buttons: { gap: 12, paddingBottom: 40 },
  label: { fontSize: 11, fontWeight: '500', marginBottom: 4 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  primaryBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  secondaryBtn: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', borderWidth: 1 },
  secondaryBtnText: { fontSize: 15, fontWeight: '500' },
})
