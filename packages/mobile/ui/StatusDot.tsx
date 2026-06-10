import { View } from 'react-native'
import { useTheme } from '../utils/theme'

// Small filled circle used as a leading marker in rows. Reuses the semantic colour
// vocab from the desktop tray (green = available, orange = pending, red = unavailable).

export interface StatusDotProps {
  tone: 'success' | 'warning' | 'danger' | 'accent' | 'purple' | 'neutral'
  size?: number
}

export function StatusDot({ tone, size = 10 }: StatusDotProps) {
  const t = useTheme()
  const color =
    tone === 'success' ? t.green
    : tone === 'warning' ? t.orange
    : tone === 'danger' ? t.red
    : tone === 'accent' ? t.accent
    : tone === 'purple' ? t.purple
    : t.textTertiary

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }}
    />
  )
}
