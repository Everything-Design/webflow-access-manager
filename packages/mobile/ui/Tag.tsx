import { View, type ViewStyle } from 'react-native'
import { useTheme } from '../utils/theme'
import { spacing, radius } from './tokens'
import { Text } from './Text'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'purple'
type Size = 'sm' | 'md'

export interface TagProps {
  label: string
  tone?: Tone
  size?: Size
  style?: ViewStyle
}

export function Tag({ label, tone = 'neutral', size = 'md', style }: TagProps) {
  const t = useTheme()

  const bg =
    tone === 'success' ? t.successTint
    : tone === 'warning' ? t.warnTint
    : tone === 'danger' ? t.dangerTint
    : tone === 'accent' ? t.accentTint
    : tone === 'purple' ? t.purpleTint
    : t.neutralTint

  const fg =
    tone === 'success' ? t.green
    : tone === 'warning' ? t.orange
    : tone === 'danger' ? t.red
    : tone === 'accent' ? t.accent
    : tone === 'purple' ? t.purple
    : t.textSecondary

  const padV = size === 'sm' ? 2 : 4
  const padH = size === 'sm' ? spacing.sm : spacing.md - 2

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          paddingHorizontal: padH,
          paddingVertical: padV,
          borderRadius: radius.pill,
          alignSelf: 'flex-start',
        },
        style,
      ]}
    >
      <Text variant={size === 'sm' ? 'caption2' : 'caption1'} weight="semibold" style={{ color: fg }}>
        {label}
      </Text>
    </View>
  )
}
