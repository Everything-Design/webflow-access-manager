import { Platform, type TextStyle, type ViewStyle } from 'react-native'

// 4pt grid. Pull everything from here so screens stop diverging on whitespace.
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const

export type Spacing = keyof typeof spacing

// Corner radii. iOS continuous corners can't be matched by RN, but these read close.
export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const

export type Radius = keyof typeof radius

// Soft iOS-style shadows. Android uses elevation because tiny shadowOpacity values
// render as nothing on Android — falling back to elevation gives a visible-but-subtle lift.
export const shadow: Record<'none' | 'card' | 'modal', ViewStyle> = {
  none: {},
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 1 },
    },
    default: { elevation: 1 },
  })!,
  modal: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOpacity: 0.18,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 8 },
    },
    default: { elevation: 12 },
  })!,
}

// Apple-aligned type ramp (subset of HIG — we don't need all 11). lineHeight is the
// single most-impactful upgrade vs the previous codebase, which had none.
export const type: Record<string, TextStyle> = {
  largeTitle:  { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: 0.37 },
  title1:      { fontSize: 28, lineHeight: 34, fontWeight: '600', letterSpacing: 0.36 },
  title2:      { fontSize: 22, lineHeight: 28, fontWeight: '600', letterSpacing: 0.35 },
  title3:      { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0.38 },
  headline:    { fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.41 },
  body:        { fontSize: 17, lineHeight: 22, fontWeight: '400', letterSpacing: -0.41 },
  callout:     { fontSize: 16, lineHeight: 21, fontWeight: '400', letterSpacing: -0.32 },
  subheadline: { fontSize: 15, lineHeight: 20, fontWeight: '400', letterSpacing: -0.24 },
  footnote:    { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: -0.08 },
  caption1:    { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: 0 },
  caption2:    { fontSize: 11, lineHeight: 13, fontWeight: '500', letterSpacing: 0.07 },
}

export type TypeVariant = keyof typeof type
