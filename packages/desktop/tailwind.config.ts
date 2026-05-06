import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // SwiftUI-inspired color tokens
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          elevated: 'var(--bg-elevated)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          blue: '#007AFF',
          green: '#34C759',
          red: '#FF3B30',
          orange: '#FF9500',
          purple: '#AF52DE',
          yellow: '#FFCC00',
        },
        border: 'var(--border-color)',
        divider: 'var(--divider-color)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        'title2': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'headline': ['15px', { lineHeight: '20px', fontWeight: '600' }],
        'subheadline': ['13px', { lineHeight: '18px', fontWeight: '500' }],
        'body': ['13px', { lineHeight: '18px', fontWeight: '400' }],
        'caption': ['11px', { lineHeight: '14px', fontWeight: '400' }],
        'caption2': ['10px', { lineHeight: '13px', fontWeight: '400' }],
      },
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'full': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 3px rgba(0, 0, 0, 0.06)',
        'medium': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'popover': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
      },
    },
  },
  plugins: [],
}

export default config
