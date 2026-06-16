import { useEffect, useState } from 'react'
import { View, TextInput, Pressable } from 'react-native'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { authFirebase, useAuthStore } from '@wam/shared'
import { useTheme } from '../utils/theme'
import { Text, Button, Card, IconCircle, spacing, radius } from '../ui'
import { GOOGLE_OAUTH } from '../constants/googleOAuth'

// Closes the OAuth popup cleanly once the redirect resolves. Required by expo-auth-session.
WebBrowser.maybeCompleteAuthSession()

export default function OnboardingScreen() {
  const t = useTheme()
  const signInManually = useAuthStore((s) => s.signInManually)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isFirebaseReady = useAuthStore((s) => s.isFirebaseReady)

  const [showManual, setShowManual] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isExchanging, setIsExchanging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Google sign-in hook — picks iosClientId / androidClientId / webClientId at runtime
  // based on the platform and whether we're in Expo Go vs a standalone build.
  // useIdTokenAuthRequest (not useAuthRequest): we need a Google *id_token* to hand to
  // Firebase signInWithCredential. The plain auth-code flow returns a `code`, not an
  // id_token, which left us in the "no id_token" branch below. This requests the id_token
  // directly — it lands in googleResponse.params.id_token.
  const [googleRequest, googleResponse, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: GOOGLE_OAUTH.webClientId,
    iosClientId: GOOGLE_OAUTH.iosClientId,
    androidClientId: GOOGLE_OAUTH.androidClientId,
  })

  // Firebase's onAuthChanged listener fires asynchronously after any sign-in resolves,
  // so we can't navigate immediately — index.tsx would still see isAuthenticated=false
  // and bounce back here. Watch the store and route once it's caught up.
  useEffect(() => {
    if (isAuthenticated && isFirebaseReady) {
      router.replace('/')
    }
  }, [isAuthenticated, isFirebaseReady])

  // When the Google OAuth flow finishes, hand the id_token to Firebase. The authStore
  // listener picks up the new session from there.
  useEffect(() => {
    if (!googleResponse) return
    if (googleResponse.type === 'error') {
      setError(googleResponse.error?.message ?? 'Google sign-in failed')
      return
    }
    if (googleResponse.type === 'success' && googleResponse.params.id_token) {
      setIsExchanging(true)
      setError(null)
      authFirebase
        .signInWithGoogleIdToken(googleResponse.params.id_token)
        .catch((err) => {
          console.error('[Onboarding] Firebase credential exchange failed:', err)
          const msg = err instanceof Error ? err.message : 'Sign-in failed'
          setError(msg.replace(/^Firebase:\s*/, ''))
        })
        .finally(() => setIsExchanging(false))
    } else if (googleResponse.type === 'success') {
      setError('Google did not return an id_token. Check the OAuth client config.')
    }
  }, [googleResponse])

  const handleGoogleSignIn = async () => {
    setError(null)
    try {
      await promptAsync()
    } catch (err) {
      console.error('[Onboarding] promptAsync threw:', err)
      setError(err instanceof Error ? err.message : 'Could not open Google sign-in')
    }
  }

  const canSubmitManual = name.trim().length > 0 && email.trim().length > 0 && !isSubmitting

  const handleManualSubmit = async () => {
    setError(null)
    setIsSubmitting(true)
    try {
      await signInManually(name, email)
      // useEffect above handles navigation once the store updates
    } catch (err) {
      console.error('[Onboarding] Manual sign-in failed:', err)
      const msg = err instanceof Error ? err.message : 'Could not sign in'
      setError(msg.replace(/^Firebase:\s*/, ''))
      setIsSubmitting(false)
    }
  }

  const googleLoading = isExchanging || !googleRequest

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
              Sign in with Google to coordinate Webflow account access with your team.
            </Text>
          </View>
        </View>

        {/* Primary path: Google sign-in */}
        {!showManual && (
          <View style={{ gap: spacing.md }}>
            <Button
              title="Continue with Google"
              variant="filled"
              size="lg"
              fullWidth
              loading={googleLoading}
              disabled={googleLoading}
              onPress={handleGoogleSignIn}
            />

            <Pressable
              onPress={() => {
                setShowManual(true)
                setError(null)
              }}
              hitSlop={8}
              style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'center' })}
            >
              <Text variant="footnote" color="secondary">
                Sign in with email instead
              </Text>
            </Pressable>
          </View>
        )}

        {/* Fallback path: manual sign-in. Kept for testing when Google is misconfigured
            or for environments (Expo Go) where Google's embedded-webview policy blocks
            the OAuth flow. */}
        {showManual && (
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
                disabled={!canSubmitManual}
                onPress={handleManualSubmit}
              />

              <Pressable
                onPress={() => {
                  setShowManual(false)
                  setError(null)
                }}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1, alignSelf: 'center' })}
              >
                <Text variant="footnote" color="secondary">
                  Back to Google sign-in
                </Text>
              </Pressable>
            </View>
          </Card>
        )}

        {error && (
          <Card tone="danger" padding="md" bordered>
            <Text variant="footnote" color="danger">
              {error}
            </Text>
          </Card>
        )}
      </View>
    </View>
  )
}
