import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native'
import { useTheme } from '../utils/theme'
import { type, type TypeVariant } from './tokens'

type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'inverse'

type Weight = 'regular' | 'medium' | 'semibold' | 'bold'

export interface TextProps extends RNTextProps {
  variant?: TypeVariant
  color?: TextColor
  weight?: Weight
  align?: TextStyle['textAlign']
}

const weights: Record<Weight, TextStyle['fontWeight']> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}

export function Text({
  variant = 'body',
  color = 'primary',
  weight,
  align,
  style,
  children,
  ...rest
}: TextProps) {
  const t = useTheme()

  const colorValue =
    color === 'primary' ? t.text
    : color === 'secondary' ? t.textSecondary
    : color === 'tertiary' ? t.textTertiary
    : color === 'accent' ? t.accent
    : color === 'success' ? t.green
    : color === 'warning' ? t.orange
    : color === 'danger' ? t.red
    : '#FFFFFF' // inverse

  return (
    <RNText
      style={[
        type[variant],
        { color: colorValue },
        weight && { fontWeight: weights[weight] },
        align && { textAlign: align },
        style,
      ]}
      {...rest}
    >
      {children}
    </RNText>
  )
}
