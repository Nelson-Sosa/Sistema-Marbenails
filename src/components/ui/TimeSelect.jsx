import { forwardRef, useEffect, useState } from 'react'
import { cn } from '@/utils/cn'

/**
 * TimeSelect — Selector de hora personalizado con dos <select> (hora y minuto).
 * Evita el reloj nativo de Android que se desborda fuera de pantalla en modales.
 *
 * Compatible con React Hook Form usando `Controller`:
 *   <Controller name="time" control={control} render={({ field }) => <TimeSelect {...field} />} />
 *
 * `value`    — string "HH:mm" (controlado por RHF)
 * `onChange` — recibe directamente el string "HH:mm" (como espera Controller)
 * `onBlur`   — se llama en el blur de cualquiera de los selects
 */
const TimeSelect = forwardRef(function TimeSelect(
  {
    label,
    error,
    value,
    onChange,
    onBlur,
    name,
    id,
    startHour = 7,
    endHour = 20,
    stepMinutes = 15,
    containerClassName,
    disabled,
  },
  ref
) {
  const inputId = id || name

  // Parse "HH:mm" → { hour, minute }
  const parseTime = (t) => {
    if (!t || typeof t !== 'string') return { hour: '10', minute: '00' }
    const [h = '10', m = '00'] = t.split(':')
    return { hour: h.padStart(2, '0'), minute: m.padStart(2, '0') }
  }

  const parsed = parseTime(value)
  const [hour, setHour] = useState(parsed.hour)
  const [minute, setMinute] = useState(parsed.minute)

  // Sync controlled value changes from React Hook Form (e.g. reset())
  useEffect(() => {
    const p = parseTime(value)
    setHour(p.hour)
    setMinute(p.minute)
  }, [value])

  const emit = (h, m) => {
    if (onChange) onChange(`${h}:${m}`)
  }

  const handleHourChange = (e) => {
    const h = e.target.value
    setHour(h)
    emit(h, minute)
  }

  const handleMinuteChange = (e) => {
    const m = e.target.value
    setMinute(m)
    emit(hour, m)
  }

  // Generate hour options
  const hourOptions = []
  for (let h = startHour; h <= endHour; h++) {
    hourOptions.push(String(h).padStart(2, '0'))
  }

  // Generate minute options
  const minuteOptions = []
  for (let m = 0; m < 60; m += stepMinutes) {
    minuteOptions.push(String(m).padStart(2, '0'))
  }

  const selectClass = cn(
    'rounded-lg border bg-brand-bg px-3 py-2.5 text-base sm:text-sm text-brand-text',
    'w-full transition-colors duration-200 appearance-none cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 focus:ring-offset-brand-bg',
    error
      ? 'border-red-500 focus:ring-red-500'
      : 'border-brand-pastel hover:border-brand-primary/50 focus:border-brand-primary',
    'disabled:cursor-not-allowed disabled:opacity-50'
  )

  return (
    <div className={cn('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={`${inputId}-hour`} className="text-sm font-medium text-brand-text-muted">
          {label}
        </label>
      )}

      {/* Hidden input for programmatic access / ref (RHF) */}
      <input
        ref={ref}
        type="hidden"
        name={name}
        id={inputId}
        value={`${hour}:${minute}`}
        readOnly
      />

      <div className="flex items-center gap-2">
        {/* Hour select */}
        <div className="relative flex-1">
          <select
            id={`${inputId}-hour`}
            value={hour}
            onChange={handleHourChange}
            onBlur={onBlur}
            disabled={disabled}
            aria-label="Hora"
            className={cn(selectClass, 'pr-8')}
          >
            {hourOptions.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
          {/* Custom chevron */}
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted text-xs leading-none">
            ▾
          </span>
        </div>

        <span className="text-xl font-bold text-brand-text-muted select-none">:</span>

        {/* Minute select */}
        <div className="relative flex-1">
          <select
            id={`${inputId}-minute`}
            value={minute}
            onChange={handleMinuteChange}
            onBlur={onBlur}
            disabled={disabled}
            aria-label="Minutos"
            className={cn(selectClass, 'pr-8')}
          >
            {minuteOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted text-xs leading-none">
            ▾
          </span>
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1 text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  )
})

export default TimeSelect
