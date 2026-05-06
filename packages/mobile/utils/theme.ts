import { useColorScheme } from 'react-native'

const light = {
  bg: '#f6f6f6',
  bgElevated: '#ffffff',
  text: '#1d1d1f',
  textSecondary: '#86868b',
  textTertiary: '#aeaeb2',
  border: 'rgba(0,0,0,0.06)',
  accent: '#007AFF',
  green: '#34C759',
  red: '#FF3B30',
  orange: '#FF9500',
  purple: '#AF52DE',
  yellow: '#FFCC00',
  cardHighlightOrange: '#FFF3E0',
  inputBg: '#ffffff',
}

const dark = {
  bg: '#1c1c1e',
  bgElevated: '#2c2c2e',
  text: '#f5f5f7',
  textSecondary: '#98989d',
  textTertiary: '#636366',
  border: 'rgba(255,255,255,0.08)',
  accent: '#0A84FF',
  green: '#30D158',
  red: '#FF453A',
  orange: '#FF9F0A',
  purple: '#BF5AF2',
  yellow: '#FFD60A',
  cardHighlightOrange: '#3a2a10',
  inputBg: '#3a3a3c',
}

export type Theme = typeof light

export function useTheme(): Theme {
  const scheme = useColorScheme()
  return scheme === 'dark' ? dark : light
}
