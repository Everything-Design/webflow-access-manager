import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { authFirebase } from '@wam/shared'
import { useTheme } from '../utils/theme'
import { Text, Button, Card, IconCircle, spacing } from '../ui'
import { GOOGLE_OAUTH } from '../constants/googleOAuth'

WebBrowser.maybeCompleteAuthSession()

export default function OnboardingScreen() {
  const t = useTheme()
  const [isExchanging, setIsExchanging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_OAUTH.webClientId,
    iosClientId: GOOGLE_OAUTH.iosClientId,
    androidClientId: GOOGLE_OAUTH.androidClientId,
  })

  useEffect(() => {
    if (!response) return
    if (response.type === 'error') {
      setError(response.error?.message ?? 'Sign-in failed')
      return
    }
    if (response.type === 'success' && response.params.id_token) {
      setIsExchanging(true)
      setError(null)
      authFirebase
        .signInWithGoogleIdToken(response.params.id_token)
        .then(() => router.replace('/'))
        .catch((err) => {
          console.error('[Onboarding] Firebase credential exchange failed:', err)
          const msg = err instanceof Error ? err.message : 'Sign-in failed'
          setError(msg.replace(/^Firebase:\s*/, ''))
        })
        .finally(() => setIsExchanging(false))
    } else if (response.type === 'success') {
      setError('Google did not return an id_token. Check the OAuth client config.')
    }
  }, [response])

  const handleSignIn = async () => {
    setError(null)
    try {
      await promptAsync()
    } catch (err) {
      console.error('[Onboarding] promptAsync threw:', err)
      setError(err instanceof Error ? err.message : 'Could not open Google sign-in')
    }
  }

  const isLoading = isExchanging || !request

  return (
    <View style={{ flex: 1, backgroundColor: t.bgGrouped, justifyContent: 'center', padding: spacing.xxl }}>
      <View style={{ gap: spacing.xxl, alignItems: 'center' }}>
        <IconCircle emoji="👥" color="accent" size={88} />

        <View style={{ gap: spacing.sm, alignItems: 'center' }}>
          <Text variant="title1" align="center">
            Webflow Access Manager
          </Text>
          <Text
            variant="subheadline"
            color="secondary"
            align="center"
            style={{ maxWidth: 300 }}
          >
            Sign in with Google to coordinate Webflow account access with your team.
          </Text>
        </View>

        <Button
          title="Continue with Google"
          variant="filled"
          size="lg"
          fullWidth
          loading={isLoading}
          onPress={handleSignIn}
        />

        {error && (
          <Card tone="danger" padding="md" bordered style={{ alignSelf: 'stretch' }}>
            <Text variant="footnote" color="danger">
              {error}
            </Text>
          </Card>
        )}
      </View>
    </View>
  )
}
