import { useAppStore, useAuthStore, formatDuration } from '@wam/shared'
import type { ClientAccount } from '@wam/shared'
import { Button, ListRow, StatusDot, haptic } from '../ui'

export function ClientAccountRow({ clientAccount }: { clientAccount: ClientAccount }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const clearClientAccount = useAppStore((s) => s.clearClientAccount)
  const isMyAccount = currentUser?.id === clientAccount.createdBy

  const handleClear = () => {
    haptic.warn()
    clearClientAccount(clientAccount.id)
  }

  return (
    <ListRow
      leading={<StatusDot tone="purple" />}
      title={clientAccount.clientName}
      subtitle={`${clientAccount.createdByName} · ${formatDuration(clientAccount.createdAt)}`}
      trailing={
        isMyAccount ? (
          <Button title="Clear" variant="gray" size="sm" onPress={handleClear} />
        ) : undefined
      }
    />
  )
}
