import { useEffect, useMemo, useState, useCallback } from 'react'
import { View, ScrollView, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppStore, useAuthStore, isAccountAvailable } from '@wam/shared'
import { AccountRow } from '../../components/AccountRow'
import { ClientAccountRow } from '../../components/ClientAccountRow'
import { useTheme } from '../../utils/theme'
import { Text, Tag, ListSection, IconCircle, spacing, haptic } from '../../ui'

export default function AccountsScreen() {
  const t = useTheme()
  const accounts = useAppStore((s) => s.accounts)
  const clientAccounts = useAppStore((s) => s.clientAccounts)
  const isConnected = useAppStore((s) => s.isConnected)
  const currentUser = useAuthStore((s) => s.currentUser)

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
              Ask the admin to add account slots from the Settings tab.
            </Text>
          </View>
        ) : (
          <ListSection header="Internal accounts">
            {accounts.map((account) => <AccountRow key={account.id} account={account} />)}
          </ListSection>
        )}

        {clientAccounts.length > 0 && (
          <ListSection header="Client accounts">
            {clientAccounts.map((ca) => <ClientAccountRow key={ca.id} clientAccount={ca} />)}
          </ListSection>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
