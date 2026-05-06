import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  highlight?: 'orange' | 'blue' | 'green' | 'red' | null
}

const highlightMap = {
  orange: 'bg-accent-orange/10',
  blue: 'bg-accent-blue/10',
  green: 'bg-accent-green/10',
  red: 'bg-accent-red/10',
}

export function Card({ highlight, className = '', children, ...props }: CardProps) {
  const bg = highlight ? highlightMap[highlight] : 'bg-background-elevated'
  return (
    <div
      className={`p-3 rounded-md ${bg} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
