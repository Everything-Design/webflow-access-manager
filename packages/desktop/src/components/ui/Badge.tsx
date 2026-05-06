import { ReactNode } from 'react'

interface BadgeProps {
  variant?: 'default' | 'green' | 'red' | 'orange' | 'blue'
  children: ReactNode
}

const variantMap = {
  default: 'bg-background-secondary text-text-secondary',
  green: 'bg-accent-green/10 text-accent-green',
  red: 'bg-accent-red/10 text-accent-red',
  orange: 'bg-accent-orange/10 text-accent-orange',
  blue: 'bg-accent-blue/10 text-accent-blue',
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 text-caption2 font-medium rounded-sm ${variantMap[variant]}`}>
      {children}
    </span>
  )
}
