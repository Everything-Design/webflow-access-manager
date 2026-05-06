import { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-accent-blue/40 disabled:opacity-40 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-accent-blue text-white hover:bg-accent-blue/90 active:bg-accent-blue/80',
    secondary:
      'bg-background-elevated text-text-primary border border-border hover:bg-background-secondary active:bg-background-primary',
    destructive:
      'bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20 active:bg-accent-red/30',
  }

  const sizes = {
    sm: 'text-caption px-2 py-1 gap-1',
    md: 'text-body px-3 py-1.5 gap-1.5',
    lg: 'text-subheadline px-4 py-2 gap-2',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        children
      )}
    </button>
  )
}
