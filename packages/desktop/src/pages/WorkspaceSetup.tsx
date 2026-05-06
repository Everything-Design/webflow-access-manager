import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useAuthStore, useWorkspaceStore, migrateExistingDataToWorkspace } from '@wam/shared'

type Mode = 'choose' | 'create' | 'join'

export function WorkspaceSetup() {
  const [mode, setMode] = useState<Mode>('choose')
  const [name, setName] = useState('')
  const [wsId, setWsId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [migrateData, setMigrateData] = useState(true)

  const currentUser = useAuthStore((s) => s.currentUser)
  const createWorkspace = useWorkspaceStore((s) => s.createWorkspace)
  const joinWorkspace = useWorkspaceStore((s) => s.joinWorkspace)

  const handleCreate = async () => {
    if (!currentUser || !name.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      const newWsId = await createWorkspace(name.trim(), currentUser)
      // Migrate existing data if checked
      if (migrateData) {
        const result = await migrateExistingDataToWorkspace(newWsId)
        console.log('[WorkspaceSetup] Migrated:', result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workspace')
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!currentUser || !wsId.trim()) return
    setIsLoading(true)
    setError(null)
    try {
      await joinWorkspace(wsId.trim().toUpperCase(), currentUser)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join workspace')
      setIsLoading(false)
    }
  }

  if (mode === 'choose') {
    return (
      <div className="flex flex-col items-center justify-center h-full px-10 py-10 bg-background-primary gap-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">🏢</span>
          <h1 className="text-title2 text-center">Set Up Your Workspace</h1>
          <p className="text-subheadline text-text-secondary text-center max-w-[280px]">
            Create a workspace for your agency or join an existing one
          </p>
        </div>

        <div className="w-full space-y-3">
          <Button variant="primary" size="lg" fullWidth onClick={() => setMode('create')}>
            Create Workspace
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={() => setMode('join')}>
            Join Workspace
          </Button>
        </div>
      </div>
    )
  }

  if (mode === 'create') {
    return (
      <div className="flex flex-col items-center justify-between h-full px-10 py-10 bg-background-primary">
        <div className="flex flex-col items-center gap-2 pt-4">
          <span className="text-4xl">🏢</span>
          <h1 className="text-title2 text-center">Create Workspace</h1>
          <p className="text-subheadline text-text-secondary text-center">
            Your team will use this workspace ID to join
          </p>
        </div>

        <div className="w-full space-y-3">
          <Input
            label="Agency / Team Name"
            placeholder="e.g., Everythingflow Studio"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />

          <label className="flex items-center gap-2 text-caption text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={migrateData}
              onChange={(e) => setMigrateData(e.target.checked)}
              className="rounded"
            />
            Migrate existing account data into this workspace
          </label>

          {error && <p className="text-caption text-accent-red">{error}</p>}

          <Button
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={!name.trim()}
            onClick={handleCreate}
          >
            Create Workspace
          </Button>
        </div>

        <button
          onClick={() => { setMode('choose'); setError(null) }}
          className="text-caption text-accent-blue hover:underline"
        >
          Back
        </button>
      </div>
    )
  }

  // Join mode
  return (
    <div className="flex flex-col items-center justify-between h-full px-10 py-10 bg-background-primary">
      <div className="flex flex-col items-center gap-2 pt-4">
        <span className="text-4xl">🔗</span>
        <h1 className="text-title2 text-center">Join Workspace</h1>
        <p className="text-subheadline text-text-secondary text-center">
          Enter the workspace ID shared by your team
        </p>
      </div>

      <div className="w-full space-y-3">
        <Input
          label="Workspace ID"
          placeholder="e.g., EF-7X3K9"
          value={wsId}
          onChange={(e) => setWsId(e.target.value.toUpperCase())}
          autoFocus
        />

        {error && <p className="text-caption text-accent-red">{error}</p>}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          loading={isLoading}
          disabled={!wsId.trim()}
          onClick={handleJoin}
        >
          Join Workspace
        </Button>
      </div>

      <button
        onClick={() => { setMode('choose'); setError(null) }}
        className="text-caption text-accent-blue hover:underline"
      >
        Back
      </button>
    </div>
  )
}
