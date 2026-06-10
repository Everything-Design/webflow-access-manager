import { Platform } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
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
        tabBarStyle: {
          backgroundColor: t.bgElevated,
          borderTopColor: t.separator,
          borderTopWidth: 0.5,
          height: Platform.OS === 'ios' ? 84 : 60,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', letterSpacing: 0.1 },
      }}
    >
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'key' : 'key-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'mail' : 'mail-outline'} size={22} color={color} />
          ),
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: { backgroundColor: t.red, color: '#fff', fontSize: 10 },
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'settings' : 'settings-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}
