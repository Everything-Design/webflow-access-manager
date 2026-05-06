import { useEffect, useMemo, useState } from 'react'
import { StatusDot } from '../components/ui/StatusDot'
import { Button } from '../components/ui/Button'
import { useAppStore, useAuthStore, isAccountAvailable, formatDuration, getAccountDisplayName } from '@wam/shared'
import { WorkspaceSwitcher } from '../components/WorkspaceSwitcher'

export function TrayPopup() {
  const accounts = useAppStore((s) => s.accounts)
  const clientAccounts = useAppStore((s) => s.clientAccounts)
  const pendingRequestsForCurrentUser = useAppStore((s) => s.pendingRequestsForCurrentUser)
  const isConnected = useAppStore((s) => s.isConnected)
  const currentUser = useAuthStore((s) => s.currentUser)

  const availableAccounts = useMemo(() => accounts.filter(isAccountAvailable), [accounts])
  const myAccount = useMemo(
    () => accounts.find((a) => a.occupiedBy === currentUser?.id),
    [accounts, currentUser?.id]
  )

  // Timer refresh every 60s
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const statusIcon = pendingRequestsForCurrentUser.length > 0
    ? 'orange'
    : availableAccounts.length === 0
      ? 'red'
      : 'green'

  return (
    <div className="flex flex-col h-full bg-background-primary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 titlebar-drag">
        <div className="titlebar-no-drag">
          {currentUser && (
            <div className="flex flex-col gap-0.5">
              <span className="text-headline">{currentUser.name}</span>
              <div className="flex items-center gap-1.5">
                <StatusDot color={isConnected ? 'green' : 'red'} size="sm" />
                <WorkspaceSwitcher />
              </div>
            </div>
          )}
        </div>
        <StatusDot color={statusIcon} size="lg" />
      </div>

      <hr className="border-divider" />

      {/* Accounts Overview */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <div>
          <p className="text-caption text-text-secondary mb-2">Internal Accounts</p>
          <div className="grid grid-cols-2 gap-2">
            {accounts.slice(0, 6).map((account) => (
              <div
                key={account.id}
                className="p-1.5 bg-background-elevated rounded"
              >
                <div className="flex items-center gap-1.5">
                  <StatusDot
                    color={isAccountAvailable(account) ? 'green' : 'red'}
                    size="md"
                  />
                  <span className="text-caption font-medium truncate">
                    {getAccountDisplayName(account.id, account.label)}
                  </span>
                </div>
                {account.isOccupied && account.occupiedSince && (
                  <p className="text-caption2 text-accent-blue mt-0.5 ml-3.5">
                    {formatDuration(account.occupiedSince)}
                  </p>
                )}
              </div>
            ))}
          </div>
          {myAccount ? (
            <p className="text-caption2 text-accent-blue mt-2">
              You're using {getAccountDisplayName(myAccount.id, myAccount.label)}
            </p>
          ) : (
            <p className="text-caption2 text-accent-green mt-2">
              {availableAccounts.length} available
            </p>
          )}
        </div>

        {/* Client Accounts */}
        {clientAccounts.length > 0 && (
          <>
            <hr className="border-divider" />
            <div>
              <p className="text-caption text-text-secondary mb-2">Client Accounts</p>
              <div className="space-y-1">
                {clientAccounts.slice(0, 3).map((ca) => (
                  <div key={ca.id} className="flex items-center gap-1.5">
                    <StatusDot color="purple" size="sm" />
                    <span className="text-caption">{ca.clientName}</span>
                    <span className="flex-1" />
                    <span className="text-caption2 text-text-secondary">
                      {ca.createdByName}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Pending Requests */}
        {pendingRequestsForCurrentUser.length > 0 && (
          <>
            <hr className="border-divider" />
            <div className="flex items-center gap-2 p-2 bg-accent-orange/10 rounded-md">
              <span className="text-accent-orange">!</span>
              <span className="text-caption font-medium">
                {pendingRequestsForCurrentUser.length} pending request(s)
              </span>
            </div>
          </>
        )}
      </div>

      <hr className="border-divider" />

      {/* Actions */}
      <div className="p-4 space-y-2 titlebar-no-drag">
        <Button
          fullWidth
          onClick={() => window.electronAPI?.openDashboard()}
        >
          Open Dashboard
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => window.electronAPI?.quitApp()}
        >
          Quit
        </Button>
      </div>
    </div>
  )
}
