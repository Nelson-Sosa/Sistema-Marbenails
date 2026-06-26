import { useEffect, useRef, useState } from 'react'
import { cn } from '@/utils/cn'

function ProgressBar({ value = 0, max = 100, className, barClassName }) {
  const [width, setWidth] = useState(0)
  const ref = useRef(null)

  useEffect(() => {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
    requestAnimationFrame(() => setWidth(pct))
  }, [value, max])

  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn('h-3 w-full overflow-hidden rounded-full bg-white/[0.06]', className)}
    >
      <div
        className={cn(
          'h-full rounded-full bg-gradient-to-r from-rose-500/70 to-pink-500/70 transition-all duration-700 ease-out',
          barClassName
        )}
        style={{ width: `${width}%` }}
      />
    </div>
  )
}

export default ProgressBar
