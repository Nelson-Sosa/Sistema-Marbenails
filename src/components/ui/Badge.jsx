import { cn } from '@/utils/cn'

const variantClasses = {
  default: 'bg-brand-pastel/30 text-brand-text-muted',
  primary: 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20',
  success: 'bg-brand-success/10 text-brand-success border border-brand-success/20',
  warning: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-600 border border-red-500/20',
  info: 'bg-sky-500/10 text-sky-600 border border-sky-500/20',
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
            'bg-brand-text-muted': variant === 'default',
            'bg-brand-primary': variant === 'primary',
            'bg-brand-success': variant === 'success',
            'bg-amber-500': variant === 'warning',
            'bg-red-500': variant === 'danger',
            'bg-sky-500': variant === 'info',
          })}
        />
      )}
      {children}
    </span>
  )
}

export default Badge
