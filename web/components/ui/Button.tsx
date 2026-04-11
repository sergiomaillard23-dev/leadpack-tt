import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'pro' | 'danger' | 'success' | 'ghost'
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  icon?:      ReactNode
  loading?:   boolean
  fullWidth?: boolean
}

const VARIANT: Record<ButtonVariant, string> = {
  primary:   'btn-glow-indigo text-white',
  secondary: 'btn-ghost',
  pro:       'btn-glow-amber font-bold',
  danger:    'btn-glow-red text-white',
  success:   'btn-glow-green text-white',
  ghost:     'btn-ghost',
}

const SIZE: Record<ButtonSize, string> = {
  xs: 'px-3 py-1.5 text-xs rounded-lg',
  sm: 'px-4 py-2 text-sm rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = 'primary', size = 'md', icon, loading, fullWidth, className = '', children, disabled, ...props },
    ref
  ) => (
    <button
      ref={ref}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold select-none cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {icon && (
        <span
          className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-md"
          style={{ background: 'rgba(255,255,255,0.14)' }}
        >
          {icon}
        </span>
      )}
      {loading ? (
        <>
          <svg className="animate-spin w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {children}
        </>
      ) : children}
    </button>
  )
)
Button.displayName = 'Button'
