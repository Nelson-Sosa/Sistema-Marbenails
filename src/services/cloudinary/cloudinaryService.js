/**
 * Cloudinary Service — Direct browser upload using Unsigned Preset.
 *
 * Images are uploaded directly from the React client to Cloudinary.
 * No backend server required — uses Cloudinary's Unsigned Upload API.
 *
 * Required environment variables in .env.local:
 *   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
 *   VITE_CLOUDINARY_UPLOAD_PRESET=marbenails_works
 *
 * NOTE: Image deletion is NOT implemented here. Cloudinary's delete API
 * requires an API Secret which must never be exposed on the frontend.
 * Deletion will be handled via Firebase Cloud Functions in a future phase.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Validate a file before uploading.
 * @param {File} file
 * @throws {Error} if the file is invalid
 */
function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Formato no permitido. Solo JPG, PNG y WEBP.`)
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      `La imagen es demasiado grande. Máximo ${MAX_FILE_SIZE_MB} MB por imagen.`
    )
  }
}

/**
 * Upload a single image to Cloudinary using an unsigned preset.
 * Includes automatic retry logic for network stability.
 *
 * @param {File}   file   - The image file to upload
 * @param {string} folder - Cloudinary folder path
 * @param {(progress: number) => void} [onProgress] - Optional progress callback (0–100)
 * @param {number} retries - Number of retries left
 * @returns {Promise<{ publicId: string, secureUrl: string }>}
 */
export async function uploadImage(file, folder = 'marbenails/works', onProgress, retries = 2) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      'Cloudinary no está configurado. Agregá VITE_CLOUDINARY_CLOUD_NAME y VITE_CLOUDINARY_UPLOAD_PRESET en .env.local'
    )
  }

  validateFile(file)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', UPLOAD_PRESET)
  formData.append('folder', folder)
  formData.append('quality', 'auto')

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`

  const attemptUpload = () => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', url)
      
      // Extended timeout for slow mobile networks (60 seconds)
      xhr.timeout = 60000;

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const pct = Math.round((event.loaded / event.total) * 100)
            onProgress(pct)
          }
        })
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText)
            resolve({
              publicId: data.public_id,
              secureUrl: data.secure_url,
            })
          } catch {
            reject(new Error('Respuesta inesperada de Cloudinary.'))
          }
        } else {
          reject(new Error(`Error al subir imagen: ${xhr.status} ${xhr.statusText}`))
        }
      }

      xhr.onerror = () => reject(new Error('Error_Network'))
      xhr.ontimeout = () => reject(new Error('Error_Timeout'))
      xhr.onabort = () => reject(new Error('Subida cancelada.'))

      xhr.send(formData)
    })
  }

  try {
    return await attemptUpload()
  } catch (error) {
    if ((error.message === 'Error_Network' || error.message === 'Error_Timeout') && retries > 0) {
      console.warn(`Upload failed, retrying... (${retries} retries left)`)
      // Wait 1.5 seconds before retrying
      await new Promise(res => setTimeout(res, 1500))
      return uploadImage(file, folder, onProgress, retries - 1)
    }
    
    if (error.message === 'Error_Network') throw new Error('Error de red al subir la imagen. Verificá tu conexión a internet.')
    if (error.message === 'Error_Timeout') throw new Error('Tiempo de espera agotado al subir la imagen. Tu conexión es muy lenta.')
    throw error
  }
}

/**
 * Upload multiple images to Cloudinary in parallel, with a concurrency limit.
 *
 * @param {File[]} files - Array of image files
 * @param {string} folder - Cloudinary folder path
 * @param {(index: number, progress: number) => void} [onProgress]
 * @returns {Promise<Array<{ publicId: string, secureUrl: string }>>}
 */
export async function uploadImages(files, folder, onProgress) {
  // Mobile connections often fail when uploading many large files at exactly the same time.
  // Instead of Promise.all, we upload with a concurrency limit of 2.
  const results = new Array(files.length)
  let currentIndex = 0

  const worker = async () => {
    while (currentIndex < files.length) {
      const i = currentIndex++
      results[i] = await uploadImage(files[i], folder, (pct) => onProgress?.(i, pct))
    }
  }

  // Start 2 workers max
  const workers = Array.from({ length: Math.min(2, files.length) }, () => worker())
  await Promise.all(workers)

  return results
}

/**
 * Generate an optimized Cloudinary URL for display.
 *
 * Applies automatic format (f_auto), quality (q_auto),
 * and an optional width for responsive images.
 *
 * @param {string} publicId - Cloudinary public_id of the image
 * @param {{ width?: number, height?: number, crop?: string }} [options]
 * @returns {string} Optimized image URL
 */
export function getOptimizedUrl(publicId, options = {}) {
  if (!CLOUD_NAME || !publicId) return ''

  const transformations = ['f_auto', 'q_auto']

  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.crop) transformations.push(`c_${options.crop}`)

  const transform = transformations.join(',')
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transform}/${publicId}`
}

/**
 * Get a thumbnail URL (small, cropped to fill).
 * @param {string} publicId
 * @returns {string}
 */
export function getThumbnailUrl(publicId) {
  return getOptimizedUrl(publicId, { width: 400, height: 400, crop: 'fill' })
}

/**
 * Get a full-size optimized URL for detail view.
 * @param {string} publicId
 * @returns {string}
 */
export function getFullUrl(publicId) {
  return getOptimizedUrl(publicId, { width: 1200 })
}
