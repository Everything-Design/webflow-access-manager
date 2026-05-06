interface StatusDotProps {
  color: 'green' | 'red' | 'orange' | 'yellow' | 'purple' | 'blue' | 'gray'
  size?: 'sm' | 'md' | 'lg'
}

const colorMap = {
  green: 'bg-accent-green',
  red: 'bg-accent-red',
  orange: 'bg-accent-orange',
  yellow: 'bg-accent-yellow',
  purple: 'bg-accent-purple',
  blue: 'bg-accent-blue',
  gray: 'bg-text-tertiary',
}

const sizeMap = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
}

export function StatusDot({ color, size = 'md' }: StatusDotProps) {
  return <span className={`inline-block rounded-full ${colorMap[color]} ${sizeMap[size]}`} />
}
