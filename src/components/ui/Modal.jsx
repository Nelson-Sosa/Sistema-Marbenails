import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

function Modal({ isOpen, onClose, title, children, className, maxWidthClass = "max-w-md" }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div 
        className={cn(
          "relative flex flex-col w-full max-w-[95vw] max-h-[90vh] rounded-2xl border border-brand-pastel bg-brand-card shadow-2xl overflow-hidden z-50",
          maxWidthClass,
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-50 rounded-lg p-1.5 text-brand-text-muted hover:bg-brand-pastel hover:text-brand-primary transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {title && (
          <div className="px-6 pt-6 pb-2 shrink-0">
            <h2 className="pr-8 text-xl font-bold text-brand-text">{title}</h2>
          </div>
        )}

        <div className={cn("overflow-y-auto p-4 sm:p-6", title && "pt-2 sm:pt-4")}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
