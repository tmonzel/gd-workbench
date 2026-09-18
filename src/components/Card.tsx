import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react'

type CardProps<T extends ElementType = 'div'> = {
  as?: T
  size?: 'sm' | 'md' | 'lg'
  variant?: 'elevated' | 'outline' | 'ghost' | 'filled'
  children: ReactNode
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children' | 'className'> & {
    className?: string
  }

const sizeClasses = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

const variantClasses = {
  elevated: 'border border-neutral-800/80 bg-neutral-950/80 shadow-lg shadow-black/20',
  outline: 'border border-neutral-700/80 bg-transparent',
  ghost: 'border border-transparent bg-transparent',
  filled: 'border border-neutral-800 bg-neutral-900/80',
}

export function Card<T extends ElementType = 'div'>({
  as,
  size = 'md',
  variant = 'elevated',
  className = '',
  children,
  ...props
}: CardProps<T>) {
  const Component = as ?? 'div'
  return (
    <Component
      className={`rounded-lg text-neutral-100 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  )
}
