import { Card } from './ui/Card'
import { StatusDot } from './ui/StatusDot'
import { Button } from './ui/Button'
import { useAppStore, useAuthStore, formatDuration } from '@wam/shared'
import type { ClientAccount } from '@wam/shared'

interface ClientAccountRowProps {
  clientAccount: ClientAccount
}

export function ClientAccountRow({ clientAccount }: ClientAccountRowProps) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const clearClientAccount = useAppStore((s) => s.clearClientAccount)

  const isMyAccount = currentUser?.id === clientAccount.createdBy

  return (
    <Card className="flex items-center gap-3">
      <StatusDot color="purple" size="lg" />

      <div className="flex-1 min-w-0">
        <p className="text-subheadline font-medium truncate">
          {clientAccount.clientName}
        </p>
        <p className="text-caption text-text-secondary">
          {clientAccount.createdByName} &middot; {formatDuration(clientAccount.createdAt)}
        </p>
      </div>

      {isMyAccount && (
        <Button size="sm" onClick={() => clearClientAccount(clientAccount.id)}>
          Clear
        </Button>
      )}
    </Card>
  )
}
