import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '@wam/shared'
import { useTheme } from '../utils/theme'

type Mode = 'sign-in' | 'sign-up'

export default function OnboardingScreen() {
  const t = useTheme()
  const [mode, setMode] = useState<Mode>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)
    try {
      if (mode === 'sign-up') {
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }
      // Route to root — index.tsx will check workspace state and redirect appropriately
      router.replace('/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || msg)
      setIsLoading(false)
    }
  }

  const canSubmit = mode === 'sign-up'
    ? name.trim() && email.trim() && password.length >= 6
    : email.trim() && password

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: t.bg }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={s.header}>
          <Text style={s.icon}>👥</Text>
          <Text style={[s.title, { color: t.text }]}>Webflow Access Manager</Text>
          <Text style={[s.subtitle, { color: t.textSecondary }]}>
            {mode === 'sign-up' ? 'Create your account' : 'Sign in to your account'}
          </Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          {mode === 'sign-up' && (
            <View style={s.field}>
              <Text style={[s.label, { color: t.textSecondary }]}>Your Name</Text>
              <TextInput
                style={[s.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
                placeholder="Enter your name"
                placeholderTextColor={t.textTertiary}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={s.field}>
            <Text style={[s.label, { color: t.textSecondary }]}>Email</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
              placeholder="you@agency.com"
              placeholderTextColor={t.textTertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={s.field}>
            <Text style={[s.label, { color: t.textSecondary }]}>Password</Text>
            <TextInput
              style={[s.input, { backgroundColor: t.inputBg, borderColor: t.border, color: t.text }]}
              placeholder={mode === 'sign-up' ? 'At least 6 characters' : 'Enter password'}
              placeholderTextColor={t.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && <Text style={[s.error, { color: t.red }]}>{error}</Text>}

          <TouchableOpacity
            style={[s.button, { backgroundColor: t.accent }, !canSubmit && s.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.buttonText}>
                {mode === 'sign-up' ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle */}
        <TouchableOpacity onPress={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(null) }}>
          <Text style={[s.toggle, { color: t.accent }]}>
            {mode === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f6f6' },
  scroll: { flexGrow: 1, justifyContent: 'space-between', padding: 32, paddingTop: 80 },
  header: { alignItems: 'center', gap: 8 },
  icon: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '600', color: '#1d1d1f', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#86868b', textAlign: 'center' },
  form: { gap: 12 },
  field: { gap: 4 },
  label: { fontSize: 11, fontWeight: '500', color: '#86868b' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: '#1d1d1f',
  },
  error: { fontSize: 11, color: '#FF3B30' },
  button: {
    backgroundColor: '#007AFF', borderRadius: 8, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  toggle: { fontSize: 11, color: '#007AFF', textAlign: 'center', paddingBottom: 20 },
})
