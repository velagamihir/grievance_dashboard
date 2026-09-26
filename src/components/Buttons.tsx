import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import type { ButtonProps, ButtonVariant, ButtonSize } from '../types'

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-orange text-offwhite hover:bg-orange/90 focus-visible:ring-orange/30 shadow-sm',
  secondary:
    'bg-lightblue text-offwhite hover:bg-lightblue/90 focus-visible:ring-lightblue/30 shadow-sm',
  dark:
    'bg-darkblue text-offwhite hover:bg-darkblue/90 focus-visible:ring-darkblue/30 shadow-sm dark:bg-offwhite dark:text-darkblue dark:hover:bg-offwhite/90 dark:focus-visible:ring-offwhite/30',
  outline:
    'border border-gray/30 text-darkblue hover:bg-gray/10 hover:border-gray/50 focus-visible:ring-gray/30 dark:border-gray/40 dark:text-offwhite dark:hover:bg-gray/20',
  ghost:
    'text-darkblue hover:bg-gray/10 focus-visible:ring-gray/30 dark:text-offwhite dark:hover:bg-gray/20',
}

const sizeStyles: Record<ButtonSize, { button: string; icon: string }> = {
  sm: {
    button: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    icon: 'h-3.5 w-3.5',
  },
  md: {
    button: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    icon: 'h-4 w-4',
  },
  lg: {
    button: 'px-5.5 py-3 text-base rounded-xl gap-2.5',
    icon: 'h-5 w-5',
  },
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const { button: sizeClass, icon: iconSizeClass } = sizeStyles[size]
    const variantClass = variantStyles[variant]

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-150 outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] ${variantClass} ${sizeClass} ${
          fullWidth ? 'w-full' : 'w-auto'
        } ${className}`}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className={`animate-spin ${iconSizeClass}`} />
            <span>{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className={`inline-flex shrink-0 ${iconSizeClass}`}>{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className={`inline-flex shrink-0 ${iconSizeClass}`}>{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export const Buttons = Button
