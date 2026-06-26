/**
 * Shared Zod primitive schemas and utilities.
 * Import from here for consistent validation across features.
 */
export { z } from 'zod'

// Re-export common primitives from authSchemas for convenience
export {
  emailSchema,
  passwordSchema,
  strongPasswordSchema,
} from '@/schemas/authSchemas'
