import { forwardRef } from 'react'
import { cn } from '@/utils/cn'

/**
 * Reusable Input component with label, helper text, error state, and icon support.
 * Designed to work seamlessly with React Hook Form via ref forwarding.
 *
 * @example
 * // With React Hook Form
 * <Input
 *   label="Email"
 *   type="email"
 *   error={errors.email?.message}
 *   {...register('email')}
 * />
 */
const Input = forwardRef(function Input(
  {
    label,
    helperText,
    error,
    leftIcon,
    rightIcon,
    id,
    className,
    containerClassName,
    required,
    ...props
  },
  ref
) {
  const inputId = id || props.name

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-brand-text-muted"
        >
          {label}
          {required && (
            <span className="ml-1 text-brand-primary" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      {/* Input wrapper */}
      <div className="relative flex items-center">
        {/* Left icon */}
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 text-brand-text-muted">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          className={cn(
            'w-full rounded-lg border bg-brand-bg px-3 py-2.5 text-base sm:text-sm text-brand-text',
            'placeholder:text-brand-text-muted',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 focus:ring-offset-brand-bg',
            // Border state
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-brand-pastel hover:border-brand-primary/50 focus:border-brand-primary',
            // Icon padding
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />

        {/* Right icon */}
        {rightIcon && (
          <div className="absolute right-3 text-brand-text-muted">{rightIcon}</div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="flex items-center gap-1 text-xs text-red-400"
        >
          {error}
        </p>
      )}

      {/* Helper text */}
      {!error && helperText && (
        <p id={`${inputId}-helper`} className="text-xs text-brand-text-muted">
          {helperText}
        </p>
      )}
    </div>
  )
})

export default Input
