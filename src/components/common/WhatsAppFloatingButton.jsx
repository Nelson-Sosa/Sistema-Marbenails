import React from 'react'
import './WhatsAppFloatingButton.css'

/**
 * WhatsAppFloatingButton
 * 
 * Componente reutilizable para mostrar un botón flotante de WhatsApp.
 * Posicionado usando CSS fijo para estar siempre visible sin interferir con
 * los elementos principales de la UI (Nav, Modales, Toast).
 */
const WhatsAppFloatingButton = () => {
  // El número oficial puede configurarse aquí si es necesario.
  // Por requerimiento actual, usamos el enlace wa.me para abrir la app.
  const message = 'Hola 😊\n\nMe gustaría obtener información sobre los servicios de MarbeNails.\n\nMuchas gracias.'
  const encodedMessage = encodeURIComponent(message)
  
  // Enlace oficial de WhatsApp
  const whatsappUrl = `https://wa.me/?text=${encodedMessage}`

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="whatsapp-floating-button"
      aria-label="Contactar por WhatsApp"
      title="Contactar por WhatsApp"
      role="button"
    >
      <img
        src="/whatsapp.png"
        alt="WhatsApp Logo"
        loading="lazy"
        className="whatsapp-icon"
      />
    </a>
  )
}

export default WhatsAppFloatingButton
