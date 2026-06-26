import { cn } from '@/utils/cn'

const variantClasses = {
  default: 'bg-slate-700 text-slate-200',
  primary: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  success: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  warning: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
  info: 'bg-sky-500/20 text-sky-300 border border-sky-500/30',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

/**
 * Badge component for status labels and tags.
 *
 * @param {Object} props
 * @param {'default'|'primary'|'success'|'warning'|'danger'|'info'} [props.variant='default']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.dot=false] - Show a colored dot before the label
 *
 * @example
 * <Badge variant="success">Completado</Badge>
 * <Badge variant="warning" dot>En espera</Badge>
 */
function Badge({ children, variant = 'default', size = 'md', dot = false, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          aria-hidden="true"
          className={cn('h-1.5 w-1.5 rounded-full', {
            'bg-slate-400': variant === 'default',
            'bg-rose-400': variant === 'primary',
            'bg-emerald-400': variant === 'success',
            'bg-amber-400': variant === 'warning',
            'bg-red-400': variant === 'danger',
            'bg-sky-400': variant === 'info',
          })}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
