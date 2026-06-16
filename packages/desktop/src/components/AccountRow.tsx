import { useState, useEffect, useMemo } from 'react'
import { Card } from './ui/Card'
import { StatusDot } from './ui/StatusDot'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { useAppStore, useAuthStore, isAccountAvailable, formatDuration, getAccountDisplayName } from '@wam/shared'
import type { Account } from '@wam/shared'

interface AccountRowProps {
  account: Account
  isAdmin: boolean
}

export function AccountRow({ account, isAdmin }: AccountRowProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const accounts = useAppStore((s) => s.accounts)
  const accessRequests = useAppStore((s) => s.accessRequests)
  const claimAccount = useAppStore((s) => s.claimAccount)
  const releaseAccount = useAppStore((s) => s.releaseAccount)
  const requestAccess = useAppStore((s) => s.requestAccess)
  const cancelRequest = useAppStore((s) => s.cancelRequest)
  const deleteAccountSlot = useAppStore((s) => s.deleteAccountSlot)
  const forceReleaseAccount = useAppStore((s) => s.forceReleaseAccount)
  const updateAccountLabel = useAppStore((s) => s.updateAccountLabel)
  const myAccount = useMemo(
    () => accounts.find((a) => a.occupiedBy === currentUser?.id),
    [accounts, currentUser?.id]
  )

  const isMyAccount = currentUser?.id === account.occupiedBy
  const available = isAccountAvailable(account)
  const hasActiveRequest = accessRequests.some(
    (r) =>
      r.accountId === account.id &&
      r.requesterId === currentUser?.id &&
      r.status === 'pending'
  )

  // Request note dialog
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [requestNote, setRequestNote] = useState('')

  // Admin rename dialog
  const [showRenameDialog, setShowRenameDialog] = useState(false)
  const [renameValue, setRenameValue] = useState(account.label ?? '')

  const handleRename = async () => {
    const next = renameValue.trim()
    if (!next || next === (account.label ?? '')) {
      setShowRenameDialog(false)
      return
    }
    try {
      await updateAccountLabel(account.id, next)
      setShowRenameDialog(false)
    } catch (err) {
      console.error('[AccountRow] rename failed:', err)
      window.alert(`Couldn't rename: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleForceRelease = async () => {
    if (!account.isOccupied) return
    const name = getAccountDisplayName(account.id, account.label)
    if (!window.confirm(`Force release "${name}"? This will end ${account.occupiedByName ?? "the current user's"} session.`)) return
    try {
      await forceReleaseAccount(account.id)
    } catch (err) {
      console.error('[AccountRow] force release failed:', err)
      window.alert(`Couldn't release: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  const handleSubmitRequest = () => {
    if (currentUser) {
      requestAccess(account, currentUser, requestNote)
      setRequestNote('')
      setShowRequestDialog(false)
    }
  }

  // Duration timer — refreshes every 60s
  const [, setTick] = useState(0)
  useEffect(() => {
    if (account.isOccupied && account.occupiedSince) {
      const timer = setInterval(() => setTick((t) => t + 1), 60000)
      return () => clearInterval(timer)
    }
  }, [account.isOccupied, account.occupiedSince])

  const statusColor = available ? 'green' : hasActiveRequest ? 'yellow' : 'red'

  return (
    <Card className="flex items-center gap-3">
      <StatusDot color={statusColor} size="lg" />

      <div className="flex-1 min-w-0">
        <p className="text-subheadline font-medium truncate">
          {getAccountDisplayName(account.id, account.label)}
        </p>
        {account.isOccupied && account.occupiedByName ? (
          <>
            <p className="text-caption text-text-secondary">
              Used by {account.occupiedByName}
            </p>
            {account.occupiedSince && (
              <p className="text-caption2 text-accent-blue">
                {formatDuration(account.occupiedSince)}
              </p>
            )}
          </>
        ) : (
          <p className="text-caption text-accent-green">
            {account.lastReleasedAt ? `Free for ${formatDuration(account.lastReleasedAt)}` : 'Available'}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isMyAccount && (
          <Button size="sm" onClick={() => releaseAccount(account.id)}>
            Release
          </Button>
        )}

        {!isMyAccount && available && !myAccount && currentUser && (
          <Button
            size="sm"
            variant="primary"
            onClick={() => claimAccount(account, currentUser)}
          >
            Claim
          </Button>
        )}

        {!isMyAccount && !available && !myAccount && currentUser && !hasActiveRequest && (
          <Button
            size="sm"
            onClick={() => setShowRequestDialog(true)}
          >
            Request
          </Button>
        )}

        {/* Show Cancel only when the account is still occupied — if available, just show Claim */}
        {hasActiveRequest && !available && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              const req = accessRequests.find(
                (r) => r.accountId === account.id && r.requesterId === currentUser?.id && r.status === 'pending'
              )
              if (req) cancelRequest(req.id)
            }}
          >
            Cancel
          </Button>
        )}

        {isAdmin && (
          <>
            <button
              onClick={() => {
                setRenameValue(account.label ?? '')
                setShowRenameDialog(true)
              }}
              className="p-1 text-text-secondary hover:text-text-primary hover:bg-background-elevated rounded transition-colors"
              title="Rename this account slot (admin only)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
            </button>
            {account.isOccupied && (
              <button
                onClick={handleForceRelease}
                className="p-1 text-accent-orange hover:bg-accent-orange/10 rounded transition-colors"
                title={`Force release ${account.occupiedByName ?? 'occupier'} (admin only)`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H7"/>
                </svg>
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm(`Delete account slot "${getAccountDisplayName(account.id, account.label)}"? This cannot be undone.`)) {
                  deleteAccountSlot(account.id)
                }
              }}
              className="p-1 text-accent-red hover:bg-accent-red/10 rounded transition-colors"
              title="Delete this account slot (admin only)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </button>
          </>
        )}

        <Modal open={showRequestDialog} onClose={() => { setShowRequestDialog(false); setRequestNote('') }}>
          <h3 className="text-headline mb-1">Request access</h3>
          <p className="text-caption text-text-secondary mb-3">
            {getAccountDisplayName(account.id, account.label)} is being used by {account.occupiedByName}.
          </p>
          <Input
            label="Add a note (optional)"
            placeholder="e.g., Need to push client changes"
            value={requestNote}
            onChange={(e) => setRequestNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmitRequest()}
            autoFocus
          />
          <div className="flex justify-between mt-4">
            <Button onClick={() => { setShowRequestDialog(false); setRequestNote('') }}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitRequest}>
              Send Request
            </Button>
          </div>
        </Modal>

        <Modal open={showRenameDialog} onClose={() => setShowRenameDialog(false)}>
          <h3 className="text-headline mb-1">Rename account</h3>
          <p className="text-caption text-text-secondary mb-3">
            Cosmetic only — doesn't reset the current claim or pending requests.
          </p>
          <Input
            label="Label"
            placeholder="e.g., Acme Client"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
          <div className="flex justify-between mt-4">
            <Button onClick={() => setShowRenameDialog(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleRename}>Save</Button>
          </div>
        </Modal>
      </div>
    </Card>
  )
}
