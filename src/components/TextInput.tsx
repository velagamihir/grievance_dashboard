import { forwardRef } from 'react'
import type { TextInputProps, InputSize } from '../types'

const sizeStyles: Record<InputSize, { input: string; icon: string }> = {
  sm: {
    input: 'px-3 py-1.5 text-xs rounded-lg',
    icon: 'h-4 w-4',
  },
  md: {
    input: 'px-3.5 py-2.5 text-sm rounded-xl',
    icon: 'h-5 w-5',
  },
  lg: {
    input: 'px-4 py-3 text-base rounded-xl',
    icon: 'h-6 w-6',
  },
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      size = 'md',
      fullWidth = false,
      containerClassName = '',
      className = '',
      disabled = false,
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    const { input: sizeClass, icon: iconSizeClass } = sizeStyles[size]

    return (
      <div className={`flex flex-col gap-1.5 ${fullWidth ? 'w-full' : 'w-auto'} ${containerClassName}`}>
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold text-darkblue dark:text-offwhite transition-colors"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className={`absolute left-3 flex items-center justify-center pointer-events-none text-gray ${iconSizeClass}`}>
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`w-full outline-none transition-all duration-150 border bg-white dark:bg-[#23273e] text-darkblue dark:text-offwhite placeholder:text-gray/60 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClass} ${
              leftIcon ? 'pl-10' : ''
            } ${rightIcon ? 'pr-10' : ''} ${
              error
                ? 'border-orange focus:ring-2 focus:ring-orange/25'
                : 'border-gray/30 hover:border-gray/60 focus:border-lightblue focus:ring-2 focus:ring-lightblue/25 dark:border-gray/40 dark:hover:border-gray/60 dark:focus:border-lightblue'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className={`absolute right-3 flex items-center justify-center pointer-events-none text-gray ${iconSizeClass}`}>
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-orange font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-gray">{helperText}</p>
        ) : null}
      </div>
    )
  }
)

TextInput.displayName = 'TextInput'
