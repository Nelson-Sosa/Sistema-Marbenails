import { forwardRef } from 'react'
import { cn } from '@/utils/cn'
import Spinner from '@/components/ui/Spinner'

/**
 * Variant → base class mapping
 */
const variantClasses = {
  primary:
    'bg-gradient-to-r from-rose-500/90 to-violet-500/90 text-white hover:from-rose-600 hover:to-violet-600 active:from-rose-700 active:to-violet-700 shadow-sm shadow-rose-500/10',
  secondary:
    'bg-slate-800/50 text-slate-200 hover:bg-slate-700/80 active:bg-slate-700 border border-slate-700/50 backdrop-blur-sm',
  outline:
    'border border-rose-500/40 text-rose-300 hover:bg-rose-500/8 active:bg-rose-500/15',
  ghost:
    'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 active:bg-white/[0.06]',
  danger:
    'bg-red-500/90 text-white hover:bg-red-600 active:bg-red-700 shadow-sm shadow-red-500/10',
  success:
    'bg-emerald-500/90 text-white hover:bg-emerald-600 active:bg-emerald-700',
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
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
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
