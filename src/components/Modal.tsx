import React, { useEffect, useCallback } from 'react'
import { X, AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react'
import { Button } from './Buttons'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  iconBgColor?: string
  size?: ModalSize
  children: React.ReactNode
  footer?: React.ReactNode
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  showCloseButton?: boolean
  className?: string
  bodyClassName?: string
  error?: string | null
}

const sizeClasses: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-4xl',
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  iconBgColor = 'bg-lightblue/15 text-lightblue dark:bg-lightblue/25',
  size = 'md',
  children,
  footer,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
  bodyClassName = '',
  error,
}) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose()
      }
    },
    [closeOnEsc, onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkblue/50 dark:bg-black/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={closeOnOverlayClick ? onClose : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-[#1a1d2e] rounded-3xl border border-gray/20 shadow-2xl p-6 sm:p-7 space-y-5 my-8 max-h-[90vh] flex flex-col transition-all duration-200 transform scale-100 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between pb-3.5 border-b border-gray/15 shrink-0">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              {icon && (
                <div className={`p-2.5 rounded-2xl shrink-0 ${iconBgColor}`}>
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <h3 className="font-bold text-lg text-darkblue dark:text-offwhite leading-snug truncate">
                    {title}
                  </h3>
                )}
                {subtitle && (
                  <p className="text-xs text-gray mt-0.5 truncate">{subtitle}</p>
                )}
              </div>
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-gray hover:text-darkblue dark:hover:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-colors shrink-0 ml-2 focus:outline-none"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 flex items-center gap-2 shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className={`overflow-y-auto flex-1 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="pt-3 border-t border-gray/15 shrink-0 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

export interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: React.ReactNode
  subtitle?: React.ReactNode
  message?: React.ReactNode
  details?: React.ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary' | 'info'
  isLoading?: boolean
  error?: string | null
  icon?: React.ReactNode
}

const variantStyles = {
  danger: {
    iconBg: 'bg-red-500/15 text-red-600 dark:text-red-400',
    icon: <AlertTriangle className="w-6 h-6" />,
    btnClass: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
  },
  warning: {
    iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    icon: <AlertCircle className="w-6 h-6" />,
    btnClass: 'bg-amber-600 hover:bg-amber-700 text-white border-transparent',
  },
  primary: {
    iconBg: 'bg-lightblue/15 text-lightblue',
    icon: <CheckCircle2 className="w-6 h-6" />,
    btnClass: 'bg-darkblue hover:bg-darkblue/90 text-offwhite',
  },
  info: {
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    icon: <Info className="w-6 h-6" />,
    btnClass: 'bg-blue-600 hover:bg-blue-700 text-white border-transparent',
  },
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle = 'This action cannot be undone.',
  message,
  details,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  error,
  icon,
}) => {
  const currentVariant = variantStyles[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      error={error}
      showCloseButton={false}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3.5">
          <div className={`p-3 rounded-2xl shrink-0 ${currentVariant.iconBg}`}>
            {icon || currentVariant.icon}
          </div>
          <div>
            <h3 className="font-bold text-lg text-darkblue dark:text-offwhite leading-tight">
              {title}
            </h3>
            {subtitle && <p className="text-xs text-gray mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {message && (
          <div className="text-xs sm:text-sm text-darkblue/85 dark:text-offwhite/85">
            {message}
          </div>
        )}

        {details && (
          <div className="p-3.5 rounded-2xl bg-offwhite dark:bg-[#151726] border border-gray/20 text-xs space-y-1">
            {details}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            className={currentVariant.btnClass}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default Modal
