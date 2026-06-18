import { useState, useEffect } from 'react'
import { useAuthStore, useAppStore, useAdminStore } from '@wam/shared'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { StatusDot } from '../components/ui/StatusDot'

const AVAILABLE_ICONS = [
  { id: 'user', label: 'Person', emoji: '👤' },
  { id: 'star', label: 'Star', emoji: '⭐' },
  { id: 'heart', label: 'Heart', emoji: '❤️' },
  { id: 'bolt', label: 'Bolt', emoji: '⚡' },
  { id: 'flame', label: 'Flame', emoji: '🔥' },
  { id: 'moon', label: 'Moon', emoji: '🌙' },
  { id: 'sun', label: 'Sun', emoji: '☀️' },
  { id: 'cloud', label: 'Cloud', emoji: '☁️' },
  { id: 'leaf', label: 'Leaf', emoji: '🍃' },
  { id: 'sparkles', label: 'Sparkles', emoji: '✨' },
  { id: 'crown', label: 'Crown', emoji: '👑' },
  { id: 'rocket', label: 'Rocket', emoji: '🚀' },
]

const AVAILABLE_COLORS = [
  { name: 'Blue', hex: '0066CC' },
  { name: 'Purple', hex: '7C3AED' },
  { name: 'Pink', hex: 'EC4899' },
  { name: 'Red', hex: 'EF4444' },
  { name: 'Orange', hex: 'F97316' },
  { name: 'Yellow', hex: 'EAB308' },
  { name: 'Green', hex: '10B981' },
  { name: 'Teal', hex: '14B8A6' },
  { name: 'Indigo', hex: '6366F1' },
  { name: 'Gray', hex: '6B7280' },
]

interface SettingsProps {
  onBack: () => void
}

