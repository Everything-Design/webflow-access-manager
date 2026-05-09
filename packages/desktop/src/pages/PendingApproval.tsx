import { useEffect } from 'react'
import { Button } from '../components/ui/Button'
import { useAuthStore } from '@wam/shared'

export function PendingApproval() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const signOut = useAuthStore((s) => s.signOut)
  const subscribe = useAuthStore((s) => s.subscribeOwnStatus)

  useEffect(() => subscribe(), [subscribe])

  const status = currentUser?.status

  return (
    <div className="flex flex-col items-center justify-center h-full px-8 py-10 bg-background-primary gap-6 text-center">
      <div className="text-5xl">{status === 'rejected' ? '🚫' : '⏳'}</div>
      <div>
        <h1 className="text-title3 mb-2">
          {status === 'rejected' ? 'Access denied' : 'Waiting for approval'}
        </h1>
        <p className="text-subheadline text-text-secondary max-w-xs">
          {status === 'rejected'
            ? 'Your admin declined access. Reach out to them if this is a mistake.'
            : 'Your admin needs to approve you before you can use the app.'}
        </p>
      </div>

      <div className="text-caption text-text-tertiary">
        Signed in as <span className="text-text-primary">{currentUser?.email ?? currentUser?.name}</span>
      </div>

      {status !== 'rejected' && (
        <p className="text-caption2 text-text-tertiary">
          This screen will update automatically once you're approved.
        </p>
      )}

      <Button variant="secondary" size="md" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  )
}
