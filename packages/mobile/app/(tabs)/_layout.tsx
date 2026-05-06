import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useAppStore } from '@wam/shared'
import { useTheme } from '../../utils/theme'

export default function TabsLayout() {
  const t = useTheme()
  const pendingCount = useAppStore((s) => s.pendingRequestsForCurrentUser.length)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.accent,
        tabBarInactiveTintColor: t.textSecondary,
        tabBarStyle: { backgroundColor: t.bgElevated, borderTopColor: t.border },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🔑</Text>,
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>📨</Text>,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚙️</Text>,
        }}
      />
    </Tabs>
  )
}
