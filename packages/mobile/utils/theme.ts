import { useColorScheme } from 'react-native'

// Extended Apple-aligned palette. New surfaces (bgGrouped, separator, fills) follow iOS
// grouped-list conventions so screens that pair sections + cards read as native.
const light = {
  // Backgrounds
  bg: '#f6f6f6',
  bgGrouped: '#F2F2F7',
  bgElevated: '#ffffff',
  bgGroupedElevated: '#ffffff',
  cardHighlightOrange: '#FFF3E0',
  inputBg: '#ffffff',

  // Text
  text: '#1d1d1f',
  textSecondary: '#86868b',
  textTertiary: '#aeaeb2',

  // Lines
  border: 'rgba(0,0,0,0.06)',
  separator: 'rgba(60,60,67,0.12)',

  // Brand + status
  accent: '#007AFF',
  accentMuted: 'rgba(0,122,255,0.10)',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  purple: '#AF52DE',
  yellow: '#FFCC00',

  // Semantic tints (12% alpha of each status hue) — for tag/chip/card-tone bgs
  successTint: 'rgba(52,199,89,0.12)',
  warnTint: 'rgba(255,149,0,0.12)',
  dangerTint: 'rgba(255,59,48,0.12)',
  accentTint: 'rgba(0,122,255,0.12)',
  purpleTint: 'rgba(175,82,222,0.12)',
  neutralTint: 'rgba(120,120,128,0.12)',

  // System fills (iOS uses these for tag bgs, segmented controls, etc.)
  fill1: 'rgba(120,120,128,0.12)',
  fill2: 'rgba(120,120,128,0.16)',
  fill3: 'rgba(120,120,128,0.20)',
}

const dark = {
  bg: '#1c1c1e',
  bgGrouped: '#000000',
  bgElevated: '#2c2c2e',
  bgGroupedElevated: '#1C1C1E',
  cardHighlightOrange: '#3a2a10',
  inputBg: '#3a3a3c',

  text: '#f5f5f7',
  textSecondary: '#98989d',
  textTertiary: '#636366',

  border: 'rgba(255,255,255,0.08)',
  separator: 'rgba(84,84,88,0.32)',

  accent: '#0A84FF',
  accentMuted: 'rgba(10,132,255,0.15)',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  purple: '#BF5AF2',
  yellow: '#FFD60A',

  successTint: 'rgba(48,209,88,0.18)',
  warnTint: 'rgba(255,159,10,0.18)',
  dangerTint: 'rgba(255,69,58,0.18)',
  accentTint: 'rgba(10,132,255,0.18)',
  purpleTint: 'rgba(191,90,242,0.18)',
  neutralTint: 'rgba(120,120,128,0.24)',

  fill1: 'rgba(120,120,128,0.24)',
  fill2: 'rgba(120,120,128,0.32)',
  fill3: 'rgba(120,120,128,0.40)',
}

export type Theme = typeof light

export function useTheme(): Theme {
  const scheme = useColorScheme()
  return scheme === 'dark' ? dark : light
}
