import { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-caption text-text-secondary font-medium">{label}</label>
      )}
      <input
        className={`px-2 py-1.5 text-body bg-background-elevated border border-border rounded-md
          placeholder:text-text-tertiary
          focus:outline-none focus:ring-2 focus:ring-accent-blue/40 focus:border-accent-blue
          ${className}`}
        {...props}
      />
    </div>
  )
}
