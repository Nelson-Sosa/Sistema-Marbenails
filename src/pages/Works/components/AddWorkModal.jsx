/**
 * AddWorkModal — Simple form to create a work from a completed appointment.
 *
 * Goal: complete in under 30 seconds.
 * Fields: photos (1–5), title, description (optional), publish toggle.
 *
 * Flow:
 *   1. Admin selects photos → previewed locally
 *   2. Fills title (required), description (optional)
 *   3. Chooses whether to publish in gallery
 *   4. Submits → uploads photos to Cloudinary → saves to Firestore `works`
 */

import { useState } from 'react'
import { Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCreateWork } from '@/hooks/useWorks'
import { uploadImages } from '@/services/cloudinary/cloudinaryService'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import ImageUploader from './ImageUploader'

export default function AddWorkModal({ isOpen, onClose, appointment }) {
  const [files, setFiles] = useState([])
  const [progress, setProgress] = useState({})
  const [title, setTitle] = useState('')
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

    try {
      setIsUploading(true)

      // Upload all images to Cloudinary
      const folder = `marbenails/works/${appointment.id}`
      const uploaded = await uploadImages(files, folder, handleProgress)

      // Create Firestore document
      await createWork({
        type: 'client',
        appointmentId: appointment.id,
        clientId: appointment.clientId,
        serviceId: appointment.serviceId,
        serviceName: appointment.serviceName ?? '',
        categoryId: appointment.categoryId ?? '',
        categoryName: appointment.categoryName ?? '',
        title: title.trim(),
        description: description.trim(),
        photos: uploaded,
        published,
      })

      toast.success('¡Trabajo guardado correctamente!')
      handleClose()
    } catch (err) {
      console.error('[AddWorkModal] Error:', err)
      toast.error(err.message || 'No se pudo guardar el trabajo. Intentá de nuevo.')
    } finally {
      setIsUploading(false)
    }
  }

  const isBusy = isUploading || isPending
  const canSubmit = files.length > 0 && title.trim().length > 0 && !isBusy

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Agregar trabajo"
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Appointment context */}
        {appointment && (
          <div className="flex items-center gap-3 rounded-xl border border-brand-pastel bg-brand-pastel/20 px-4 py-3">
            <Camera className="h-4 w-4 shrink-0 text-brand-primary" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-brand-text">
                {appointment.clientName}
              </p>
              <p className="text-xs text-brand-text-muted">{appointment.serviceName}</p>
            </div>
          </div>
        )}

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
          id="work-title"
          placeholder="Ej: Soft Gel Baby Boomer"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isBusy}
          required
        />

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="work-description"
            className="text-sm font-medium text-brand-text-muted"
          >
            Descripción{' '}
            <span className="font-normal text-brand-text-muted/70">(opcional)</span>
          </label>
          <textarea
            id="work-description"
            rows={2}
            placeholder="Describe brevemente el trabajo realizado..."
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
              El trabajo será visible para nuevas clientas en el sitio web.
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
            {isUploading ? 'Subiendo fotos...' : isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
