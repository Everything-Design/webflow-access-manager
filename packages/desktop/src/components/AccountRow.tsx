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
          <p className="text-caption text-accent-green">Available</p>
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
      </div>
    </Card>
  )
}
