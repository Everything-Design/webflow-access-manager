import { useEffect, useMemo, useState } from 'react'
import { StatusDot } from '../components/ui/StatusDot'
import { Button } from '../components/ui/Button'
import {
  useAppStore,
  useAuthStore,
  formatDuration,
  getAccountDisplayName,
} from '@wam/shared'
import type { Account, AccessRequest } from '@wam/shared'

export function TrayPopup() {
  const accounts = useAppStore((s) => s.accounts)
  const accessRequests = useAppStore((s) => s.accessRequests)
  const pendingRequestsForCurrentUser = useAppStore((s) => s.pendingRequestsForCurrentUser)
  const isConnected = useAppStore((s) => s.isConnected)
  const currentUser = useAuthStore((s) => s.currentUser)

  const claimAccount = useAppStore((s) => s.claimAccount)
  const releaseAccount = useAppStore((s) => s.releaseAccount)
  const requestAccess = useAppStore((s) => s.requestAccess)
  const cancelRequest = useAppStore((s) => s.cancelRequest)
  const releaseAccountForRequest = useAppStore((s) => s.releaseAccountForRequest)
  const rejectRequest = useAppStore((s) => s.rejectRequest)

  const myAccount = useMemo(
    () => accounts.find((a) => a.occupiedBy === currentUser?.id),
    [accounts, currentUser?.id]
  )

  // Refresh duration labels every 60s
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="flex flex-col h-full bg-background-primary">
      {/* Header */}
      <div className="flex items-start justify-between p-3 titlebar-drag">
        <div className="titlebar-no-drag min-w-0">
          {currentUser && (
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-headline truncate">{currentUser.name}</span>
              <div className="flex items-center gap-1.5">
                <StatusDot color={isConnected ? 'green' : 'red'} size="sm" />
                <span className="text-caption2 text-text-secondary">
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="border-divider" />

      {/* Body — pending requests on top, then accounts list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Incoming requests waiting for me */}
        {pendingRequestsForCurrentUser.length > 0 && (
          <div>
            <p className="text-caption2 text-accent-orange uppercase tracking-wide mb-1.5">
              Waiting for you
            </p>
            <div className="space-y-1.5">
              {pendingRequestsForCurrentUser.map((r) => (
                <PendingRow
                  key={r.id}
                  request={r}
                  onAccept={() => releaseAccountForRequest(r)}
                  onDecline={() => rejectRequest(r.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Accounts */}
        <div>
          <p className="text-caption2 text-text-secondary uppercase tracking-wide mb-1.5">
            Internal accounts
          </p>
          {accounts.length === 0 ? (
            <p className="text-caption text-text-tertiary py-2">
              No account slots yet. Add some from the dashboard.
            </p>
          ) : (
            <div className="space-y-1">
              {accounts.map((a) => (
                <PopupAccountRow
                  key={a.id}
                  account={a}
                  isMine={a.occupiedBy === currentUser?.id}
                  hasMyRequest={accessRequests.some(
                    (r) => r.accountId === a.id && r.requesterId === currentUser?.id && r.status === 'pending'
                  )}
                  iAlreadyHaveOne={!!myAccount}
                  onClaim={() => currentUser && claimAccount(a, currentUser)}
                  onRelease={() => releaseAccount(a.id)}
                  onRequest={() => currentUser && requestAccess(a, currentUser)}
                  onCancelRequest={() => {
                    const req = accessRequests.find(
                      (r) => r.accountId === a.id && r.requesterId === currentUser?.id && r.status === 'pending'
                    )
                    if (req) cancelRequest(req.id)
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <hr className="border-divider" />

      {/* Footer */}
      <div className="p-3 space-y-2 titlebar-no-drag">
        <Button fullWidth onClick={() => window.electronAPI?.openDashboard()}>
          Open Dashboard
        </Button>
        <Button variant="secondary" fullWidth onClick={() => window.electronAPI?.quitApp()}>
          Quit
        </Button>
      </div>
    </div>
  )
}

// ─── Subcomponents ───

function PopupAccountRow({
  account,
  isMine,
  hasMyRequest,
  iAlreadyHaveOne,
  onClaim,
  onRelease,
  onRequest,
  onCancelRequest,
}: {
  account: Account
  isMine: boolean
  hasMyRequest: boolean
  iAlreadyHaveOne: boolean
  onClaim: () => void
  onRelease: () => void
  onRequest: () => void
  onCancelRequest: () => void
}) {
  const available = !account.isOccupied
  const dotColor = isMine ? 'blue' : available ? 'green' : 'red'

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-background-elevated">
      <StatusDot color={dotColor} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-caption font-medium truncate">
          {getAccountDisplayName(account.id, account.label)}
          {isMine && <span className="text-text-secondary font-normal"> (you)</span>}
        </p>
        {!available && !isMine && account.occupiedByName && (
          <p className="text-caption2 text-text-tertiary truncate">
            {account.occupiedByName}
            {account.occupiedSince ? ` · ${formatDuration(account.occupiedSince)}` : ''}
          </p>
        )}
        {isMine && account.occupiedSince && (
          <p className="text-caption2 text-accent-blue">{formatDuration(account.occupiedSince)}</p>
        )}
      </div>
      <div className="shrink-0">
        {isMine ? (
          <PopupButton onClick={onRelease}>Release</PopupButton>
        ) : available ? (
          // Don't let someone claim a second slot if they already hold one
          iAlreadyHaveOne ? (
            <span className="text-caption2 text-text-tertiary">—</span>
          ) : (
            <PopupButton onClick={onClaim} variant="primary">Claim</PopupButton>
          )
        ) : hasMyRequest ? (
          <PopupButton onClick={onCancelRequest} variant="ghost">Cancel</PopupButton>
        ) : (
          <PopupButton onClick={onRequest}>Request</PopupButton>
        )}
      </div>
    </div>
  )
}

function PendingRow({
  request,
  onAccept,
  onDecline,
}: {
  request: AccessRequest
  onAccept: () => void
  onDecline: () => void
}) {
  return (
    <div className="px-2 py-1.5 rounded bg-accent-orange/10 border border-accent-orange/20">
      <p className="text-caption font-medium truncate">
        {request.requesterName} wants {getAccountDisplayName(request.accountId, request.accountLabel)}
      </p>
      {request.requesterNote && (
        <p className="text-caption2 text-text-secondary truncate mb-1.5">
          "{request.requesterNote}"
        </p>
      )}
      <div className="flex gap-1.5 mt-1">
        <PopupButton onClick={onAccept} variant="primary">Hand over</PopupButton>
        <PopupButton onClick={onDecline} variant="ghost">Decline</PopupButton>
      </div>
    </div>
  )
}

function PopupButton({
  children,
  onClick,
  variant = 'secondary',
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
}) {
  const base = 'text-caption2 font-medium px-2 py-1 rounded transition-colors whitespace-nowrap'
  const styles =
    variant === 'primary'
      ? 'bg-accent-blue text-white hover:bg-accent-blue/90'
      : variant === 'ghost'
        ? 'text-text-secondary hover:text-text-primary hover:bg-background-elevated'
        : 'bg-background-elevated text-text-primary hover:bg-background-tertiary border border-border'
  return (
    <button onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  )
}
