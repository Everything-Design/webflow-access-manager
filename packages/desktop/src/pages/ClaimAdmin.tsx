import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { useAuthStore, useAdminStore } from '@wam/shared'

export function ClaimAdmin() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const signOut = useAuthStore((s) => s.signOut)
  const claim = useAdminStore((s) => s.claim)
  const [isClaiming, setIsClaiming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onClaim = async () => {
    if (!currentUser) return
    setIsClaiming(true)
    setError(null)
    try {
      await claim(currentUser.id)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not claim admin'
      setError(msg)
      setIsClaiming(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-10 bg-background-primary gap-6 text-center">
      <div className="text-5xl">👑</div>
      <div>
        <h1 className="text-title3 mb-2">No admin yet</h1>
        <p className="text-subheadline text-text-secondary max-w-xs">
          This workspace doesn't have an admin. Claim it to manage the team and account slots.
        </p>
      </div>

      <div className="text-caption text-text-tertiary">
        Signed in as <span className="text-text-primary">{currentUser?.email ?? currentUser?.name}</span>
      </div>

      <Button variant="primary" size="lg" onClick={onClaim} loading={isClaiming} disabled={isClaiming}>
        Claim admin
      </Button>

      {error && <p className="text-caption text-accent-red">{error}</p>}

      <Button variant="secondary" size="sm" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  )
}
