import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '@wam/shared'
import { useTheme } from '../utils/theme'

export default function OnboardingScreen() {
  const t = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)

  const handleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      router.replace('/')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      setError(msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim() || msg)
      setIsLoading(false)
    }
  }

  return (
    <View style={[s.container, { backgroundColor: t.bg }]}>
      <View style={s.content}>
        <Text style={s.icon}>👥</Text>
        <Text style={[s.title, { color: t.text }]}>Webflow Access Manager</Text>
        <Text style={[s.subtitle, { color: t.textSecondary }]}>
          Sign in with Google to coordinate Webflow account access with your team.
        </Text>

        <TouchableOpacity
          style={[s.button, { backgroundColor: t.accent }, isLoading && s.buttonDisabled]}
          onPress={handleSignIn}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Continue with Google</Text>}
        </TouchableOpacity>

        {error && <Text style={[s.error, { color: t.red }]}>{error}</Text>}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 32 },
  content: { gap: 16, alignItems: 'center' },
  icon: { fontSize: 48 },
  title: { fontSize: 22, fontWeight: '600', textAlign: 'center' },
  subtitle: { fontSize: 13, textAlign: 'center', marginBottom: 12, maxWidth: 280 },
  button: { borderRadius: 8, paddingVertical: 14, paddingHorizontal: 32, alignItems: 'center', alignSelf: 'stretch', marginTop: 4 },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  error: { fontSize: 11 },
})
