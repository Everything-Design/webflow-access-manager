import { Children, isValidElement } from 'react'
import { View, Pressable, type ViewStyle } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useTheme } from '../utils/theme'
import { spacing, radius, shadow } from './tokens'
import { Text } from './Text'

// ─── ListSection ────────────────────────────────────────────────────────────────

export interface ListSectionProps {
  header?: string
  footer?: string
  children: React.ReactNode
  style?: ViewStyle
}

export function ListSection({ header, footer, children, style }: ListSectionProps) {
  const t = useTheme()

  // Use React.Children.toArray to normalise — it strips falsy entries, flattens
  // fragments, and crucially preserves each child's own `key` so React reuses the
  // right DOM when rows shuffle. We then forward each child's key explicitly to the
  // separator wrapper so the wrapper inherits identity from the underlying row.
  const rows = Children.toArray(children)

  return (
    <View style={[{ gap: spacing.sm }, style]}>
      {header && (
        <Text
          variant="caption2"
          color="secondary"
          style={{
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            paddingHorizontal: spacing.lg,
          }}
        >
          {header}
        </Text>
      )}
      <View
        style={{
          backgroundColor: t.bgGroupedElevated,
          borderRadius: radius.lg,
          overflow: 'hidden',
          ...shadow.card,
        }}
      >
        {rows.map((row, i) => {
          const rowKey = isValidElement(row) ? row.key ?? `row-${i}` : `row-${i}`
          return (
            <View key={rowKey}>
              {row}
              {i < rows.length - 1 && (
                <View
                  style={{
                    height: 1,
                    backgroundColor: t.separator,
                    marginLeft: spacing.lg,
                  }}
                />
              )}
            </View>
          )
        })}
      </View>
      {footer && (
        <Text
          variant="footnote"
          color="secondary"
          style={{ paddingHorizontal: spacing.lg }}
        >
          {footer}
        </Text>
      )}
    </View>
  )
}

// ─── ListRow ────────────────────────────────────────────────────────────────────

export interface ListRowProps {
  leading?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  trailing?: React.ReactNode
  onPress?: () => void
  destructive?: boolean
  minHeight?: number
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  destructive = false,
  minHeight = 56,
}: ListRowProps) {
  const t = useTheme()

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        minHeight,
      }}
    >
      {leading && <View>{leading}</View>}
      <View style={{ flex: 1, minWidth: 0 }}>
        {typeof title === 'string' ? (
          <Text variant="body" color={destructive ? 'danger' : 'primary'} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          title
        )}
        {subtitle && (
          typeof subtitle === 'string' ? (
            <Text variant="footnote" color="secondary" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : (
            subtitle
          )
        )}
      </View>
      {trailing && <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>{trailing}</View>}
      {onPress && !trailing && (
        <Ionicons name="chevron-forward" size={16} color={t.textTertiary} />
      )}
    </View>
  )

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ backgroundColor: pressed ? t.fill1 : 'transparent' })}
      >
        {content}
      </Pressable>
    )
  }
  return content
}
