import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '@wam/shared'

export function Onboarding() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      const clean = msg.replace('Firebase: ', '').replace(/\(auth\/.*\)\.?/, '').trim()
      setError(clean || msg)
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-10 py-10 bg-background-primary gap-8">
      <div className="flex flex-col items-center gap-3">
        <div className="text-accent-blue">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h1 className="text-title2 text-center">Webflow Access Manager</h1>
        <p className="text-subheadline text-text-secondary text-center">
          Sign in with Google to coordinate Webflow account access with your team.
        </p>
      </div>

      <div className="w-full space-y-3">
        <Button
          type="button"
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleGoogleSignIn}
          loading={isLoading}
          disabled={isLoading}
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </Button>

        {error && <p className="text-caption text-accent-red text-center">{error}</p>}
      </div>
    </div>
  )
}