export function Settings({ onBack }: SettingsProps) {
  const { currentUser, updateUser, signOut } = useAuthStore()
  const { isConnected, accounts, clientAccounts, team, pendingTeamMembers, approveTeamMember, rejectTeamMember, removeTeamMember } =
    useAppStore()
  const adminUid = useAdminStore((s) => s.adminUid)
  const transferAdmin = useAdminStore((s) => s.transfer)
  const isAdmin = currentUser?.id === adminUid

  const handleTransferAdmin = (uid: string, name: string) => {
    if (!confirm(`Transfer admin to ${name}? You will become a regular member after this. The change takes effect immediately on every device.`)) return
    transferAdmin(uid).catch((err) => {
      alert(`Couldn't transfer: ${err instanceof Error ? err.message : 'Unknown error'}`)
    })
  }

  const onlineCount = team.filter((m) => m.status === 'approved' && m.isOnline).length
  const approvedCount = team.filter((m) => m.status === 'approved').length
  const occupiedAccounts = accounts.filter((a) => a.isOccupied).length
  const availableAccounts = accounts.length - occupiedAccounts

  const [userName, setUserName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('user')
  const [selectedColor, setSelectedColor] = useState('0066CC')
  const [appVersion, setAppVersion] = useState('')
  const [checkingUpdate, setCheckingUpdate] = useState(false)

  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.name)
      setSelectedIcon(currentUser.profileIcon ?? 'user')
      setSelectedColor(currentUser.profileColor ?? '0066CC')
    }
  }, [currentUser])

  useEffect(() => {
    window.electronAPI?.getAppVersion().then(setAppVersion).catch(() => {})
  }, [])

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true)
    try {
      await window.electronAPI?.checkForUpdates()
    } catch (err) {
      console.error('[Settings] Update check failed:', err)
    } finally {
      setCheckingUpdate(false)
    }
  }

  const handleSave = async () => {
    await updateUser({
      name: userName.trim(),
      profileIcon: selectedIcon,
      profileColor: selectedColor,
    })
    onBack()
  }

  return (
    <div className="flex flex-col h-screen bg-background-primary">
      <div className="h-8 titlebar-drag shrink-0" />

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 text-text-secondary hover:text-text-primary rounded transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <h1 className="text-title2">Settings</h1>
          </div>

          <hr className="border-divider" />

          {/* Profile */}
          <section>
            <h2 className="text-headline mb-4">Profile</h2>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: `#${selectedColor}20` }}
              >
                {AVAILABLE_ICONS.find((i) => i.id === selectedIcon)?.emoji ?? '👤'}
              </div>
              <div className="flex-1">
                <Input label="Name" value={userName} onChange={(e) => setUserName(e.target.value)} />
                {currentUser && <p className="text-caption text-text-secondary mt-1">{currentUser.email}</p>}
              </div>
            </div>

            <div className="mb-4">
              <p className="text-subheadline font-medium mb-2">Profile Icon</p>
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => setSelectedIcon(icon.id)}
                    className={`w-10 h-10 flex items-center justify-center rounded-md text-lg transition-colors
                      ${
                        selectedIcon === icon.id
                          ? 'ring-2 ring-accent-blue bg-accent-blue/10'
                          : 'hover:bg-background-elevated border border-border'
                      }`}
                  >
                    {icon.emoji}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-subheadline font-medium mb-2">Profile Color</p>
              <div className="grid grid-cols-5 gap-3">
                {AVAILABLE_COLORS.map((color) => (
                  <button key={color.hex} onClick={() => setSelectedColor(color.hex)} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-8 h-8 rounded-full transition-all ${
                        selectedColor === color.hex ? 'ring-2 ring-offset-2 ring-text-primary' : ''
                      }`}
                      style={{ backgroundColor: `#${color.hex}` }}
                    />
                    <span className="text-caption2 text-text-secondary">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <hr className="border-divider" />

          {/* Pending team members — admin only */}
          {isAdmin && pendingTeamMembers.length > 0 && (
            <section>
              <h2 className="text-headline mb-3">Pending approvals ({pendingTeamMembers.length})</h2>
              <div className="space-y-2">
                {pendingTeamMembers.map((m) => (
                  <div key={m.id} className="bg-background-elevated rounded-md p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-subheadline font-medium truncate">{m.name || m.email}</p>
                      <p className="text-caption text-text-secondary truncate">{m.email}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm" onClick={() => approveTeamMember(m.id)}>
                        Approve
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => rejectTeamMember(m.id)}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <hr className="border-divider mt-5" />
            </section>
          )}

          {/* Team list */}
          <section>
            <h2 className="text-headline mb-3">Team ({approvedCount})</h2>
            <div className="bg-background-elevated rounded-md p-1">
              {team
                .filter((m) => m.status === 'approved')
                .map((m) => (
                  <div key={m.id} className="px-3 py-2 flex items-center gap-3">
                    <StatusDot color={m.isOnline ? 'green' : 'gray'} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-subheadline truncate">
                        {m.name}
                        {m.id === adminUid && (
                          <span className="ml-2 text-caption2 text-accent-blue">admin</span>
                        )}
                        {m.id === currentUser?.id && (
                          <span className="ml-2 text-caption2 text-text-secondary">you</span>
                        )}
                      </p>
                      <p className="text-caption text-text-tertiary truncate">{m.email}</p>
                    </div>
                    {isAdmin && m.id !== currentUser?.id && (
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          onClick={() => handleTransferAdmin(m.id, m.name)}
                          className="text-caption2 text-accent-blue hover:underline"
                          title="Hand the admin role to this member"
                        >
                          Make admin
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${m.name} from the team?`)) removeTeamMember(m.id)
                          }}
                          className="text-caption2 text-accent-red hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </section>

          <hr className="border-divider" />

          {/* Overview */}
          <section>
            <h2 className="text-headline mb-3">Overview</h2>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-background-elevated rounded-md p-3">
                <p className="text-caption2 text-text-secondary uppercase tracking-wide">Team</p>
                <p className="text-title2 mt-0.5">{approvedCount}</p>
                <p className="text-caption text-accent-green mt-0.5">{onlineCount} online</p>
              </div>
              <div className="bg-background-elevated rounded-md p-3">
                <p className="text-caption2 text-text-secondary uppercase tracking-wide">Internal accounts</p>
                <p className="text-title2 mt-0.5">{accounts.length}</p>
                <p className="text-caption text-text-secondary mt-0.5">
                  <span className="text-accent-green">{availableAccounts} available</span>
                  <span className="mx-1">·</span>
                  <span className="text-accent-red">{occupiedAccounts} in use</span>
                </p>
              </div>
              <div className="bg-background-elevated rounded-md p-3 col-span-2">
                <p className="text-caption2 text-text-secondary uppercase tracking-wide">Client accounts</p>
                <p className="text-title2 mt-0.5">{clientAccounts.length}</p>
              </div>
            </div>
          </section>

          <hr className="border-divider" />

          <section>
            <h2 className="text-headline mb-3">Connection</h2>
            <div className="flex items-center gap-2">
              <StatusDot color={isConnected ? 'green' : 'red'} size="md" />
              <span className="text-subheadline">{isConnected ? 'Connected to Firebase' : 'Disconnected'}</span>
            </div>
          </section>

          <hr className="border-divider" />

          {/* About / Updates */}
          <section>
            <h2 className="text-headline mb-3">About</h2>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-subheadline">Webflow Access Manager</p>
                <p className="text-caption text-text-secondary">Version {appVersion || '—'}</p>
              </div>
              <Button variant="secondary" size="sm" disabled={checkingUpdate} onClick={handleCheckUpdates}>
                {checkingUpdate ? 'Checking…' : 'Check for Updates'}
              </Button>
            </div>
          </section>

          <div className="flex-1" />

          <div className="space-y-2 pt-4">
            <Button variant="primary" fullWidth disabled={!userName.trim()} onClick={handleSave}>
              Save Changes
            </Button>
            <Button variant="secondary" fullWidth onClick={() => signOut()}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
