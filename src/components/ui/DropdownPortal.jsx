import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Z_INDEX } from '@/constants/zIndex'

const DROPDOWN_MARGIN = 8
const VIEWPORT_MARGIN = 8

function calcSmartPosition(triggerEl, dropdownEl, align, flip) {
  const rect = triggerEl.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  const mw = dropdownEl.offsetWidth || 192
  const mh = dropdownEl.offsetHeight || 320

  let top, left

  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top
  const openUp = flip && spaceBelow < mh + VIEWPORT_MARGIN && spaceAbove > spaceBelow

  if (openUp) {
    top = rect.top - mh - DROPDOWN_MARGIN
  } else {
    top = rect.bottom + DROPDOWN_MARGIN
  }

  if (align === 'right') {
    const naturalLeft = rect.right - mw
    if (flip && naturalLeft < VIEWPORT_MARGIN && rect.right + mw + DROPDOWN_MARGIN < vw - VIEWPORT_MARGIN) {
      left = rect.right + DROPDOWN_MARGIN
    } else {
      left = Math.max(VIEWPORT_MARGIN, naturalLeft)
    }
  } else {
    const naturalLeft = rect.left
    if (flip && naturalLeft + mw > vw - VIEWPORT_MARGIN && rect.left - mw - DROPDOWN_MARGIN > VIEWPORT_MARGIN) {
      left = rect.left - mw - DROPDOWN_MARGIN
    } else {
      left = Math.min(naturalLeft, vw - mw - VIEWPORT_MARGIN)
    }
  }

  return {
    top: Math.max(VIEWPORT_MARGIN, Math.min(top, vh - mh - VIEWPORT_MARGIN)),
    left: Math.max(VIEWPORT_MARGIN, Math.min(left, vw - mw - VIEWPORT_MARGIN)),
  }
}

function DropdownPortal({
  triggerRef,
  isOpen,
  onClose,
  children,
  align = 'right',
  flip = true,
  transition = false,
  transitionDuration = 150,
}) {
  const dropdownRef = useRef(null)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return
    const pos = calcSmartPosition(triggerRef.current, dropdownRef.current, align, flip)
    setPosition(pos)
  }, [triggerRef, align, flip])

  useEffect(() => {
    if (!isOpen) return

    const raf = requestAnimationFrame(() => updatePosition())

    const handleScroll = () => updatePosition()
    const handleResize = () => updatePosition()
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    document.addEventListener('keydown', handleEscape)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, updatePosition, onClose])

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e) {
      if (!dropdownRef.current) return
      if (dropdownRef.current.contains(e.target)) return
      if (triggerRef.current && triggerRef.current.contains(e.target)) return
      onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose, triggerRef])

  if (!isOpen) return null

  return createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: Z_INDEX.DROPDOWN,
        animation: transition ? `dropdownFadeScale ${transitionDuration}ms ease-out` : undefined,
      }}
    >
      {children}
    </div>,
    document.body
  )
}

export default DropdownPortal
