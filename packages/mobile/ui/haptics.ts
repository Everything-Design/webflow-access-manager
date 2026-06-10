import * as Haptics from 'expo-haptics'

// Tiny wrapper. Wraps every call in try/catch because Android emulators and a handful
// of devices throw on the vibrator API even though the call is "harmless." We swallow —
// haptics are a nice-to-have, never a blocker.

function safe<T>(fn: () => Promise<T> | void): void {
  try {
    const r = fn()
    if (r && typeof (r as Promise<unknown>).catch === 'function') {
      ;(r as Promise<unknown>).catch(() => {})
    }
  } catch {
    /* swallowed — haptics shouldn't crash anything */
  }
}

export const haptic = {
  // Light tap for selecting, toggling, picking — never on idle scroll or hover.
  select() {
    safe(() => Haptics.selectionAsync())
  },

  // Successful state change (claim succeeded, request approved).
  success() {
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success))
  },

  // Cautionary state change (request rejected, confirm-before-destruction).
  warn() {
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning))
  },

  // Confirming a destructive action.
  danger() {
    safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error))
  },

  // Mid-weight feedback for committing an action (Send Request).
  impact() {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium))
  },

  // Light feedback for tapping a primary button.
  tap() {
    safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
  },
}
