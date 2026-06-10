import { View, type ViewStyle } from 'react-native'
import { useTheme } from '../utils/theme'
import { Text } from './Text'

export interface IconCircleProps {
  emoji?: string
  glyph?: React.ReactNode
  color?: string // hex without # OR a theme key
  size?: number
  style?: ViewStyle
}

export function IconCircle({ emoji, glyph, color = 'accent', size = 40, style }: IconCircleProps) {
  const t = useTheme()

  const isHex = /^[0-9A-Fa-f]{6}$/.test(color)
  const tone =
    isHex ? `#${color}`
    : color === 'accent' ? t.accent
    : color === 'green' ? t.green
    : color === 'orange' ? t.orange
    : color === 'red' ? t.red
    : color === 'purple' ? t.purple
    : t.accent

  const bg = isHex ? `#${color}22` : tone + '22'

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      {emoji ? (
        <Text variant="body" style={{ fontSize: size * 0.5, lineHeight: size * 0.5 }}>
          {emoji}
        </Text>
      ) : (
        glyph
      )}
    </View>
  )
}
