import { View, type ViewStyle } from 'react-native'
import { useTheme } from '../utils/theme'
import { spacing, radius, shadow, type Spacing } from './tokens'

type Tone = 'default' | 'warning' | 'danger' | 'accent' | 'success'

export interface CardProps {
  children: React.ReactNode
  padding?: Spacing
  tone?: Tone
  bordered?: boolean
  style?: ViewStyle
}

export function Card({
  children,
  padding = 'lg',
  tone = 'default',
  bordered = false,
  style,
}: CardProps) {
  const t = useTheme()

  const bg =
    tone === 'warning' ? t.warnTint
    : tone === 'danger' ? t.dangerTint
    : tone === 'accent' ? t.accentTint
    : tone === 'success' ? t.successTint
    : t.bgGroupedElevated

  const borderColor =
    tone === 'warning' ? t.orange
    : tone === 'danger' ? t.red
    : tone === 'accent' ? t.accent
    : tone === 'success' ? t.green
    : t.separator

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: radius.lg,
          padding: spacing[padding],
          // Subtle shadow only on default — tinted cards already read as floating from the color
          ...(tone === 'default' ? shadow.card : {}),
          ...(bordered ? { borderWidth: 1, borderColor } : {}),
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
