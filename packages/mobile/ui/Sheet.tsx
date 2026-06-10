import { Modal, View, KeyboardAvoidingView, Platform, Pressable, TextInput } from 'react-native'
import { useTheme } from '../utils/theme'
import { spacing, radius, shadow } from './tokens'
import { Text } from './Text'
import { Button } from './Button'

// Reusable confirmation sheet — fades in over a dimmed backdrop, hosts a title, a body
// blurb, an optional input, and a Cancel + primary action pair. Centred dialog, not a
// bottom sheet — keeps keyboard handling simple and reads as native on both platforms.

export interface SheetProps {
  open: boolean
  onClose: () => void
  title: string
  body?: string
  inputLabel?: string
  inputValue?: string
  onChangeInput?: (v: string) => void
  inputPlaceholder?: string
  primaryTitle: string
  primaryVariant?: 'filled' | 'tinted'
  primaryDestructive?: boolean
  onPrimary: () => void
  cancelTitle?: string
}

export function Sheet({
  open,
  onClose,
  title,
  body,
  inputLabel,
  inputValue,
  onChangeInput,
  inputPlaceholder,
  primaryTitle,
  primaryVariant = 'filled',
  primaryDestructive = false,
  onPrimary,
  cancelTitle = 'Cancel',
}: SheetProps) {
  const t = useTheme()

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      {/* Backdrop is its own Pressable wrapping the entire viewport — tap anywhere
          outside the card dismisses. The card sits inside and stops propagation by
          virtue of being a non-pressable View, so touches on it never reach the
          backdrop's onPress. Works correctly on Android (tree-order z-index). */}
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          pointerEvents="box-none"
        >
        <View
          onStartShouldSetResponder={() => true}
          style={{
            width: '100%',
            maxWidth: 360,
            backgroundColor: t.bgElevated,
            borderRadius: radius.xl,
            padding: spacing.xl,
            gap: spacing.md,
            ...shadow.modal,
          }}
        >
          <Text variant="headline">{title}</Text>
          {body && (
            <Text variant="footnote" color="secondary">
              {body}
            </Text>
          )}

          {onChangeInput && (
            <View style={{ gap: spacing.xs }}>
              {inputLabel && (
                <Text variant="caption2" color="secondary" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {inputLabel}
                </Text>
              )}
              <TextInput
                value={inputValue}
                onChangeText={onChangeInput}
                placeholder={inputPlaceholder}
                placeholderTextColor={t.textTertiary}
                multiline
                autoFocus
                style={{
                  backgroundColor: t.bgGrouped,
                  borderRadius: radius.md,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.md,
                  color: t.text,
                  fontSize: 15,
                  minHeight: 72,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
            <Button title={cancelTitle} variant="gray" onPress={onClose} fullWidth style={{ flex: 1 }} />
            <Button
              title={primaryTitle}
              variant={primaryVariant}
              destructive={primaryDestructive}
              onPress={onPrimary}
              fullWidth
              style={{ flex: 1 }}
            />
          </View>
        </View>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  )
}
