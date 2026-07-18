import { MapPin, Clock, ExternalLink } from 'lucide-react'

export default function LocationSection() {
  // Datos de ejemplo - Se pueden modificar más adelante con la ubicación real
  const address = "Av. Principal 1234, Centro (Ejemplo)"
  const mapsLink = "https://maps.google.com/?q=Marbenails"

  return (
    <section className="mt-12 overflow-hidden rounded-2xl border border-brand-pastel bg-brand-card shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Lado izquierdo: Información */}
        <div className="flex flex-col justify-center p-8 lg:p-12">
          <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500">
            <MapPin className="h-6 w-6" />
          </div>
          <h2 className="mb-3 text-2xl font-bold text-brand-text sm:text-3xl">Nuestra Ubicación</h2>
          <p className="mb-8 text-brand-text-muted">
            Vení a conocernos y viví la experiencia Marbenails en nuestro salón diseñado para tu comodidad.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-pastel/30 text-brand-text">
                 <MapPin className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-brand-text">Dirección</h3>
                <p className="mt-1 text-sm text-brand-text-muted">{address}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-pastel/30 text-brand-text">
                 <Clock className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-medium text-brand-text">Horarios de Atención</h3>
                <p className="mt-1 text-sm text-brand-text-muted">Lunes a Viernes: 09:00 - 20:00</p>
                <p className="text-sm text-brand-text-muted">Sábados: 10:00 - 18:00</p>
              </div>
            </div>
          </div>
          
          <div className="mt-10">
            <a 
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-primary px-6 py-3 text-sm font-medium text-white shadow-sm shadow-brand-primary/20 transition-all duration-200 hover:bg-brand-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-bg active:bg-brand-primary-hover sm:w-auto"
            >
              <ExternalLink className="h-4 w-4" />
              Abrir en Google Maps
            </a>
          </div>
        </div>
        
        {/* Lado derecho: Mapa interactivo (iframe) */}
        <div className="min-h-[350px] w-full bg-brand-pastel/20 lg:min-h-full">
          {/* Iframe de ejemplo apuntando a un lugar genérico (Obelisco, Buenos Aires) - Reemplazar el src con el código de Google Maps real */}
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13136.06685002271!2d-58.3815704!3d-34.6037389!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95bccacbc4d7f551%3A0x334467c699966a33!2sObelisco!5e0!3m2!1ses-419!2sar!4v1700000000000!5m2!1ses-419!2sar" 
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen="" 
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Ubicación Marbenails"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
