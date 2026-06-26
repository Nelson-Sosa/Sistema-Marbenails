import { cn } from '@/utils/cn'
import { Loader2 } from 'lucide-react'

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

/**
 * Accessible animated spinner component.
 *
 * @param {Object} props
 * @param {'xs'|'sm'|'md'|'lg'|'xl'} [props.size='md']
 * @param {string} [props.className]
 * @param {string} [props.label='Cargando...'] - Screen reader label
 */
function Spinner({ size = 'md', className, label = 'Cargando...' }) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2
        className={cn('animate-spin text-rose-500', sizeClasses[size], className)}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}

export default Spinner
