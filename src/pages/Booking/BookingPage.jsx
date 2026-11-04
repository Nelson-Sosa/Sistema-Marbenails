import { useState, useMemo, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { startOfDay } from 'date-fns'
import {
  CalendarPlus,
  Scissors,
  CheckCircle,
  RefreshCw,
  ArrowRight,
  ChevronRight,
} from 'lucide-react'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useServices } from '@/hooks/useServices'
import { useActiveCategories } from '@/hooks/useServiceCategories'
import { useScheduleSettings } from '@/hooks/useScheduleSettings'
import { formatCurrency } from '@/utils/formatters'
import { ROUTES } from '@/routes/routes'
import { cn } from '@/utils/cn'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import WeekCalendarPicker from './components/WeekCalendarPicker'
import TimeSlotGrid from './components/TimeSlotGrid'
import BookingConfirmation from './components/BookingConfirmation'

export default function BookingPage() {
  usePageTitle('Reservar Turno')
  const location = useLocation()
  const navigate = useNavigate()

  const { data: services = [], isLoading: loadingServices } = useServices()
  const { data: categories = [] } = useActiveCategories()
  const { data: settings, isLoading: loadingSettings } = useScheduleSettings()

  // Selected states
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [selectedServiceId, setSelectedServiceId] = useState(
    () => location.state?.selectedServiceId || null
  )
  // Default to today so a day of the week is already selected by default
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))
  const [selectedTime, setSelectedTime] = useState(null)

  // Booking success result state
  const [confirmedBooking, setConfirmedBooking] = useState(null)

  // Ref to automatically scroll to confirmation section when a time is selected
  const confirmationRef = useRef(null)

  // Auto-scroll to confirmation section when time is chosen
  // On mobile (< 640px) use 'center' so the full card is visible and not clipped at the top
  useEffect(() => {
    if (selectedTime && confirmationRef.current) {
      const timer = setTimeout(() => {
        const isMobile = window.innerWidth < 640
        confirmationRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: isMobile ? 'center' : 'start',
        })
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [selectedTime])

  // Auto-select if navigated with selectedServiceId
  useEffect(() => {
    if (location.state?.selectedServiceId) {
      setSelectedServiceId(location.state.selectedServiceId)
      setSelectedDate(startOfDay(new Date()))
      setSelectedTime(null)
      window.history.replaceState({}, document.title)
    }
  }, [location.state?.selectedServiceId])

  const selectedService = useMemo(() => {
    if (!services || !selectedServiceId) return null
    return services.find((s) => s.id === selectedServiceId) || null
  }, [services, selectedServiceId])

  // Filter services by category
  const filteredServices = useMemo(() => {
    const activeOnly = services.filter((s) => s.active !== false)
    if (selectedCategoryId === 'all') return activeOnly
    return activeOnly.filter((s) => s.categoryId === selectedCategoryId)
  }, [services, selectedCategoryId])

  // ── Handler: Change Service ──────────────────────────────────────────────
  const handleSelectService = (serviceId) => {
    setSelectedServiceId(serviceId)
    // Default to today when selecting a service, reset time
    setSelectedDate(startOfDay(new Date()))
    setSelectedTime(null)
  }

  const handleChangeService = () => {
    setSelectedServiceId(null)
    setSelectedDate(startOfDay(new Date()))
    setSelectedTime(null)
  }

  // ── Handler: Select Date ─────────────────────────────────────────────────
  const handleSelectDate = (date) => {
    setSelectedDate(date)
    // Clear time when date changes
    setSelectedTime(null)
  }

  // ── Handler: Select Time ─────────────────────────────────────────────────
  const handleSelectTime = (time) => {
    setSelectedTime(time)
  }

  // ── Handler: Booking Success ─────────────────────────────────────────────
  const handleBookingSuccess = (bookingDetails) => {
    setConfirmedBooking(bookingDetails)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleBookAnother = () => {
    setConfirmedBooking(null)
    setSelectedServiceId(null)
    setSelectedDate(startOfDay(new Date()))
    setSelectedTime(null)
  }

  // Build a WhatsApp confirmation URL with booking details pre-filled
  const buildWhatsAppUrl = (booking) => {
    const PHONE_NUMBER = '595984925322'
    const msg = [
      '¡Hola! 😊 Acabo de reservar un turno y quería confirmarlo.',
      '',
      `✂️ *Servicio:* ${booking.serviceName}`,
      `📅 *Fecha y Horario:* ${booking.dateFormatted} · ${booking.time} hs`,
      `👤 *Nombre:* ${booking.clientName}`,
      `💰 *Total a abonar en el salón:* ${formatCurrency(booking.price)}`,
      '',
      '¡Muchas gracias! 🩷',
    ].join('\n')
    return `https://wa.me/${PHONE_NUMBER}?text=${encodeURIComponent(msg)}`
  }

  const isLoading = loadingServices || loadingSettings

  // ── Success Screen ────────────────────────────────────────────────────────
  if (confirmedBooking) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4 text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/15 text-emerald-400 shadow-lg">
          <CheckCircle className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text">
            ¡Turno Reservado con Éxito!
          </h1>
          <p className="text-sm text-brand-text-muted max-w-md mx-auto">
            Te esperamos con mucho gusto. Te hemos registrado y te contactaremos por WhatsApp para coordinar cualquier detalle.
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 text-left space-y-3.5 shadow-sm max-w-lg mx-auto">
          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <span className="text-xs text-brand-text-muted">Servicio</span>
            <span className="font-semibold text-brand-text text-sm">{confirmedBooking.serviceName}</span>
          </div>

          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <span className="text-xs text-brand-text-muted">Fecha y Horario</span>
            <span className="font-semibold text-brand-text text-sm capitalize">
              {confirmedBooking.dateFormatted} · {confirmedBooking.time} hs
            </span>
          </div>

          <div className="flex items-center justify-between border-b border-brand-border/60 pb-3">
            <span className="text-xs text-brand-text-muted">Cliente</span>
            <span className="font-semibold text-brand-text text-sm">{confirmedBooking.clientName}</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-brand-text-muted">Total a abonar en el salón</span>
            <span className="text-base font-bold text-emerald-400">
              {formatCurrency(confirmedBooking.price)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          {/* WhatsApp confirmation button */}
          <a
            href={buildWhatsAppUrl(confirmedBooking)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:opacity-90 hover:shadow-lg active:scale-95"
            style={{ backgroundColor: '#25D366' }}
          >
            <img src="/whatsapp.png" alt="WhatsApp" className="h-5 w-5 object-contain" />
            Confirmar por WhatsApp
          </a>

          <Button variant="secondary" onClick={handleBookAnother} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Agendar otro turno
          </Button>
          <Button onClick={() => navigate(ROUTES.SERVICES)} rightIcon={<ArrowRight className="h-4 w-4" />}>
            Ver más servicios
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* ── Page Header ──────────────────────────────────────────────────────── */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-primary/10 text-brand-primary">
            <CalendarPlus className="h-5 w-5" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-text tracking-tight">
            Reservá tu Turno
          </h1>
        </div>
        <p className="text-sm text-brand-text-muted pl-11">
          Elegí tu servicio, seleccioná el día y horario que mejor te quede y confirmá en 1 minuto.
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* ══════════════════════════════════════════════════════════════════
              PASO 1: SELECCIONAR SERVICIO
             ══════════════════════════════════════════════════════════════════ */}
          {!selectedService ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
                    1
                  </span>
                  <span>Seleccioná el servicio</span>
                </h2>
              </div>

              {/* Category Filter Chips */}
              {categories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId('all')}
                    className={cn(
                      'rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                      selectedCategoryId === 'all'
                        ? 'bg-brand-primary text-white shadow-sm'
                        : 'border border-brand-border bg-brand-card text-brand-text hover:border-brand-primary/60'
                    )}
                  >
                    Todos
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        'rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors',
                        selectedCategoryId === cat.id
                          ? 'bg-brand-primary text-white shadow-sm'
                          : 'border border-brand-border bg-brand-card text-brand-text hover:border-brand-primary/60'
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Services Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredServices.map((svc) => (
                  <div
                    key={svc.id}
                    onClick={() => handleSelectService(svc.id)}
                    className={cn(
                      'group flex flex-col justify-between rounded-2xl border border-brand-border bg-brand-card p-4 transition-all duration-200 cursor-pointer',
                      'hover:border-brand-primary hover:shadow-md hover:-translate-y-0.5'
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-brand-text group-hover:text-brand-primary transition-colors text-sm sm:text-base">
                          {svc.name}
                        </h3>
                      </div>
                      {svc.description && (
                        <p className="text-xs text-brand-text-muted line-clamp-2">
                          {svc.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-brand-border/60 pt-3 text-xs">
                      <span className="font-medium text-brand-text-muted">
                        {svc.duration} min
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400 text-sm">
                          {formatCurrency(svc.price)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-brand-text-muted group-hover:text-brand-primary transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Selected Service Compact Header */
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-brand-primary/40 bg-brand-primary/5 p-4 transition-all">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-primary text-white shadow-sm shrink-0">
                  <Scissors className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-brand-primary uppercase tracking-wider">
                      Servicio seleccionado
                    </span>
                  </div>
                  <h3 className="font-bold text-brand-text text-base sm:text-lg truncate">
                    {selectedService.name}
                  </h3>
                  <p className="text-xs text-brand-text-muted">
                    {selectedService.duration} min · <strong className="text-emerald-400">{formatCurrency(selectedService.price)}</strong>
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleChangeService}
                className="self-end sm:self-auto shrink-0 text-xs"
              >
                Cambiar servicio
              </Button>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PASO 2: SELECCIONAR DÍA (SE DESPLIEGA AUTOMÁTICAMENTE)
             ══════════════════════════════════════════════════════════════════ */}
          {selectedService && (
            <div className="space-y-4 rounded-2xl border border-brand-border bg-brand-card p-4 sm:p-6 shadow-sm animate-in fade-in slide-in-from-top-3 duration-300">
              <h2 className="text-lg font-bold text-brand-text flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
                  2
                </span>
                <span>Selecciona el día de tu reserva</span>
              </h2>

              <WeekCalendarPicker
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
                serviceDuration={selectedService.duration}
                settings={settings}
              />

              {/* ══════════════════════════════════════════════════════════════
                  PASO 3: HORARIOS DISPONIBLES (SE DESPLIEGA AL ELEGIR DÍA)
                 ══════════════════════════════════════════════════════════════ */}
              {selectedDate && (
                <div className="pt-4 border-t border-brand-border/60 animate-in fade-in slide-in-from-top-2 duration-300">
                  <TimeSlotGrid
                    selectedDate={selectedDate}
                    selectedTime={selectedTime}
                    onSelectTime={handleSelectTime}
                    serviceDuration={selectedService.duration}
                    settings={settings}
                  />
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              PASO 4: CONFIRMACIÓN DE LA RESERVA (AL ELEGIR HORARIO)
             ══════════════════════════════════════════════════════════════════ */}
          {selectedService && selectedDate && selectedTime && (
            <div ref={confirmationRef} className="pt-2 scroll-mt-6">
              <BookingConfirmation
                service={selectedService}
                date={selectedDate}
                time={selectedTime}
                onBookingSuccess={handleBookingSuccess}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
