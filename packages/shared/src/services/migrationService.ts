import { ref, get, set } from 'firebase/database'
import { getDb } from './firebase'

/**
 * One-time migration: copies existing flat data into a workspace.
 * Call this when the first workspace is created by the original owner.
 */
export async function migrateExistingDataToWorkspace(wsId: string): Promise<{ accounts: number; clientAccounts: number; accessRequests: number }> {
  const db = getDb()
  let accountCount = 0
  let clientCount = 0
  let requestCount = 0

  try {
    // Migrate accounts
    const accountsSnap = await get(ref(db, 'accounts'))
    if (accountsSnap.exists()) {
      const accounts = accountsSnap.val()
      for (const [key, value] of Object.entries(accounts)) {
        await set(ref(db, `workspaces/${wsId}/accounts/${key}`), value)
        accountCount++
      }
      console.log(`[Migration] Migrated ${accountCount} accounts`)
    }

    // Migrate client accounts
    const clientSnap = await get(ref(db, 'clientAccounts'))
    if (clientSnap.exists()) {
      const clients = clientSnap.val()
      for (const [key, value] of Object.entries(clients)) {
        await set(ref(db, `workspaces/${wsId}/clientAccounts/${key}`), value)
        clientCount++
      }
      console.log(`[Migration] Migrated ${clientCount} client accounts`)
    }

    // Migrate access requests
    const requestsSnap = await get(ref(db, 'accessRequests'))
    if (requestsSnap.exists()) {
      const requests = requestsSnap.val()
      for (const [key, value] of Object.entries(requests)) {
        await set(ref(db, `workspaces/${wsId}/accessRequests/${key}`), value)
        requestCount++
      }
      console.log(`[Migration] Migrated ${requestCount} access requests`)
    }

    console.log('[Migration] Complete for workspace:', wsId)
    return { accounts: accountCount, clientAccounts: clientCount, accessRequests: requestCount }
  } catch (error) {
    console.error('[Migration] Failed:', error)
    throw error
  }
}
