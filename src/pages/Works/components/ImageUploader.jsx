/**
 * ImageUploader — Multi-image upload component with drag & drop, preview,
 * progress tracking, and removal before confirming.
 *
 * Props:
 *   files        {File[]}           Currently selected File objects
 *   onChange     (files: File[]) => void
 *   progress     {Record<number, number>}  Upload progress per file index (0–100)
 *   maxFiles     {number}           default 5
 *   disabled     {boolean}
 */
import { useRef, useCallback } from 'react'
import { Upload, X, ImageIcon, CheckCircle } from 'lucide-react'
import { cn } from '@/utils/cn'

const MAX_FILES = 5
const MAX_SIZE_MB = 5

export default function ImageUploader({
  files = [],
  onChange,
  progress = {},
  maxFiles = MAX_FILES,
  disabled = false,
}) {
  const inputRef = useRef(null)

  const addFiles = useCallback(
    (incoming) => {
      const valid = incoming.filter((f) => {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) return false
        if (f.size > MAX_SIZE_MB * 1024 * 1024) return false
        return true
      })
      const combined = [...files, ...valid].slice(0, maxFiles)
      onChange(combined)
    },
    [files, maxFiles, onChange]
  )

  const handleInputChange = (e) => {
    addFiles(Array.from(e.target.files))
    // Reset input so the same file can be re-added if removed
    e.target.value = ''
  }

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      if (disabled) return
      addFiles(Array.from(e.dataTransfer.files))
    },
    [addFiles, disabled]
  )

  const handleDragOver = (e) => e.preventDefault()

  const removeFile = (index) => {
    onChange(files.filter((_, i) => i !== index))
  }

  const canAdd = files.length < maxFiles && !disabled

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {canAdd && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2',
            'rounded-xl border-2 border-dashed border-brand-pastel bg-brand-pastel/10',
            'px-4 py-7 text-center transition-colors duration-200',
            'hover:border-brand-primary/50 hover:bg-brand-primary/5',
            disabled && 'pointer-events-none opacity-50'
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-pastel/40">
            <Upload className="h-5 w-5 text-brand-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-brand-text">
              Arrastrá fotos aquí o{' '}
              <span className="text-brand-primary">hacé clic para seleccionar</span>
            </p>
            <p className="mt-0.5 text-xs text-brand-text-muted">
              JPG, PNG o WEBP · Máx {MAX_SIZE_MB} MB · {files.length}/{maxFiles} fotos
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleInputChange}
            disabled={disabled}
          />
        </div>
      )}

      {/* Preview grid */}
      {files.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {files.map((file, index) => {
            const pct = progress[index] ?? null
            const isDone = pct === 100
            const isUploading = pct !== null && !isDone
            const previewUrl = URL.createObjectURL(file)

            return (
              <div
                key={index}
                className="group relative aspect-square overflow-hidden rounded-lg border border-brand-pastel bg-brand-pastel/10"
              >
                <img
                  src={previewUrl}
                  alt={`Preview ${index + 1}`}
                  className="h-full w-full object-cover"
                  onLoad={() => URL.revokeObjectURL(previewUrl)}
                />

                {/* Progress overlay */}
                {isUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
                    <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-white/20">
                      <div
                        className="h-full rounded-full bg-brand-primary transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="mt-1.5 text-xs font-medium text-white">{pct}%</span>
                  </div>
                )}

                {/* Done overlay */}
                {isDone && (
                  <div className="absolute inset-0 flex items-center justify-center bg-brand-success/30">
                    <CheckCircle className="h-6 w-6 text-white drop-shadow" />
                  </div>
                )}

                {/* Remove button — hidden while uploading */}
                {!isUploading && !isDone && (
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className={cn(
                      'absolute right-1 top-1 rounded-full bg-black/60 p-0.5',
                      'text-white opacity-0 transition-opacity group-hover:opacity-100',
                      'hover:bg-red-500/80'
                    )}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* First image badge */}
                {index === 0 && !isUploading && (
                  <div className="absolute bottom-1 left-1 rounded-sm bg-black/60 px-1 py-px">
                    <span className="text-[9px] font-medium text-white">Principal</span>
                  </div>
                )}
              </div>
            )
          })}

          {/* Add more slot (when some files already selected but can still add) */}
          {canAdd && files.length > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex aspect-square flex-col items-center justify-center gap-1',
                'rounded-lg border-2 border-dashed border-brand-pastel',
                'text-brand-text-muted transition-colors hover:border-brand-primary/50 hover:text-brand-primary'
              )}
            >
              <ImageIcon className="h-5 w-5" />
              <span className="text-xs">Agregar</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
