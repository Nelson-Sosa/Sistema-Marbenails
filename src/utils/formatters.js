/**
 * Format a number as currency string.
 * @param {number} amount
 * @param {string} [currency='PYG']
 * @returns {string}
 */
export function formatCurrency(amount, currency = 'PYG') {
  const num = Number(amount) || 0
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(num)
}

/**
 * Format a Date or ISO string to a localized date string.
 * @param {Date|string|number} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return new Intl.DateTimeFormat('es-PY', { ...defaultOptions, ...options }).format(
    new Date(date)
  )
}

/**
 * Format a Date or ISO string to a short date (dd/mm/yyyy).
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatShortDate(date) {
  return formatDate(date, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

/**
 * Format a Date or ISO string to time (HH:mm).
 * @param {Date|string|number} date
 * @returns {string}
 */
export function formatTime(date) {
  return new Intl.DateTimeFormat('es-PY', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

/**
 * Format a phone number for display in Paraguay (hides +595).
 * e.g., +595986321987 -> 0986321987
 * @param {string} phone - Raw phone string
 * @returns {string}
 */
export function formatPhoneDisplayPY(phone) {
  if (!phone) return ''
  const trimmed = phone.trim()
  if (trimmed.startsWith('+595')) {
    return '0' + trimmed.slice(4)
  }
  return trimmed
}

/**
 * Format a Paraguay phone number for storage (adds +595).
 * e.g., 0986321987 -> +595986321987
 * e.g., 986321987 -> +595986321987
 * @param {string} phone - Raw phone string
 * @returns {string}
 */
export function formatPhoneStoragePY(phone) {
  if (!phone) return ''
  let cleaned = phone.replace(/\D/g, '') // remove spaces, dashes, etc.
  
  if (cleaned.startsWith('595')) {
    return '+' + cleaned
  }
  if (cleaned.startsWith('09')) {
    return '+595' + cleaned.slice(1)
  }
  if (cleaned.startsWith('9')) {
    return '+595' + cleaned
  }
  
  // If it already has a '+', preserve it
  if (phone.trim().startsWith('+')) {
    return phone.trim().replace(/[^\+\d]/g, '')
  }

  return cleaned // fallback
}

/**
 * Get initials from a full name (up to 2 characters).
 * @param {string} name
 * @returns {string}
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/**
 * Truncate a string to a maximum length, appending ellipsis if needed.
 * @param {string} str
 * @param {number} [maxLength=50]
 * @returns {string}
 */
export function truncate(str, maxLength = 50) {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength - 3) + '...'
}
