import { useEffect, useMemo, useState, useCallback } from 'react'
import { View, ScrollView, RefreshControl, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppStore, useAuthStore, useAdminStore, isAccountAvailable, generateId } from '@wam/shared'
import { AccountRow } from '../../components/AccountRow'
import { ClientAccountRow } from '../../components/ClientAccountRow'
import { useTheme } from '../../utils/theme'
import { Text, Tag, ListSection, IconCircle, Button, Sheet, spacing, haptic } from '../../ui'

export default function AccountsScreen() {
  const t = useTheme()
  const accounts = useAppStore((s) => s.accounts)
  const clientAccounts = useAppStore((s) => s.clientAccounts)
  const isConnected = useAppStore((s) => s.isConnected)
  const createAccountSlot = useAppStore((s) => s.createAccountSlot)
  const currentUser = useAuthStore((s) => s.currentUser)
  const adminUid = useAdminStore((s) => s.adminUid)
  const isAdmin = currentUser?.id === adminUid

  const availableCount = useMemo(() => accounts.filter(isAccountAvailable).length, [accounts])
  const myAccount = useMemo(
    () => accounts.find((a) => a.occupiedBy === currentUser?.id),
    [accounts, currentUser?.id]
  )

  // Tick refreshes the duration labels in row subtitles once a minute.
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useCallback(() => {
    haptic.select()
    setRefreshing(true)
    if (currentUser?.id) {
      useAppStore.getState().setupListeners(currentUser.id)
    }
    setTimeout(() => setRefreshing(false), 800)
  }, [currentUser?.id])

  // Greeting line: pull the first name to keep it personal but tight.
  const firstName = currentUser?.name?.split(' ')[0] ?? 'there'

  // Add-account sheet — admin only. Label is required; ID is auto-generated.
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const handleCreate = async () => {
    const label = newLabel.trim()
    if (!label) {
      setAddError('Give the account a label first.')
      return
    }
    setIsCreating(true)
    setAddError(null)
    try {
      const id = `account-${generateId()}`
      await createAccountSlot(id, label)
      haptic.success()
      setNewLabel('')
      setShowAddSheet(false)
    } catch (err) {
      console.error('[Accounts] Create slot failed:', err)
      setAddError(err instanceof Error ? err.message : 'Could not add account')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bgGrouped }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={t.accent} />}
      >
        {/* Greeting + connection chip — replaces the bespoke header block */}
        <View style={{ gap: spacing.sm }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text variant="largeTitle">Hello, {firstName}</Text>
            </View>
            <Tag
              label={isConnected ? 'Connected' : 'Offline'}
              tone={isConnected ? 'success' : 'danger'}
              size="sm"
            />
          </View>

          {/* Status banner — a single line summary of the user's standing right now */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              backgroundColor: t.bgGroupedElevated,
              borderRadius: 14,
              padding: spacing.md,
            }}
          >
            <IconCircle
              emoji={myAccount ? '🔓' : availableCount > 0 ? '✨' : '⛔'}
              color={myAccount ? 'accent' : availableCount > 0 ? 'green' : 'red'}
              size={36}
            />
            <View style={{ flex: 1 }}>
              {myAccount ? (
                <>
                  <Text variant="callout" weight="semibold">
                    You're using {myAccount.label ?? 'an account'}
                  </Text>
                  <Text variant="footnote" color="secondary">
                    Tap Release on the row to free it up.
                  </Text>
                </>
              ) : availableCount > 0 ? (
                <>
                  <Text variant="callout" weight="semibold">
                    {availableCount} account{availableCount === 1 ? '' : 's'} available
                  </Text>
                  <Text variant="footnote" color="secondary">
                    Tap Claim to take one.
                  </Text>
                </>
              ) : (
                <>
                  <Text variant="callout" weight="semibold">
                    All accounts in use
                  </Text>
                  <Text variant="footnote" color="secondary">
                    Send a request to swap with a teammate.
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {/* Internal accounts grouped list */}
        {accounts.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: spacing.xxl, gap: spacing.sm }}>
            <IconCircle emoji="🔑" color="accent" size={56} />
            <Text variant="headline">No accounts yet</Text>
            <Text variant="footnote" color="secondary" align="center" style={{ maxWidth: 280 }}>
              {isAdmin
                ? 'Add your first account slot to get the team started.'
                : 'Ask the admin to add account slots from the Settings tab.'}
            </Text>
            {isAdmin && (
              <Button
                title="Add account"
                variant="filled"
                size="md"
                onPress={() => {
                  haptic.tap()
                  setShowAddSheet(true)
                }}
                style={{ marginTop: spacing.sm }}
              />
            )}
          </View>
        ) : (
          <ListSection header="Internal accounts">
            {accounts.map((account) => <AccountRow key={account.id} account={account} />)}
          </ListSection>
        )}

        {/* Admin-only Add Account row — shown when there's at least one slot already,
            sits flush below the list so it reads as the "+ New" option. */}
        {isAdmin && accounts.length > 0 && (
          <AddAccountRow
            onPress={() => {
              haptic.tap()
              setShowAddSheet(true)
            }}
          />
        )}

        {clientAccounts.length > 0 && (
          <ListSection header="Client accounts">
            {clientAccounts.map((ca) => <ClientAccountRow key={ca.id} clientAccount={ca} />)}
          </ListSection>
        )}
      </ScrollView>

      {/* Label-only sheet for creating a slot. Account ID is auto-generated. */}
      <Sheet
        open={showAddSheet}
        onClose={() => {
          setShowAddSheet(false)
          setNewLabel('')
          setAddError(null)
        }}
        title="Add an account"
        body="Give the slot a label your team will recognise. The Webflow account itself stays in Webflow — this is just the lane your team uses to coordinate who's using it."
        inputLabel="Label"
        inputValue={newLabel}
        onChangeInput={(v) => {
          setNewLabel(v)
          if (addError) setAddError(null)
        }}
        inputPlaceholder="e.g., Acme Client, Internal Marketing"
        primaryTitle={isCreating ? 'Adding…' : 'Add account'}
        onPrimary={handleCreate}
      />
      {addError && showAddSheet && (
        <View style={{ position: 'absolute', bottom: spacing.xxxl, left: spacing.lg, right: spacing.lg }}>
          <Text variant="footnote" color="danger" align="center">
            {addError}
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

// Small inline component — looks like a ListRow but with an explicit "+ Add account"
// affordance so the admin's primary creation action sits naturally with the list.
function AddAccountRow({ onPress }: { onPress: () => void }) {
  const t = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        backgroundColor: pressed ? t.fill1 : t.bgGroupedElevated,
        borderRadius: 14,
      })}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: t.accentTint,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="add" size={20} color={t.accent} />
      </View>
      <Text variant="body" color="accent">
        Add account
      </Text>
    </Pressable>
  )
}
