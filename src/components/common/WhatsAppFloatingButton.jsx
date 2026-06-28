import React from 'react'
import { useLocation } from 'react-router-dom'
import './WhatsAppFloatingButton.css'

/**
 * Genera un mensaje dinámico para WhatsApp basado en la ruta actual.
 * Preparado para escalar y agregar más rutas en el futuro de manera limpia.
 */
const getWhatsAppMessage = (pathname) => {
  // Se pueden agregar nuevos casos ('/servicios', '/reservas', etc.) sin tocar el render.
  switch (pathname) {
    case '/':
      return '💅 ¡Hola!\n\nMe gustaría obtener información sobre los servicios de MarbeNails y conocer la disponibilidad para agendar un turno.\n\nMuchas gracias. 😊'
    
    // Ejemplos para futuras rutas:
    // case '/servicios':
    //   return 'Hola 😊\n\nMe gustaría conocer más sobre sus servicios.'
    // case '/reservas':
    //   return 'Hola 😊\n\nMe gustaría agendar un turno.'
    // case '/contacto':
    //   return 'Hola 😊\n\nTengo una consulta.'
    // case '/promociones':
    //   return 'Hola 😊\n\nMe interesan sus promociones.'

    default:
      // Mensaje por defecto en caso de no coincidir con las rutas anteriores
      return '💅 ¡Hola!\n\nMe gustaría obtener información sobre los servicios de MarbeNails y conocer la disponibilidad para agendar un turno.\n\nMuchas gracias. 😊'
  }
}

/**
 * WhatsAppFloatingButton
 * 
 * Componente reutilizable para mostrar un botón flotante de WhatsApp.
 * Posicionado usando CSS fijo para estar siempre visible sin interferir con
 * los elementos principales de la UI (Nav, Modales, Toast).
 */
const WhatsAppFloatingButton = () => {
  const { pathname } = useLocation()
  
  const PHONE_NUMBER = '595984925322'
  const message = getWhatsAppMessage(pathname)
  const encodedMessage = encodeURIComponent(message)
  
  // Enlace oficial de WhatsApp con el número específico
  const whatsappUrl = `https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`

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
