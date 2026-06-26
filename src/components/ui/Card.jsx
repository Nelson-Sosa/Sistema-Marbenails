import { cn } from '@/utils/cn'

/**
 * Card component with header, body, and footer slot support.
 * Provides a consistent glass-morphism surface for content blocks.
 *
 * @example
 * <Card>
 *   <Card.Header title="Próximos turnos" action={<Button>Ver todos</Button>} />
 *   <Card.Body>...</Card.Body>
 * </Card>
 */
function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm',
        'shadow-lg shadow-slate-950/50',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * Card.Header — Title + optional action slot
 */
Card.Header = function CardHeader({ title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4',
        className
      )}
    >
      <div>
        {title && <h3 className="font-semibold text-white">{title}</h3>}
        {description && (
          <p className="mt-0.5 text-sm text-slate-400">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

/**
 * Card.Body — Main content area with default padding
 */
Card.Body = function CardBody({ children, className, noPadding = false }) {
  return (
    <div className={cn(!noPadding && 'px-5 py-4', className)}>{children}</div>
  )
}

/**
 * Card.Footer — Footer area with border separator
 */
Card.Footer = function CardFooter({ children, className }) {
  return (
    <div
      className={cn(
        'border-t border-slate-800 px-5 py-3',
        className
      )}
    >
      {children}
    </div>
  )
}

export default Card
