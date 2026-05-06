import { useState } from 'react'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { Input } from './ui/Input'
import { useAppStore, getAccountDisplayName } from '@wam/shared'
import type { AccessRequest } from '@wam/shared'

interface AccessRequestRowProps {
  request: AccessRequest
}

type Mode = 'accept' | 'reject' | null

export function AccessRequestRow({ request }: AccessRequestRowProps) {
  const releaseAccountForRequest = useAppStore((s) => s.releaseAccountForRequest)
  const rejectRequest = useAppStore((s) => s.rejectRequest)

  const [mode, setMode] = useState<Mode>(null)
  const [note, setNote] = useState('')

  const accountName = getAccountDisplayName(request.accountId, request.accountLabel)

  const handleConfirm = () => {
    if (mode === 'accept') {
      releaseAccountForRequest(request, note.trim() || undefined)
    } else if (mode === 'reject') {
      rejectRequest(request.id, note.trim() || undefined)
    }
    setMode(null)
    setNote('')
  }

  return (
    <Card highlight="orange">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-accent-orange text-lg">!</span>
        <p className="text-subheadline font-medium">
          {request.requesterName} requests {accountName}
        </p>
      </div>

      {request.requesterNote && (
        <p className="text-caption text-text-secondary mb-2 ml-7 italic">
          "{request.requesterNote}"
        </p>
      )}

      <div className="flex gap-2 ml-7">
        <Button
          size="sm"
          variant="primary"
          onClick={() => setMode('accept')}
        >
          Release & Accept
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setMode('reject')}
        >
          Reject
        </Button>
      </div>

      <Modal open={mode !== null} onClose={() => { setMode(null); setNote('') }}>
        <h3 className="text-headline mb-1">
          {mode === 'accept' ? 'Release & accept' : 'Reject request'}
        </h3>
        <p className="text-caption text-text-secondary mb-3">
          {mode === 'accept'
            ? `Release ${accountName} for ${request.requesterName}.`
            : `Reject ${request.requesterName}'s request.`}
        </p>
        <Input
          label="Add a note (optional)"
          placeholder={mode === 'accept' ? 'e.g., Done in 5 mins, all yours' : 'e.g., Working on a live deploy, try again in 30 min'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
          autoFocus
        />
        <div className="flex justify-between mt-4">
          <Button onClick={() => { setMode(null); setNote('') }}>Cancel</Button>
          <Button variant={mode === 'accept' ? 'primary' : 'destructive'} onClick={handleConfirm}>
            {mode === 'accept' ? 'Release & Accept' : 'Reject'}
          </Button>
        </div>
      </Modal>
    </Card>
  )
}
