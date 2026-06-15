import { useState } from 'react'
import { View, TextInput } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '@wam/shared'
import { useTheme } from '../utils/theme'
import { Text, Button, Card, IconCircle, spacing, radius } from '../ui'

// Temporary manual onboarding while Google sign-in is unavailable in Expo Go (the
// embedded webview is blocked by Google's modern OAuth policy). Restore the Google
// flow once the standalone APK / iOS build is ready.

export default function OnboardingScreen() {
  const t = useTheme()
  const signInManually = useAuthStore((s) => s.signInManually)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = name.trim().length > 0 && email.trim().length > 0 && !isSubmitting

  const handleSubmit = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      await signInManually(name, email)
      // authStore's onAuthChanged listener picks it up from here and the gate routes
      // us to ClaimAdmin or PendingApproval depending on /admin state.
      router.replace('/')
    } catch (err) {
      console.error('[Onboarding] Manual sign-in failed:', err)
      const msg = err instanceof Error ? err.message : 'Could not sign in'
      setError(msg.replace(/^Firebase:\s*/, ''))
      setIsSubmitting(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: t.bgGrouped, justifyContent: 'center', padding: spacing.xxl }}>
      <View style={{ gap: spacing.xxl, alignItems: 'stretch' }}>
        <View style={{ gap: spacing.lg, alignItems: 'center' }}>
          <IconCircle emoji="👥" color="accent" size={88} />
          <View style={{ gap: spacing.sm, alignItems: 'center' }}>
            <Text variant="title1" align="center">
              Webflow Access Manager
            </Text>
            <Text
              variant="subheadline"
              color="secondary"
              align="center"
              style={{ maxWidth: 320 }}
            >
              Enter your name and email to get started. Your admin will approve you
              before you can use the app.
            </Text>
          </View>
        </View>

        <Card padding="lg">
          <View style={{ gap: spacing.lg }}>
            <View style={{ gap: spacing.xs }}>
              <Text variant="caption2" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={t.textTertiary}
                autoCapitalize="words"
                autoCorrect={false}
                style={{
                  backgroundColor: t.bgGrouped,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  fontSize: 17,
                  color: t.text,
                }}
              />
            </View>

            <View style={{ gap: spacing.xs }}>
              <Text variant="caption2" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@everything.design"
                placeholderTextColor={t.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={{
                  backgroundColor: t.bgGrouped,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  fontSize: 17,
                  color: t.text,
                }}
              />
            </View>

            <Button
              title="Continue"
              variant="filled"
              size="lg"
              fullWidth
              loading={isSubmitting}
              disabled={!canSubmit}
              onPress={handleSubmit}
            />
          </View>
        </Card>

        {error && (
          <Card tone="danger" padding="md" bordered>
            <Text variant="footnote" color="danger">
              {error}
            </Text>
          </Card>
        )}

        <Text variant="caption1" color="tertiary" align="center" style={{ paddingHorizontal: spacing.lg }}>
          Google sign-in is temporarily disabled. It'll come back once we're testing
          in a real build outside Expo Go.
        </Text>
      </View>
    </View>
  )
}
