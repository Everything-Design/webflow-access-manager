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
        {/* Incoming requests waiting for me — animates in/out so the rest of the popup
            doesn't jump when a request arrives. grid-rows trick = animate from 0 to auto. */}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-out ${
            pendingRequestsForCurrentUser.length > 0 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="overflow-hidden">
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
        </div>

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

  // Always render two text lines so the row height is constant whether the slot is free,
  // mine, or held by someone else — prevents the row from "jumping" on state changes.
  const primary = (
    <>
      {getAccountDisplayName(account.id, account.label)}
      {isMine && <span className="text-text-secondary font-normal"> (you)</span>}
    </>
  )

  let secondary: React.ReactNode = <span className="text-text-tertiary">Available</span>
  let secondaryClass = 'text-text-tertiary'
  if (isMine && account.occupiedSince) {
    secondary = formatDuration(account.occupiedSince)
    secondaryClass = 'text-accent-blue'
  } else if (!available && !isMine && account.occupiedByName) {
    secondary = (
      <>
        {account.occupiedByName}
        {account.occupiedSince ? ` · ${formatDuration(account.occupiedSince)}` : ''}
      </>
    )
    secondaryClass = 'text-text-tertiary'
  }

  return (
    <div className="flex items-center gap-2 px-2 h-[44px] rounded bg-background-elevated">
      <StatusDot color={dotColor} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-caption font-medium truncate leading-tight">{primary}</p>
        <p className={`text-caption2 truncate leading-tight ${secondaryClass}`}>{secondary}</p>
      </div>
      {/* Fixed-width action slot — every state renders something the same size, so the
          row never shifts horizontally when the action button changes. */}
      <div className="shrink-0 w-[68px] flex justify-end">
        {isMine ? (
          <PopupButton onClick={onRelease} fullWidth>Release</PopupButton>
        ) : available ? (
          iAlreadyHaveOne ? (
            <span className="text-caption2 text-text-tertiary leading-[26px]">—</span>
          ) : (
            <PopupButton onClick={onClaim} variant="primary" fullWidth>Claim</PopupButton>
          )
        ) : hasMyRequest ? (
          <PopupButton onClick={onCancelRequest} variant="ghost" fullWidth>Cancel</PopupButton>
        ) : (
          <PopupButton onClick={onRequest} fullWidth>Request</PopupButton>
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
    <div className="px-2 py-1.5 rounded bg-accent-orange/10 border border-accent-orange/20 space-y-1">
      <p className="text-caption font-medium truncate leading-tight">
        {request.requesterName} wants {getAccountDisplayName(request.accountId, request.accountLabel)}
      </p>
      {/* Note line is always rendered to keep the row height constant — falls back to a
          neutral hint when no note was attached. */}
      <p
        className={`text-caption2 truncate leading-tight ${
          request.requesterNote ? 'text-text-secondary' : 'text-text-tertiary italic'
        }`}
      >
        {request.requesterNote ? `"${request.requesterNote}"` : 'No note attached'}
      </p>
      <div className="flex gap-1.5 pt-0.5">
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
  fullWidth = false,
}: {
  children: React.ReactNode
  onClick: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
}) {
  const base =
    'text-caption2 font-medium px-2 h-[26px] rounded transition-colors whitespace-nowrap text-center'
  const width = fullWidth ? 'w-full' : ''
  const styles =
    variant === 'primary'
      ? 'bg-accent-blue text-white hover:bg-accent-blue/90'
      : variant === 'ghost'
        ? 'text-text-secondary hover:text-text-primary hover:bg-background-elevated'
        : 'bg-background-elevated text-text-primary hover:bg-background-tertiary border border-border'
  return (
    <button onClick={onClick} className={`${base} ${width} ${styles}`}>
      {children}
    </button>
  )
}
