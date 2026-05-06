import { useState } from 'react'
import { useWorkspaceStore } from '@wam/shared'

export function WorkspaceSwitcher() {
  const currentWorkspace = useWorkspaceStore((s) => s.currentWorkspace)
  const userWorkspaces = useWorkspaceStore((s) => s.userWorkspaces)
  const switchWorkspace = useWorkspaceStore((s) => s.switchWorkspace)
  const [open, setOpen] = useState(false)

  if (userWorkspaces.length <= 1) {
    // Single workspace — just show name, no dropdown
    return (
      <span className="text-caption text-text-secondary truncate max-w-[140px]">
        {currentWorkspace?.name}
      </span>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-caption text-text-secondary hover:text-text-primary transition-colors"
      >
        <span className="truncate max-w-[120px]">{currentWorkspace?.name}</span>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-background-elevated border border-border rounded-md shadow-popover py-1 min-w-[160px]">
            {userWorkspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => { switchWorkspace(ws.id); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-caption hover:bg-background-secondary transition-colors
                  ${ws.id === currentWorkspace?.id ? 'text-accent-blue font-medium' : 'text-text-primary'}`}
              >
                {ws.name}
                <span className="text-caption2 text-text-tertiary ml-1">{ws.id}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
