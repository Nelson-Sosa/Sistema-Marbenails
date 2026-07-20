/**
 * AddPortfolioWorkModal — Form to create a standalone portfolio work.
 *
 * This work is not linked to any client or appointment.
 * Fields: photos (1–5), title, service, description, publish toggle.
 */

import { useState } from 'react'
import toast from 'react-hot-toast'
import { useCreateWork } from '@/hooks/useWorks'
import { useAllServices } from '@/hooks/useServices'
import { uploadImages } from '@/services/cloudinary/cloudinaryService'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ImageUploader from './ImageUploader'

export default function AddPortfolioWorkModal({ isOpen, onClose }) {
  const { data: services } = useAllServices()
  
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState({})
  const [title, setTitle] = useState('')
  const [serviceId, setServiceId] = useState('')
  const [description, setDescription] = useState('')
  const [published, setPublished] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  const { mutateAsync: createWork, isPending } = useCreateWork()

  const handleProgress = (index, pct) => {
    setProgress((prev) => ({ ...prev, [index]: pct }))
  }

  const handleClose = () => {
    if (isUploading || isPending) return
    setFiles([])
    setProgress({})
    setTitle('')
    setServiceId('')
    setDescription('')
    setPublished(true)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (files.length === 0) {
      toast.error('Agregá al menos una fotografía.')
      return
    }
    if (!title.trim()) {
      toast.error('El título es obligatorio.')
      return
    }
    if (!serviceId) {
      toast.error('Debes seleccionar un servicio.')
      return
    }

    const selectedService = services?.find(s => s.id === serviceId)

    try {
      setIsUploading(true)

      // Upload all images to Cloudinary. Use a generic folder for portfolio.
      const timestamp = Date.now()
      const folder = `marbenails/works/portfolio_${timestamp}`
      const uploaded = await uploadImages(files, folder, handleProgress)

      // Create Firestore document (type: portfolio)
      await createWork({
        type: 'portfolio',
        appointmentId: null,
        clientId: null,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        categoryId: selectedService.categoryId,
        categoryName: selectedService.categoryName,
        title: title.trim(),
        description: description.trim(),
        photos: uploaded,
        published,
      })

      toast.success('¡Trabajo de portfolio guardado correctamente!')
      handleClose()
    } catch (err) {
      console.error('[AddPortfolioWorkModal] Error:', err)
      toast.error(err.message || 'No se pudo guardar el trabajo. Intentá de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  const isBusy = isUploading || isPending
  const canSubmit = files.length > 0 && title.trim().length > 0 && !!serviceId && !isBusy

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Nuevo Diseño Libre"
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <p className="text-sm text-brand-text-muted pb-2 border-b border-brand-pastel">
          Este diseño se agregará directamente para mostrarse públicamente y no estará asociado a ninguna clienta.
        </p>

        {/* Photos */}
        <div>
          <label className="mb-2 block text-sm font-medium text-brand-text">
            Fotografías <span className="text-brand-primary">*</span>
            <span className="ml-1 text-xs font-normal text-brand-text-muted">(1–5)</span>
          </label>
          <ImageUploader
            files={files}
            onChange={setFiles}
            progress={progress}
            maxFiles={5}
            disabled={isBusy}
          />
        </div>

        {/* Title */}
        <Input
          label="Título"
          id="portfolio-title"
          placeholder="Ej: Soft Gel Nude Elegante"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isBusy}
          required
        />

        {/* Service Select */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="portfolio-service" className="text-sm font-medium text-brand-text">
            Servicio <span className="text-brand-primary">*</span>
          </label>
          <select
            id="portfolio-service"
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            disabled={isBusy}
            required
            className="w-full rounded-lg border border-brand-pastel bg-brand-bg px-3 py-2 text-sm text-brand-text focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
          >
            <option value="">Selecciona un servicio...</option>
            {services?.map(s => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.categoryName})
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="portfolio-description"
            className="text-sm font-medium text-brand-text-muted"
          >
            Descripción{' '}
            <span className="font-normal text-brand-text-muted/70">(opcional)</span>
          </label>
          <textarea
            id="portfolio-description"
            rows={2}
            placeholder="Describe brevemente el diseño..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isBusy}
            className="w-full resize-none rounded-lg border border-brand-pastel bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder:text-brand-text-muted/60 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-50"
          />
        </div>

        {/* Publish toggle */}
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            disabled={isBusy}
            className="mt-0.5 h-4 w-4 cursor-pointer rounded border-brand-pastel bg-brand-bg text-brand-primary focus:ring-brand-primary"
          />
          <div>
            <p className="text-sm font-medium text-brand-text">
              Mostrar públicamente
            </p>
            <p className="text-xs text-brand-text-muted">
              El trabajo será visible para todas las visitantes del sitio.
            </p>
          </div>
        </label>

        {/* Actions */}
        <div className="flex gap-2 border-t border-brand-pastel pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isBusy}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={isBusy}
            disabled={!canSubmit}
            className="flex-1"
          >
            {isUploading ? 'Subiendo fotos...' : isPending ? 'Guardando...' : 'Guardar Trabajo'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
