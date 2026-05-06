import { useState, FormEvent } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore } from '@wam/shared'

type Mode = 'sign-in' | 'sign-up'

export function Onboarding() {
  const [mode, setMode] = useState<Mode>('sign-in')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === 'sign-up') {
        await signUp(email, password, name)
      } else {
        await signIn(email, password)
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong'
      // Clean up Firebase error messages
      const clean = msg
        .replace('Firebase: ', '')
        .replace(/\(auth\/.*\)\.?/, '')
        .trim()
      setError(clean || msg)
      setIsLoading(false)
    }
  }

  const canSubmit = mode === 'sign-up'
    ? name.trim() && email.trim() && password.length >= 6
    : email.trim() && password

  return (
    <div className="flex flex-col items-center justify-between h-full px-10 py-10 bg-background-primary">
      {/* Header */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <div className="text-accent-blue">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h1 className="text-title2 text-center">
          Webflow Access Manager
        </h1>
        <p className="text-subheadline text-text-secondary text-center">
          {mode === 'sign-up'
            ? 'Create your account to get started'
            : 'Sign in to your account'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-3">
        {mode === 'sign-up' && (
          <Input
            label="Your Name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@agency.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus={mode === 'sign-in'}
        />

        <Input
          label="Password"
          type="password"
          placeholder={mode === 'sign-up' ? 'At least 6 characters' : 'Enter password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <p className="text-caption text-accent-red">{error}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!canSubmit}
        >
          {mode === 'sign-up' ? 'Create Account' : 'Sign In'}
        </Button>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <hr className="flex-1 border-divider" />
          <span className="text-caption2 text-text-tertiary">or</span>
          <hr className="flex-1 border-divider" />
        </div>

        {/* Google Sign-In */}
        <Button
          type="button"
          variant="secondary"
          size="lg"
          fullWidth
          onClick={async () => {
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
          }}
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
      </form>

      {/* Toggle mode */}
      <button
        type="button"
        onClick={() => { setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); setError(null) }}
        className="text-caption text-accent-blue hover:underline"
      >
        {mode === 'sign-in'
          ? "Don't have an account? Sign up"
          : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}
