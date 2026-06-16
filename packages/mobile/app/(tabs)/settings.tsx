import { useState, useEffect } from 'react'
import { View, ScrollView, TextInput, Pressable, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { useAuthStore, useAppStore, useAdminStore } from '@wam/shared'
import { useTheme } from '../../utils/theme'
import {
  Text,
  Button,
  Card,
  Tag,
  IconCircle,
  ListSection,
  ListRow,
  StatusDot,
  spacing,
  radius,
  haptic,
} from '../../ui'

const ICONS = [
  { id: 'user', emoji: '👤' }, { id: 'star', emoji: '⭐' }, { id: 'heart', emoji: '❤️' },
  { id: 'bolt', emoji: '⚡' }, { id: 'flame', emoji: '🔥' }, { id: 'moon', emoji: '🌙' },
  { id: 'sun', emoji: '☀️' }, { id: 'cloud', emoji: '☁️' }, { id: 'leaf', emoji: '🍃' },
  { id: 'sparkles', emoji: '✨' }, { id: 'crown', emoji: '👑' }, { id: 'rocket', emoji: '🚀' },
]

const COLORS = [
  { name: 'Blue', hex: '0066CC' }, { name: 'Purple', hex: '7C3AED' },
  { name: 'Pink', hex: 'EC4899' }, { name: 'Red', hex: 'EF4444' },
  { name: 'Orange', hex: 'F97316' }, { name: 'Green', hex: '10B981' },
  { name: 'Teal', hex: '14B8A6' }, { name: 'Indigo', hex: '6366F1' },
]

export default function SettingsScreen() {
  const t = useTheme()
  const currentUser = useAuthStore((s) => s.currentUser)
  const updateUser = useAuthStore((s) => s.updateUser)
  const signOut = useAuthStore((s) => s.signOut)
  const isConnected = useAppStore((s) => s.isConnected)
  const accounts = useAppStore((s) => s.accounts)
  const clientAccounts = useAppStore((s) => s.clientAccounts)
  const team = useAppStore((s) => s.team)
  const pendingTeamMembers = useAppStore((s) => s.pendingTeamMembers)
  const approveTeamMember = useAppStore((s) => s.approveTeamMember)
  const rejectTeamMember = useAppStore((s) => s.rejectTeamMember)
  const removeTeamMember = useAppStore((s) => s.removeTeamMember)
  const adminUid = useAdminStore((s) => s.adminUid)
  const transferAdmin = useAdminStore((s) => s.transfer)
  const isAdmin = currentUser?.id === adminUid

  const onlineCount = team.filter((m) => m.status === 'approved' && m.isOnline).length
  const approvedCount = team.filter((m) => m.status === 'approved').length
  const occupiedAccounts = accounts.filter((a) => a.isOccupied).length
  const availableAccounts = accounts.length - occupiedAccounts

  const [name, setName] = useState(currentUser?.name ?? '')
  const [icon, setIcon] = useState(currentUser?.profileIcon ?? 'user')
  const [color, setColor] = useState(currentUser?.profileColor ?? '0066CC')

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name)
      setIcon(currentUser.profileIcon ?? 'user')
      setColor(currentUser.profileColor ?? '0066CC')
    }
  }, [currentUser])

  const profileChanged =
    name.trim() !== (currentUser?.name ?? '') ||
    icon !== (currentUser?.profileIcon ?? 'user') ||
    color !== (currentUser?.profileColor ?? '0066CC')

  const handleSave = async () => {
    try {
      await updateUser({ name: name.trim(), profileIcon: icon, profileColor: color })
      haptic.success()
      Alert.alert('Saved', 'Profile updated')
    } catch (err) {
      haptic.danger()
      const msg = err instanceof Error ? err.message : 'Could not save changes'
      Alert.alert("Couldn't save", msg)
    }
  }

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'You can come back any time.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          haptic.warn()
          // Navigate only after sign-out resolves, never before. If it rejects we
          // surface the error rather than leaving the user in a half-signed-out state.
          signOut()
            .then(() => router.replace('/onboarding'))
            .catch((err) => {
              const msg = err instanceof Error ? err.message : "Couldn't sign out"
              Alert.alert("Couldn't sign out", msg)
            })
        },
      },
    ])
  }

  // iOS-style admin menu per team member — Make admin (irreversible without their
  // help), Remove. Each option gets its own confirmation. Skip both when the target
  // is the current user (you can't transfer admin to yourself, and you can't remove
  // yourself from the team list — use Sign out).
  const handleMemberMenu = (uid: string, memberName: string) => {
    haptic.tap()
    Alert.alert(memberName, 'Admin actions', [
      {
        text: 'Make admin',
        onPress: () => {
          Alert.alert(
            `Transfer admin to ${memberName}?`,
            'You will become a regular member after this. The change takes effect immediately on every device.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Transfer admin',
                style: 'destructive',
                onPress: async () => {
                  haptic.warn()
                  try {
                    await transferAdmin(uid)
                  } catch (err) {
                    Alert.alert("Couldn't transfer", err instanceof Error ? err.message : 'Unknown error')
                  }
                },
              },
            ],
          )
        },
      },
      { text: 'Remove from team', style: 'destructive', onPress: () => handleRemove(uid, memberName) },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  const handleRemove = (uid: string, memberName: string) => {
    Alert.alert(
      `Remove ${memberName}?`,
      'They will need approval again next time they sign in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            haptic.warn()
            removeTeamMember(uid)
          },
        },
      ],
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.bgGrouped }} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, gap: spacing.xl }}
      >
        <Text variant="largeTitle">Settings</Text>

        {/* Profile card */}
        <Card>
          <View style={{ gap: spacing.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <IconCircle emoji={ICONS.find((i) => i.id === icon)?.emoji ?? '👤'} color={color} size={56} />
              <View style={{ flex: 1 }}>
                <Text variant="caption2" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor={t.textTertiary}
                  style={{
                    color: t.text,
                    fontSize: 17,
                    fontWeight: '500',
                    paddingVertical: spacing.xs,
                  }}
                />
                {currentUser?.email && (
                  <Text variant="footnote" color="secondary">
                    {currentUser.email}
                  </Text>
                )}
              </View>
            </View>

            {/* Icon picker */}
            <View style={{ gap: spacing.sm }}>
              <Text variant="caption2" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Icon
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {ICONS.map((i) => {
                  const selected = icon === i.id
                  return (
                    <Pressable
                      key={i.id}
                      onPress={() => {
                        haptic.select()
                        setIcon(i.id)
                      }}
                      style={({ pressed }) => ({
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: selected ? `#${color}22` : t.fill1,
                        borderWidth: selected ? 2 : 0,
                        borderColor: `#${color}`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text variant="body" style={{ fontSize: 22, lineHeight: 24 }}>
                        {i.emoji}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            {/* Color picker */}
            <View style={{ gap: spacing.sm }}>
              <Text variant="caption2" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Color
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
                {COLORS.map((c) => {
                  const selected = color === c.hex
                  return (
                    <Pressable
                      key={c.hex}
                      onPress={() => {
                        haptic.select()
                        setColor(c.hex)
                      }}
                      style={({ pressed }) => ({
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: `#${c.hex}`,
                        borderWidth: selected ? 3 : 0,
                        borderColor: t.bgGroupedElevated,
                        opacity: pressed ? 0.7 : 1,
                        ...(selected
                          ? { shadowColor: `#${c.hex}`, shadowOpacity: 0.5, shadowRadius: 6, elevation: 2 }
                          : {}),
                      })}
                    />
                  )
                })}
              </View>
            </View>

            {profileChanged && (
              <Button title="Save changes" variant="filled" fullWidth onPress={handleSave} />
            )}
          </View>
        </Card>

        {/* Pending approvals — admin only, only if any */}
        {isAdmin && pendingTeamMembers.length > 0 && (
          <ListSection header={`Pending approvals (${pendingTeamMembers.length})`}>
            {pendingTeamMembers.map((m) => (
              <ListRow
                key={m.id}
                leading={<IconCircle emoji={m.profileIcon ? ICONS.find((i) => i.id === m.profileIcon)?.emoji : '👤'} color={m.profileColor ?? 'accent'} size={36} />}
                title={m.name || m.email || 'Unknown'}
                subtitle={m.email}
                trailing={
                  <View style={{ flexDirection: 'row', gap: spacing.xs }}>
                    <Button
                      title="Approve"
                      variant="tinted"
                      size="sm"
                      onPress={() => {
                        haptic.success()
                        approveTeamMember(m.id)
                      }}
                    />
                    <Button
                      title="Reject"
                      variant="gray"
                      size="sm"
                      destructive
                      onPress={() => {
                        haptic.warn()
                        rejectTeamMember(m.id)
                      }}
                    />
                  </View>
                }
              />
            ))}
          </ListSection>
        )}

        {/* Team list */}
        <ListSection header={`Team (${approvedCount})`}>
          {team
            .filter((m) => m.status === 'approved')
            .map((m) => {
              const isMe = m.id === currentUser?.id
              const isAdminMember = m.id === adminUid
              return (
                <ListRow
                  key={m.id}
                  leading={
                    <View>
                      <IconCircle
                        emoji={m.profileIcon ? ICONS.find((i) => i.id === m.profileIcon)?.emoji : '👤'}
                        color={m.profileColor ?? 'accent'}
                        size={36}
                      />
                      {m.isOnline && (
                        <View
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: t.green,
                            borderWidth: 2,
                            borderColor: t.bgGroupedElevated,
                          }}
                        />
                      )}
                    </View>
                  }
                  title={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                      <Text variant="body" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {m.name}
                      </Text>
                      {isAdminMember && <Tag label="Admin" tone="accent" size="sm" />}
                      {isMe && <Tag label="You" tone="neutral" size="sm" />}
                    </View>
                  }
                  subtitle={m.email}
                  trailing={
                    isAdmin && !isMe ? (
                      <Button
                        title="Manage"
                        variant="plain"
                        size="sm"
                        onPress={() => handleMemberMenu(m.id, m.name)}
                      />
                    ) : undefined
                  }
                />
              )
            })}
        </ListSection>

        {/* Overview */}
        <View style={{ gap: spacing.sm }}>
          <Text
            variant="caption2"
            color="secondary"
            style={{ textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: spacing.lg }}
          >
            Overview
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <StatCard label="Team" value={approvedCount} accent={`${onlineCount} online`} accentTone="success" />
            <StatCard
              label="Accounts"
              value={accounts.length}
              accent={`${availableAccounts} free · ${occupiedAccounts} in use`}
            />
          </View>
          <View style={{ flexDirection: 'row' }}>
            <StatCard label="Client accounts" value={clientAccounts.length} fullWidth />
          </View>
        </View>

        {/* Connection */}
        <ListSection>
          <ListRow
            leading={<StatusDot tone={isConnected ? 'success' : 'danger'} size={12} />}
            title={isConnected ? 'Connected to Firebase' : 'Disconnected'}
            subtitle="Live sync across devices"
          />
        </ListSection>

        {/* Sign out */}
        <Button title="Sign out" variant="gray" destructive fullWidth onPress={handleSignOut} />
      </ScrollView>
    </SafeAreaView>
  )
}

// Small stat tile — kept inline; we'd only abstract if a third screen needed it.
function StatCard({
  label,
  value,
  accent,
  accentTone = 'secondary',
  fullWidth = false,
}: {
  label: string
  value: string | number
  accent?: string
  accentTone?: 'secondary' | 'success' | 'warning' | 'danger'
  fullWidth?: boolean
}) {
  const t = useTheme()
  return (
    <View
      style={{
        flex: fullWidth ? undefined : 1,
        alignSelf: fullWidth ? 'stretch' : undefined,
        backgroundColor: t.bgGroupedElevated,
        borderRadius: radius.lg,
        padding: spacing.lg,
        gap: spacing.xs,
      }}
    >
      <Text variant="caption2" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </Text>
      <Text variant="title1">{value}</Text>
      {accent && (
        <Text variant="footnote" color={accentTone}>
          {accent}
        </Text>
      )}
    </View>
  )
}
