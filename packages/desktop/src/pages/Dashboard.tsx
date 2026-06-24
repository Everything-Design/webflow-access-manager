import { useState, useMemo, useEffect } from 'react'
import { useAppStore, useAuthStore, useAdminStore } from '@wam/shared'
import { AccountRow } from '../components/AccountRow'
import { ClientAccountRow } from '../components/ClientAccountRow'
import { AccessRequestRow } from '../components/AccessRequestRow'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Modal } from '../components/ui/Modal'
import { StatusDot } from '../components/ui/StatusDot'
import { Settings } from './Settings'

type Tab = 'internal' | 'client' | 'activity'

// Compact, locale-aware timestamp for the activity log (e.g. "Jun 18, 3:42 PM").
function formatActivityTime(secs: number): string {
  return new Date(secs * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function Dashboard() {
  const accounts = useAppStore((s) => s.accounts)
  const clientAccounts = useAppStore((s) => s.clientAccounts)
  const pendingRequestsForCurrentUser = useAppStore((s) => s.pendingRequestsForCurrentUser)
  const allAccessRequests = useAppStore((s) => s.allAccessRequests)
  const isConnected = useAppStore((s) => s.isConnected)
  const currentUser = useAuthStore((s) => s.currentUser)
  const myClientAccount = useMemo(
    () => clientAccounts.find((a) => a.createdBy === currentUser?.id),
    [clientAccounts, currentUser?.id]
  )

  const [activeTab, setActiveTab] = useState<Tab>('internal')
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [clientName, setClientName] = useState('')
  const [newSlotLabel, setNewSlotLabel] = useState('')

  const adminUid = useAdminStore((s) => s.adminUid)
  const isAdmin = currentUser?.id === adminUid

  // Popup's gear button asks us to jump straight to Settings.
  useEffect(() => {
    return window.electronAPI?.onShowSettings(() => setShowSettings(true))
  }, [])

  // Activity log = all resolved requests (uncapped), newest first. Members see only
  // their own history; admin sees the full team timeline. .filter() returns fresh
  // arrays, so sorting here never mutates the store's array.
  const activityLog = useMemo(() => {
    if (!currentUser) return []
    return allAccessRequests
      .filter((r) => r.status !== 'pending')
      .filter((r) => isAdmin || r.requesterId === currentUser.id || r.ownerId === currentUser.id)
      .sort((a, b) => b.requestedAt - a.requestedAt)
  }, [allAccessRequests, currentUser, isAdmin])

  const handleAddClient = async () => {
    if (!clientName.trim() || !currentUser) return
    await useAppStore.getState().setClientAccount(clientName.trim(), currentUser)
    setClientName('')
    setShowClientDialog(false)
  }

  const handleCreateSlot = async () => {
    if (!newSlotLabel.trim()) return
    const accountId = `account-${Date.now()}`
    const label = newSlotLabel.trim()
    try {
      await useAppStore.getState().createAccountSlot(accountId, label)
      setNewSlotLabel('')
      setShowAddSlotDialog(false)
    } catch (err) {
      console.error('[Dashboard] Failed to create account slot:', err)
      alert(`Failed to create account: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  if (showSettings) {
    return <Settings onBack={() => setShowSettings(false)} />
  }

  return (
    <div className="flex flex-col h-screen bg-background-primary">
      {/* macOS title bar drag region */}
      <div className="h-8 titlebar-drag shrink-0" />

      {/* Header — fixed */}
      <div className="shrink-0 px-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            {currentUser && (
              <>
                <h1 className="text-title2">Hello, {currentUser.name}</h1>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusDot color={isConnected ? 'green' : 'red'} size="md" />
                  <span className="text-caption text-text-secondary">
                    {isConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-text-secondary hover:text-text-primary rounded-md hover:bg-background-elevated transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
        </div>

        {/* Pending Requests Banner */}
        {pendingRequestsForCurrentUser.length > 0 && (
          <div className="mt-3 space-y-2">
            {pendingRequestsForCurrentUser.map((request) => (
              <AccessRequestRow key={request.id} request={request} />
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex mt-3 border-b border-divider">
          <button
            onClick={() => setActiveTab('internal')}
            className={`flex-1 pb-2 text-subheadline font-medium text-center border-b-2 transition-colors ${
              activeTab === 'internal'
                ? 'border-accent-blue text-accent-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Internal ({accounts.length})
          </button>
          <button
            onClick={() => setActiveTab('client')}
            className={`flex-1 pb-2 text-subheadline font-medium text-center border-b-2 transition-colors ${
              activeTab === 'client'
                ? 'border-accent-blue text-accent-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Client ({clientAccounts.length})
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex-1 pb-2 text-subheadline font-medium text-center border-b-2 transition-colors ${
              activeTab === 'activity'
                ? 'border-accent-blue text-accent-blue'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Activity
          </button>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        {activeTab === 'internal' && (
          <section>
            {isAdmin && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowAddSlotDialog(true)}
                  className="text-caption text-accent-blue hover:underline"
                >
                  + Add Slot
                </button>
              </div>
            )}

            {accounts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-text-secondary">
                <span className="text-3xl">🔑</span>
                <p className="text-subheadline font-medium text-text-primary">No accounts yet</p>
                <p className="text-caption text-center max-w-[260px]">
                  {isAdmin
                    ? 'Add an internal account slot to get started.'
                    : 'Ask an admin to add accounts to this workspace.'}
                </p>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddSlotDialog(true)}
                    className="mt-2 text-caption text-accent-blue hover:underline"
                  >
                    + Add Account Slot
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <AccountRow key={account.id} account={account} isAdmin={isAdmin} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'client' && (
          <section>
            {!myClientAccount && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setShowClientDialog(true)}
                  className="text-caption text-accent-blue hover:underline"
                >
                  + Add
                </button>
              </div>
            )}

            {clientAccounts.length === 0 ? (
              <p className="text-subheadline text-text-secondary text-center p-4">
                No one is using client accounts
              </p>
            ) : (
              <div className="space-y-2">
                {clientAccounts.map((ca) => (
                  <ClientAccountRow key={ca.id} clientAccount={ca} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'activity' && (
          <section>
            {activityLog.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-6 text-text-secondary">
                <span className="text-3xl">🕓</span>
                <p className="text-subheadline font-medium text-text-primary">No activity yet</p>
                <p className="text-caption text-center max-w-[260px]">
                  {isAdmin
                    ? 'Account hand-offs and access requests across the team will appear here.'
                    : 'Your account hand-offs and access requests will appear here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {activityLog.map((req) => {
                  const accountName = req.accountLabel ?? req.accountId
                  const outcome =
                    req.status === 'released' || req.status === 'approved' ? 'green'
                    : req.status === 'rejected' ? 'red'
                    : 'gray'
                  const label =
                    req.status === 'released' || req.status === 'approved' ? 'Handed over'
                    : req.status === 'rejected' ? 'Declined'
                    : req.status === 'cancelled' ? 'Cancelled'
                    : req.status
                  return (
                    <div key={req.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-background-elevated">
                      <StatusDot color={outcome as 'green' | 'red' | 'gray'} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-caption font-medium truncate">
                          {accountName}{' '}
                          <span className="text-text-secondary font-normal">
                            · {req.requesterName} → {req.ownerName}
                          </span>
                        </p>
                        <p className="text-caption2 text-text-tertiary">{formatActivityTime(req.requestedAt)}</p>
                        {req.responseNote && (
                          <p className="text-caption2 text-text-tertiary truncate">"{req.responseNote}"</p>
                        )}
                      </div>
                      <span className="text-caption2 text-text-secondary shrink-0">{label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Client Account Dialog */}
      <Modal open={showClientDialog} onClose={() => setShowClientDialog(false)}>
        <h3 className="text-headline mb-4">Add Client Account</h3>
        <Input
          placeholder="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAddClient()}
          autoFocus
        />
        <div className="flex justify-between mt-4">
          <Button onClick={() => { setShowClientDialog(false); setClientName('') }}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!clientName.trim()} onClick={handleAddClient}>
            Add
          </Button>
        </div>
      </Modal>

      {/* Add Account Slot Dialog (Admin) */}
      <Modal open={showAddSlotDialog} onClose={() => setShowAddSlotDialog(false)}>
        <h3 className="text-headline mb-4">Add Internal Account Slot</h3>
        <div className="space-y-3">
          <Input
            label="Account Name"
            placeholder="e.g., Marketing, Design, Dev..."
            value={newSlotLabel}
            onChange={(e) => setNewSlotLabel(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex justify-between mt-4">
          <Button onClick={() => { setShowAddSlotDialog(false); setNewSlotLabel('') }}>
            Cancel
          </Button>
          <Button variant="primary" disabled={!newSlotLabel.trim()} onClick={handleCreateSlot}>
            Create
          </Button>
        </div>
      </Modal>
    </div>
  )
}
