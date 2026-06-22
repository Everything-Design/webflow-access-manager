import { useEffect, useMemo, useState } from 'react'
import { StatusDot } from '../components/ui/StatusDot'
import {
  useAppStore,
  useAuthStore,
  formatDuration,
  getAccountDisplayName,
} from '@wam/shared'
import type { Account, ClientAccount, AccessRequest } from '@wam/shared'

// Profile icon id → emoji (mirrors Settings' AVAILABLE_ICONS).
const ICON_EMOJI: Record<string, string> = {
  user: '👤', star: '⭐', heart: '❤️', bolt: '⚡', flame: '🔥', moon: '🌙',
  sun: '☀️', cloud: '☁️', leaf: '🍃', sparkles: '✨', crown: '👑', rocket: '🚀',
}

type Tab = 'internal' | 'client' | 'log'

function timeAgo(secs: number): string {
  const diff = Math.floor(Date.now() / 1000) - secs
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function TrayPopup() {
  const accounts = useAppStore((s) => s.accounts)
  const clientAccounts = useAppStore((s) => s.clientAccounts)
  const accessRequests = useAppStore((s) => s.accessRequests)
  const allAccessRequests = useAppStore((s) => s.allAccessRequests)
  const pendingRequestsForCurrentUser = useAppStore((s) => s.pendingRequestsForCurrentUser)
  const isConnected = useAppStore((s) => s.isConnected)
  const currentUser = useAuthStore((s) => s.currentUser)

  const claimAccount = useAppStore((s) => s.claimAccount)
  const releaseAccount = useAppStore((s) => s.releaseAccount)
  const requestAccess = useAppStore((s) => s.requestAccess)
  const cancelRequest = useAppStore((s) => s.cancelRequest)
  const releaseAccountForRequest = useAppStore((s) => s.releaseAccountForRequest)
  const rejectRequest = useAppStore((s) => s.rejectRequest)
  const clearClientAccount = useAppStore((s) => s.clearClientAccount)

  const myAccount = useMemo(
    () => accounts.find((a) => a.occupiedBy === currentUser?.id),
    [accounts, currentUser?.id]
  )

  const [tab, setTab] = useState<Tab>('internal')
  const [, setTick] = useState(0)

  // Refresh duration/relative-time labels every 60s.
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  // Log = every resolved request in the app, newest first.
  const logItems = useMemo(
    () =>
      allAccessRequests
        .filter((r) => r.status !== 'pending')
        .sort((a, b) => b.requestedAt - a.requestedAt),
    [allAccessRequests]
  )

  const emoji = ICON_EMOJI[currentUser?.profileIcon ?? 'user'] ?? '👤'
  const avatarColor = currentUser?.profileColor ?? '0066CC'
  const ringColor = isConnected ? 'green' : 'red'

  return (
    <div className="flex flex-col h-full bg-background-primary">
      {/* Header */}
      <div className="px-3 pt-3 titlebar-drag">
        <div className="flex items-center gap-3 titlebar-no-drag">
          <div
            className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `#${avatarColor}20`, boxShadow: `0 0 0 2px ${dotHex(ringColor)}` }}
          >
            {emoji}
          </div>
          <div className="min-w-0">
            <p className="text-headline truncate leading-tight">{currentUser?.name ?? 'Signed in'}</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusDot color={isConnected ? 'green' : 'red'} size="sm" />
              <span className="text-caption2 text-text-secondary">
                {isConnected ? 'Available' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="titlebar-no-drag mt-3 flex gap-1 p-1 rounded-lg bg-background-elevated">
          <TabButton active={tab === 'internal'} onClick={() => setTab('internal')} label="Internal" />
          <TabButton active={tab === 'client'} onClick={() => setTab('client')} label="Client" />
          <TabButton active={tab === 'log'} onClick={() => setTab('log')} label="Log" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3 mt-1">
        {/* Incoming requests stay visible on every tab */}
        {pendingRequestsForCurrentUser.length > 0 && (
          <div>
            <p className="text-caption2 uppercase tracking-wide text-accent-orange mb-1.5 px-0.5">
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

        {tab === 'internal' && (
          accounts.length === 0 ? (
            <Empty>No account slots yet. Add some from the dashboard.</Empty>
          ) : (
            <div className="space-y-1">
              {accounts.map((a) => (
                <AccountRow
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
          )
        )}

        {tab === 'client' && (
          clientAccounts.length === 0 ? (
            <Empty>No client accounts in use.</Empty>
          ) : (
            <div className="space-y-1">
              {clientAccounts.map((c) => (
                <ClientRow
                  key={c.id}
                  clientAccount={c}
                  isMine={c.createdBy === currentUser?.id}
                  onRelease={() => clearClientAccount(c.id)}
                />
              ))}
            </div>
          )
        )}

        {tab === 'log' && (
          logItems.length === 0 ? (
            <Empty>No activity yet.</Empty>
          ) : (
            <div className="space-y-1">
              {logItems.map((r) => (
                <LogRow key={r.id} request={r} />
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer — Dashboard + Quit */}
      <div className="titlebar-no-drag flex items-center gap-2 px-3 py-2.5 border-t border-divider">
        <button
          onClick={() => window.electronAPI?.openDashboard()}
          className="flex-1 h-9 rounded-lg bg-accent-blue text-white text-subheadline font-medium hover:bg-accent-blue/90 transition-colors"
        >
          Dashboard
        </button>
        <button
          onClick={() => window.electronAPI?.quitApp()}
          className="flex-1 h-9 rounded-lg bg-background-elevated text-text-primary text-subheadline font-medium border border-border hover:bg-background-tertiary transition-colors"
        >
          Quit
        </button>
      </div>
    </div>
  )
}

// ─── Subcomponents ───

function dotHex(color: 'green' | 'orange' | 'red' | 'gray' | 'blue'): string {
  switch (color) {
    case 'green': return '#34C759'
    case 'orange': return '#FF9F0A'
    case 'red': return '#FF453A'
    case 'blue': return '#0A84FF'
    default: return '#8E8E93'
  }
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 h-8 rounded-md text-subheadline font-medium transition-colors ${
        active ? 'bg-background-primary text-accent-blue shadow-sm' : 'text-text-secondary hover:text-text-primary'
      }`}
    >
      {label}
    </button>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-caption text-text-tertiary py-1.5 px-0.5">{children}</p>
}

function AccountRow({
  account, isMine, hasMyRequest, iAlreadyHaveOne, onClaim, onRelease, onRequest, onCancelRequest,
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

  let secondary: React.ReactNode = <span className="text-text-tertiary">Available</span>
  let secondaryClass = 'text-text-tertiary'
  if (isMine && account.occupiedSince) {
    secondary = formatDuration(account.occupiedSince)
    secondaryClass = 'text-accent-blue'
  } else if (!available && !isMine && account.occupiedByName) {
    secondary = (
      <>{account.occupiedByName}{account.occupiedSince ? ` · ${formatDuration(account.occupiedSince)}` : ''}</>
    )
  }

  return (
    <div className="flex items-center gap-2 px-2 h-[44px] rounded bg-background-elevated">
      <StatusDot color={dotColor} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-caption font-medium truncate leading-tight">
          {getAccountDisplayName(account.id, account.label)}
          {isMine && <span className="text-text-secondary font-normal"> (you)</span>}
        </p>
        <p className={`text-caption2 truncate leading-tight ${secondaryClass}`}>{secondary}</p>
      </div>
      <div className="shrink-0">
        {isMine ? (
          <RowButton onClick={onRelease} variant="secondary">Release</RowButton>
        ) : available ? (
          iAlreadyHaveOne ? (
            <span className="text-caption2 text-text-tertiary px-1">—</span>
          ) : (
            <RowButton onClick={onClaim} variant="primary">Start</RowButton>
          )
        ) : hasMyRequest ? (
          <RowButton onClick={onCancelRequest} variant="ghost">Cancel</RowButton>
        ) : (
          <RowButton onClick={onRequest} variant="secondary">Request</RowButton>
        )}
      </div>
    </div>
  )
}

function ClientRow({ clientAccount, isMine, onRelease }: { clientAccount: ClientAccount; isMine: boolean; onRelease: () => void }) {
  return (
    <div className="flex items-center gap-2 px-2 h-[44px] rounded bg-background-elevated">
      <StatusDot color={isMine ? 'blue' : 'orange'} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-caption font-medium truncate leading-tight">
          {clientAccount.clientName}
          {isMine && <span className="text-text-secondary font-normal"> (you)</span>}
        </p>
        <p className="text-caption2 text-text-tertiary truncate leading-tight">{clientAccount.createdByName}</p>
      </div>
      {isMine && (
        <div className="shrink-0">
          <RowButton onClick={onRelease} variant="secondary">Release</RowButton>
        </div>
      )}
    </div>
  )
}

function LogRow({ request }: { request: AccessRequest }) {
  const outcome =
    request.status === 'released' || request.status === 'approved' ? 'green'
    : request.status === 'rejected' ? 'red'
    : 'gray'
  const label =
    request.status === 'released' || request.status === 'approved' ? 'Handed over'
    : request.status === 'rejected' ? 'Declined'
    : request.status === 'cancelled' ? 'Cancelled'
    : request.status
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-background-elevated">
      <StatusDot color={outcome as 'green' | 'red' | 'gray'} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-caption font-medium truncate leading-tight">
          {getAccountDisplayName(request.accountId, request.accountLabel)}
          <span className="text-text-secondary font-normal"> · {request.requesterName} → {request.ownerName}</span>
        </p>
        <p className="text-caption2 text-text-tertiary truncate leading-tight">{timeAgo(request.requestedAt)}</p>
      </div>
      <span className="text-caption2 text-text-secondary shrink-0">{label}</span>
    </div>
  )
}

function PendingRow({ request, onAccept, onDecline }: { request: AccessRequest; onAccept: () => void; onDecline: () => void }) {
  return (
    <div className="px-2 py-1.5 rounded bg-accent-orange/10 border border-accent-orange/20 space-y-1">
      <p className="text-caption font-medium truncate leading-tight">
        {request.requesterName} wants {getAccountDisplayName(request.accountId, request.accountLabel)}
      </p>
      <p className={`text-caption2 truncate leading-tight ${request.requesterNote ? 'text-text-secondary' : 'text-text-tertiary italic'}`}>
        {request.requesterNote ? `"${request.requesterNote}"` : 'No note attached'}
      </p>
      <div className="flex gap-1.5 pt-0.5">
        <RowButton onClick={onAccept} variant="primary">Hand over</RowButton>
        <RowButton onClick={onDecline} variant="ghost">Decline</RowButton>
      </div>
    </div>
  )
}

function RowButton({ children, onClick, variant = 'secondary' }: { children: React.ReactNode; onClick: () => void; variant?: 'primary' | 'secondary' | 'ghost' }) {
  const styles =
    variant === 'primary'
      ? 'bg-accent-blue text-white hover:bg-accent-blue/90'
      : variant === 'ghost'
        ? 'text-text-secondary hover:text-text-primary hover:bg-background-elevated'
        : 'bg-background-tertiary text-text-primary hover:bg-background-elevated border border-border'
  return (
    <button onClick={onClick} className={`text-caption2 font-medium px-2.5 h-[26px] rounded-md transition-colors whitespace-nowrap ${styles}`}>
      {children}
    </button>
  )
}
