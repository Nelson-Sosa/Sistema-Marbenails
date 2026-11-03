import { useState, useMemo, useEffect } from 'react'
import { Scissors, Plus, FolderKanban } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useAuth } from '@/hooks/useAuth'
import { useServices, useAllServices } from '@/hooks/useServices'
import { useCategories } from '@/hooks/useServiceCategories'
import { USER_ROLES } from '@/constants/app'
import Button from '@/components/ui/Button'
import Spinner from '@/components/ui/Spinner'
import CategoryCard from './components/CategoryCard'
import ServiceModal from './components/ServiceModal'
import CategoryModal from './components/CategoryModal'
import LocationSection from '@/components/common/LocationSection'
import UserBookingModal from '@/pages/Appointments/components/UserBookingModal'

function ServicesPage() {
  usePageTitle('Servicios')
  const location = useLocation()

  const { role } = useAuth()
  const isAdmin = role === USER_ROLES.ADMIN

  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null)
  const [preSelectedCategoryId, setPreSelectedCategoryId] = useState(null)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)

  // Booking Modal State (Supports both Guests & Logged-in Users)
  const [bookingModalOpen, setBookingModalOpen] = useState(() => Boolean(location.state?.selectedServiceId))
  const [bookingServiceId, setBookingServiceId] = useState(() => location.state?.selectedServiceId || null)

  // Unconditional hook calls per React rules
  const allServicesQuery = useAllServices()
  const activeServicesQuery = useServices()
  const rawServices = isAdmin ? allServicesQuery.data : activeServicesQuery.data
  const isLoading = isAdmin ? allServicesQuery.isLoading : activeServicesQuery.isLoading

  const { data: categories } = useCategories()

  // Clean up state if navigated with selectedServiceId
  useEffect(() => {
    if (location.state?.selectedServiceId) {
      window.history.replaceState({}, document.title)
    }
  }, [location.state?.selectedServiceId])

  const grouped = useMemo(() => {
    if (!rawServices) return { categories: [], uncategorized: [] }

    const catMap = {}
    const uncategorized = []

    rawServices.forEach((svc) => {
      const catId = svc.categoryId
      if (catId) {
        if (!catMap[catId]) catMap[catId] = []
        catMap[catId].push(svc)
      } else {
        uncategorized.push(svc)
      }
    })

    const result = (categories || []).map((cat) => ({
      category: cat,
      services: catMap[cat.id] || [],
    })).filter((g) => g.services.length > 0 || isAdmin)

    return { categories: result, uncategorized }
  }, [rawServices, categories, isAdmin])

  const handleBookService = (serviceId) => {
    setBookingServiceId(serviceId)
    setBookingModalOpen(true)
  }

  const handleCloseBookingModal = () => {
    setBookingModalOpen(false)
    setTimeout(() => setBookingServiceId(null), 300)
  }

  const handleEditService = (service) => {
    setSelectedService(service)
    setPreSelectedCategoryId(null)
    setServiceModalOpen(true)
  }

  const handleAddServiceInCategory = (category) => {
    setSelectedService(null)
    setPreSelectedCategoryId(category.id)
    setServiceModalOpen(true)
  }

  const handleAddServiceGeneric = () => {
    setSelectedService(null)
    setPreSelectedCategoryId(null)
    setServiceModalOpen(true)
  }

  const handleEditCategory = (category) => {
    setSelectedCategory(category)
    setCategoryModalOpen(true)
  }

  const handleCloseServiceModal = () => {
    setSelectedService(null)
    setPreSelectedCategoryId(null)
    setServiceModalOpen(false)
  }

  const handleCloseCategoryModal = () => {
    setSelectedCategory(null)
    setCategoryModalOpen(false)
  }

  const hasAnyServices = rawServices?.length > 0

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-500">
            <Scissors className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-brand-text">Catálogo de Servicios</h1>
            <p className="text-sm text-brand-text-muted">Explorá nuestros servicios y reservá tu turno.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <>
              <Button
                variant="secondary"
                leftIcon={<FolderKanban className="h-4 w-4" />}
                onClick={() => setCategoryModalOpen(true)}
              >
                Nueva Categoría
              </Button>
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={handleAddServiceGeneric}
              >
                Nuevo Servicio
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Catalog ─────────────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : hasAnyServices ? (
        <div className="flex flex-col gap-4">
          {/* Grouped by category */}
          {grouped.categories.map(({ category, services }) => (
            <CategoryCard
              key={category.id}
              category={category}
              services={services}
              isAdmin={isAdmin}
              onEditCategory={handleEditCategory}
              onAddService={handleAddServiceInCategory}
              onEditService={handleEditService}
              onBook={handleBookService}
              defaultOpen
            />
          ))}

          {/* Uncategorized section */}
          {grouped.uncategorized.length > 0 && (
            <CategoryCard
              category={{ name: 'Sin categoría', description: '' }}
              services={grouped.uncategorized}
              isAdmin={isAdmin}
              onEditCategory={() => {}}
              onAddService={handleAddServiceGeneric}
              onEditService={handleEditService}
              onBook={handleBookService}
              defaultOpen={grouped.categories.length === 0}
            />
          )}
        </div>
      ) : (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-brand-pastel bg-brand-pastel/10">
          <Scissors className="mb-3 h-10 w-10 text-brand-text-muted" />
          <p className="text-lg font-medium text-brand-text-muted">No hay servicios disponibles</p>
        </div>
      )}

      {/* ── Location Section ────────────────────────────────────────────────── */}
      <LocationSection />

      {/* ── User Booking Modal (Guests & Logged-in Clients) ─────────────────── */}
      <UserBookingModal
        isOpen={bookingModalOpen}
        onClose={handleCloseBookingModal}
        defaultServiceId={bookingServiceId}
      />

      {/* ── Service Modal (Admin Only) ─────────────────────────────────────── */}
      {(serviceModalOpen || selectedService) && (
        <ServiceModal
          isOpen={serviceModalOpen || !!selectedService}
          onClose={handleCloseServiceModal}
          service={selectedService}
          defaultCategoryId={preSelectedCategoryId}
        />
      )}

      {/* ── Category Modal (Admin Only) ───────────────────────────────────── */}
      {(categoryModalOpen || selectedCategory) && (
        <CategoryModal
          isOpen={categoryModalOpen || !!selectedCategory}
          onClose={handleCloseCategoryModal}
          category={selectedCategory}
        />
      )}
    </div>
  )
}

export default ServicesPage
