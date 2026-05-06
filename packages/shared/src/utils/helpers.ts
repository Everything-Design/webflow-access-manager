// Cross-platform UUID — works in Electron, React Native, and web
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().toUpperCase()
  }
  // Fallback for React Native / older engines
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  }).toUpperCase()
}

// Firebase timestamps are in seconds since epoch
export function formatDuration(sinceSecs: number | undefined): string {
  if (!sinceSecs) return ''
  const interval = Date.now() / 1000 - sinceSecs
  if (interval < 0) return '0m'
  const hours = Math.floor(interval / 3600)
  const minutes = Math.floor((interval % 3600) / 60)

  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Bug #4 fix: handles both "account-1767873573791" and "account1" formats
export function getAccountDisplayName(id: string, label?: string): string {
  if (label) return label
  const match = id.match(/^account-?(\d+)$/)
  if (match) return `Account ${match[1].length > 6 ? id.slice(-4) : match[1]}`
  return id
}
