import { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import Spinner from '@/components/ui/Spinner'

/**
 * Variant → base class mapping
 */
const variantClasses = {
  primary:
    'bg-brand-primary text-white hover:bg-brand-primary-hover active:bg-brand-primary-hover shadow-sm shadow-brand-primary/20',
  secondary:
    'bg-brand-card text-brand-text hover:bg-brand-pastel/30 active:bg-brand-pastel/50 border border-brand-pastel',
  outline:
    'border border-brand-primary text-brand-primary hover:bg-brand-primary/5 active:bg-brand-primary/10',
  ghost:
    'text-brand-text-muted hover:bg-brand-pastel/30 hover:text-brand-primary active:bg-brand-pastel/50',
  danger:
    'bg-red-500/90 text-white hover:bg-red-600 active:bg-red-700 shadow-sm shadow-red-500/10',
  success:
    'bg-brand-success text-white hover:bg-emerald-600 active:bg-emerald-700',
}

const sizeClasses = {
  xs: 'min-h-[36px] h-7 px-2.5 text-xs gap-1.5',
  sm: 'min-h-[40px] h-8 px-3 text-sm gap-1.5',
  md: 'min-h-[44px] h-9 px-4 text-sm gap-2',
  lg: 'min-h-[48px] h-10 px-5 text-base gap-2',
  xl: 'min-h-[52px] h-12 px-6 text-base gap-2.5',
}

const iconSizeMap = {
  xs: 'xs',
  sm: 'xs',
  md: 'sm',
  lg: 'sm',
  xl: 'md',
}

/**
 * Reusable Button component with multiple variants, sizes, loading state,
 * and icon support.
 *
 * @example
 * <Button variant="primary" size="md" loading={isSubmitting}>
 *   Guardar
 * </Button>
 *
 * <Button variant="outline" leftIcon={<Plus />}>
 *   Nuevo turno
 * </Button>
 */
const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    leftIcon,
    rightIcon,
    fullWidth = false,
    className,
    type = 'button',
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      type={type}
      disabled={isDisabled}
      aria-busy={loading}
      className={cn(
        // Base styles
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg',
        'disabled:pointer-events-none disabled:opacity-50',
        // Variants & sizes
        variantClasses[variant],
        sizeClasses[size],
        // Full width
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={iconSizeMap[size]} label="Cargando..." />
      ) : (
        leftIcon && <span aria-hidden="true">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
    </button>
  )
})

export default Button
