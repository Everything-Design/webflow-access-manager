import { ActivityIndicator, Pressable, View, type PressableProps, type ViewStyle } from 'react-native'
import { useTheme } from '../utils/theme'
import { spacing, radius } from './tokens'
import { Text } from './Text'
import { haptic } from './haptics'

type Variant = 'filled' | 'tinted' | 'plain' | 'gray'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  title: string
  variant?: Variant
  size?: Size
  destructive?: boolean
  loading?: boolean
  fullWidth?: boolean
  leadingIcon?: React.ReactNode
  style?: ViewStyle
  enableHaptic?: boolean
}

export function Button({
  title,
  variant = 'filled',
  size = 'md',
  destructive = false,
  loading = false,
  fullWidth = false,
  leadingIcon,
  enableHaptic,
  disabled,
  onPress,
  style,
  ...rest
}: ButtonProps) {
  const t = useTheme()

  // Resolve base color (red if destructive, accent otherwise) once so every variant
  // shares the same source of truth.
  const baseColor = destructive ? t.red : t.accent

  // Map variant → (bg, fg, border). iOS-style: filled wins primary actions, tinted
  // sits beneath, plain is link-weight, gray is the neutral utility button.
  const styles: { bg: string; fg: string; border?: string } =
    variant === 'filled'
      ? { bg: baseColor, fg: '#FFFFFF' }
      : variant === 'tinted'
        ? { bg: destructive ? t.dangerTint : t.accentTint, fg: baseColor }
        : variant === 'gray'
          ? { bg: t.fill1, fg: destructive ? baseColor : t.text }
          : { bg: 'transparent', fg: baseColor }

  const padV = size === 'sm' ? spacing.sm : size === 'md' ? spacing.md : spacing.md + 2
  const padH = size === 'sm' ? spacing.md : size === 'md' ? spacing.lg : spacing.xl
  const minH = size === 'sm' ? 32 : size === 'md' ? 40 : 50

  // Pick a default haptic feel per variant — destructive warns, primary taps, others stay silent.
  const shouldHaptic =
    enableHaptic ?? (variant === 'filled' || destructive)

  const handlePress = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    if (shouldHaptic) {
      if (destructive) haptic.warn()
      else haptic.tap()
    }
    onPress?.(e)
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: styles.bg,
          borderRadius: radius.md,
          paddingVertical: padV,
          paddingHorizontal: padH,
          minHeight: minH,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: spacing.sm,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          opacity: disabled ? 0.4 : pressed ? 0.65 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        styles.border ? { borderWidth: 1, borderColor: styles.border } : null,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.fg} />
      ) : (
        <>
          {leadingIcon && <View>{leadingIcon}</View>}
          <Text
            variant={size === 'sm' ? 'subheadline' : 'body'}
            weight="semibold"
            style={{ color: styles.fg }}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  )
}
