import React, { useState, useEffect } from 'react'
import {
  Send,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react'
import { TextInput, TextArea } from './TextInput'
import { Button } from './Buttons'
import type {
  InputCardProps,
  InputCardField,
  InputCardVariant,
} from '../types'

export type {
  InputCardProps,
  InputCardField,
  InputCardVariant,
}

const variantStyles: Record<InputCardVariant, string> = {
  card: 'bg-white dark:bg-[#20243a] rounded-3xl border border-gray/20 shadow-sm p-6 sm:p-8 space-y-6',
  bordered: 'bg-white dark:bg-[#20243a] rounded-2xl border border-gray/20 p-5 sm:p-6 space-y-5',
  embedded: 'bg-white dark:bg-[#1a1d2e] rounded-2xl space-y-6 p-4 sm:p-6',
  flat: 'space-y-6',
}

const colSpanClasses: Record<string, string> = {
  '1': 'col-span-1',
  '2': 'col-span-1 sm:col-span-2',
  '3': 'col-span-1 sm:col-span-2 lg:col-span-3',
  full: 'col-span-full',
}

export const InputCard: React.FC<InputCardProps> = ({
  title,
  subtitle,
  icon,
  iconBgColor = 'bg-orange/15 text-orange dark:bg-orange/25',
  fields = [],
  values: controlledValues,
  onChange: controlledOnChange,
  errors: controlledErrors,
  onSubmit,
  onCancel,
  onReset,
  submitButtonText = 'Submit',
  cancelButtonText = 'Cancel',
  resetButtonText = 'Reset',
  submitIcon = <Send className="w-4 h-4" />,
  showCancel = true,
  showReset = true,
  isLoading = false,
  disabled = false,
  variant = 'card',
  actions,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  alert,
}) => {
  // Initialize internal state for uncontrolled usage
  const [internalValues, setInternalValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    fields.forEach((f) => {
      initial[f.name] = f.defaultValue || f.value || ''
    })
    return initial
  })

  const [internalErrors, setInternalErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (fields.length > 0) {
      setInternalValues((prev) => {
        const next = { ...prev }
        fields.forEach((f) => {
          if (next[f.name] === undefined) {
            next[f.name] = f.defaultValue || f.value || ''
          }
        })
        return next
      })
    }
  }, [fields])

  const activeValues = controlledValues !== undefined ? controlledValues : internalValues
  const activeErrors = controlledErrors !== undefined ? controlledErrors : internalErrors

  const handleFieldChange = (name: string, value: string, customOnChange?: (v: string) => void) => {
    if (customOnChange) {
      customOnChange(value)
    }
    if (controlledOnChange) {
      controlledOnChange(name, value)
    } else {
      setInternalValues((prev) => ({ ...prev, [name]: value }))
    }

    if (activeErrors[name]) {
      setInternalErrors((prev) => {
        const updated = { ...prev }
        delete updated[name]
        return updated
      })
    }
  }

  const handleReset = () => {
    if (onReset) {
      onReset()
    } else {
      const resetVals: Record<string, string> = {}
      fields.forEach((f) => {
        resetVals[f.name] = f.defaultValue || ''
      })
      setInternalValues(resetVals)
    }
    setInternalErrors({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic required field validation if fields array is provided
    const newErrors: Record<string, string> = {}
    fields.forEach((f) => {
      if (f.required && !activeValues[f.name]?.trim()) {
        newErrors[f.name] = `${f.label || f.name} is required`
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setInternalErrors(newErrors)
      return
    }

    if (onSubmit) {
      onSubmit(e, activeValues)
    }
  }

  const hasHeader = Boolean(title || subtitle || icon || (showCancel && onCancel))

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {/* Header Slot (Changable Heading & Icon) */}
      {hasHeader && (
        <div
          className={`flex items-center justify-between border-b border-gray/15 pb-4 ${headerClassName}`}
        >
          <div className="flex items-center gap-3">
            {icon && (
              <div
                className={`p-2.5 rounded-2xl flex items-center justify-center shrink-0 ${iconBgColor}`}
              >
                {icon}
              </div>
            )}
            <div>
              {title && (
                <h3 className="text-lg sm:text-xl font-bold text-darkblue dark:text-offwhite leading-tight">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs sm:text-sm text-gray mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          {showCancel && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="p-2 rounded-xl text-gray hover:text-darkblue dark:hover:text-offwhite hover:bg-gray/10 dark:hover:bg-gray/20 transition-colors focus:outline-none"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Alert Notification Slot */}
      {alert && (
        <div
          className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-semibold animate-in fade-in border ${
            alert.type === 'success'
              ? 'bg-green-500/15 border-green-500/25 text-green-700 dark:text-green-300'
              : alert.type === 'error'
              ? 'bg-red-500/15 border-red-500/25 text-red-700 dark:text-red-300'
              : 'bg-lightblue/15 border-lightblue/25 text-lightblue dark:text-lightblue'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Form Content */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Dynamic Fields Grid or Children Slot */}
        <div className={bodyClassName}>
          {fields.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((f) => {
                const fieldValue = activeValues[f.name] || ''
                const fieldError = f.error || activeErrors[f.name]
                const colSpanClass = colSpanClasses[String(f.colSpan || '1')] || 'col-span-1'

                if (f.type === 'textarea') {
                  return (
                    <div key={f.name} className={colSpanClass}>
                      <TextArea
                        label={f.label}
                        placeholder={f.placeholder}
                        value={fieldValue}
                        onChange={(e) => handleFieldChange(f.name, e.target.value, f.onChange)}
                        error={fieldError}
                        helperText={f.helperText}
                        rows={f.rows || 3}
                        required={f.required}
                        disabled={f.disabled || disabled}
                        fullWidth
                        className={f.className}
                      />
                    </div>
                  )
                }

                if (f.type === 'select') {
                  return (
                    <div key={f.name} className={`flex flex-col gap-1.5 ${colSpanClass}`}>
                      {f.label && (
                        <label className="text-xs font-semibold text-darkblue dark:text-offwhite">
                          {f.label} {f.required ? '*' : ''}
                        </label>
                      )}
                      <div className="relative flex items-center">
                        {f.leftIcon && (
                          <div className="absolute left-3 flex items-center justify-center pointer-events-none text-gray">
                            {f.leftIcon}
                          </div>
                        )}
                        <select
                          value={fieldValue}
                          onChange={(e) => handleFieldChange(f.name, e.target.value, f.onChange)}
                          disabled={f.disabled || disabled}
                          className={`w-full py-2.5 text-sm rounded-xl border border-gray/30 bg-white dark:bg-[#23273e] text-darkblue dark:text-offwhite focus:border-lightblue focus:ring-2 focus:ring-lightblue/25 focus:outline-none transition-all ${
                            f.leftIcon ? 'pl-10' : 'pl-3.5'
                          } pr-8 ${f.className || ''}`}
                        >
                          {f.options?.map((opt) => {
                            const val = typeof opt === 'string' ? opt : opt.value
                            const lab = typeof opt === 'string' ? opt : opt.label
                            return (
                              <option key={val} value={val}>
                                {lab}
                              </option>
                            )
                          })}
                        </select>
                      </div>
                      {fieldError && (
                        <p className="text-xs text-orange font-medium">{fieldError}</p>
                      )}
                    </div>
                  )
                }

                return (
                  <div key={f.name} className={colSpanClass}>
                    <TextInput
                      type={f.type || 'text'}
                      label={f.label}
                      placeholder={f.placeholder}
                      value={fieldValue}
                      onChange={(e) => handleFieldChange(f.name, e.target.value, f.onChange)}
                      error={fieldError}
                      helperText={f.helperText}
                      leftIcon={f.leftIcon}
                      rightIcon={f.rightIcon}
                      required={f.required}
                      disabled={f.disabled || disabled}
                      fullWidth
                      className={f.className}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            children
          )}
        </div>

        {/* Footer Actions Slot */}
        <div
          className={`flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-gray/15 ${footerClassName}`}
        >
          {showReset ? (
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={handleReset}
              disabled={disabled || isLoading}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              {resetButtonText}
            </Button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {actions ? (
              actions
            ) : (
              <>
                {showCancel && onCancel && (
                  <Button
                    variant="outline"
                    size="md"
                    type="button"
                    onClick={onCancel}
                    disabled={disabled || isLoading}
                  >
                    {cancelButtonText}
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="md"
                  type="submit"
                  isLoading={isLoading}
                  disabled={disabled}
                  leftIcon={submitIcon}
                >
                  {submitButtonText}
                </Button>
              </>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default InputCard
