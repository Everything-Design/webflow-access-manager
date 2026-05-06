import { useState, useEffect } from 'react'
import { useAuthStore, useAppStore, useWorkspaceStore } from '@wam/shared'
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
  const { isConnected, accounts, clientAccounts, users } = useAppStore()
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace)
  const myRole = useWorkspaceStore((s) => s.myRole)
  const members = useWorkspaceStore((s) => s.members)
  const memberCount = members.length

  // Cross-reference workspace members with global users to get online status
  const onlineMemberCount = members.filter((m) =>
    users.some((u) => u.id === m.userId && u.isOnline)
  ).length

  const occupiedAccounts = accounts.filter((a) => a.isOccupied).length
  const availableAccounts = accounts.length - occupiedAccounts

  const [copied, setCopied] = useState(false)

  const copyWorkspaceId = async () => {
    if (!currentWorkspace) return
    await navigator.clipboard.writeText(currentWorkspace.id)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const [userName, setUserName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('user')
  const [selectedColor, setSelectedColor] = useState('0066CC')

  useEffect(() => {
    if (currentUser) {
      setUserName(currentUser.name)
      setSelectedIcon(currentUser.profileIcon ?? 'user')
      setSelectedColor(currentUser.profileColor ?? '0066CC')
    }
  }, [currentUser])

  const handleSave = async () => {
    await updateUser({
      name: userName.trim(),
      profileIcon: selectedIcon,
      profileColor: selectedColor,
    })
    onBack()
  }

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex flex-col h-screen bg-background-primary">
      {/* macOS title bar drag region */}
      <div className="h-8 titlebar-drag shrink-0" />

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        <div className="space-y-5">
          {/* Header with back button */}
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-1 text-text-secondary hover:text-text-primary rounded transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h1 className="text-title2">Settings</h1>
          </div>

          <hr className="border-divider" />

          {/* Profile */}
          <section>
            <h2 className="text-headline mb-4">Profile</h2>

            {/* Preview */}
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: `#${selectedColor}20` }}
              >
                {AVAILABLE_ICONS.find((i) => i.id === selectedIcon)?.emoji ?? '👤'}
              </div>
              <div className="flex-1">
                <Input
                  label="Name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
                {currentUser && (
                  <p className="text-caption text-text-secondary mt-1">
                    {currentUser.deviceId}
                  </p>
                )}
              </div>
            </div>

            {/* Icon Selection */}
            <div className="mb-4">
              <p className="text-subheadline font-medium mb-2">Profile Icon</p>
              <div className="grid grid-cols-6 gap-2">
                {AVAILABLE_ICONS.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => setSelectedIcon(icon.id)}
                    className={`w-10 h-10 flex items-center justify-center rounded-md text-lg transition-colors
                      ${selectedIcon === icon.id
                        ? 'ring-2 ring-accent-blue bg-accent-blue/10'
                        : 'hover:bg-background-elevated border border-border'
                      }`}
                  >
                    {icon.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <p className="text-subheadline font-medium mb-2">Profile Color</p>
              <div className="grid grid-cols-5 gap-3">
                {AVAILABLE_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setSelectedColor(color.hex)}
                    className="flex flex-col items-center gap-1"
                  >
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

          {/* Workspace */}
          {currentWorkspace && (
            <>
              <section>
                <h2 className="text-headline mb-3">Workspace</h2>
                <div className="bg-background-elevated rounded-md p-3 space-y-3">
                  <div>
                    <p className="text-caption text-text-secondary">Name</p>
                    <p className="text-subheadline font-medium">{currentWorkspace.name}</p>
                  </div>

                  <div>
                    <p className="text-caption text-text-secondary mb-1">Workspace ID (share to invite)</p>
                    <button
                      onClick={copyWorkspaceId}
                      className="font-mono text-headline text-accent-blue tracking-wider hover:opacity-70 transition-opacity"
                      title="Click to copy"
                    >
                      {currentWorkspace.id} {copied && <span className="text-caption text-accent-green ml-2">Copied!</span>}
                    </button>
                  </div>

                  <div>
                    <p className="text-caption text-text-secondary">Your role</p>
                    <p className="text-subheadline capitalize">{myRole ?? 'member'}</p>
                  </div>
                </div>
              </section>

              {/* Workspace Overview */}
              <section>
                <h2 className="text-headline mb-3">Overview</h2>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-background-elevated rounded-md p-3">
                    <p className="text-caption2 text-text-secondary uppercase tracking-wide">Members</p>
                    <p className="text-title2 mt-0.5">{memberCount}</p>
                    <p className="text-caption text-accent-green mt-0.5">{onlineMemberCount} online</p>
                  </div>
                  <div className="bg-background-elevated rounded-md p-3">
                    <p className="text-caption2 text-text-secondary uppercase tracking-wide">Internal Accounts</p>
                    <p className="text-title2 mt-0.5">{accounts.length}</p>
                    <p className="text-caption text-text-secondary mt-0.5">
                      <span className="text-accent-green">{availableAccounts} available</span>
                      <span className="mx-1">·</span>
                      <span className="text-accent-red">{occupiedAccounts} in use</span>
                    </p>
                  </div>
                  <div className="bg-background-elevated rounded-md p-3 col-span-2">
                    <p className="text-caption2 text-text-secondary uppercase tracking-wide">Client Accounts</p>
                    <p className="text-title2 mt-0.5">{clientAccounts.length}</p>
                  </div>
                </div>
              </section>

              <hr className="border-divider" />
            </>
          )}

          {/* Connection Status */}
          <section>
            <h2 className="text-headline mb-3">Connection</h2>
            <div className="flex items-center gap-2">
              <StatusDot color={isConnected ? 'green' : 'red'} size="md" />
              <span className="text-subheadline">
                {isConnected ? 'Connected to Firebase' : 'Disconnected'}
              </span>
            </div>
          </section>

          <div className="flex-1" />

          {/* Actions */}
          <div className="space-y-2 pt-4">
            <Button
              variant="primary"
              fullWidth
              disabled={!userName.trim()}
              onClick={handleSave}
            >
              Save Changes
            </Button>
            <Button variant="secondary" fullWidth onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
