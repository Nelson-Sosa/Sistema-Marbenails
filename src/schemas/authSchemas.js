import { z } from 'zod'

// ─── Primitives ───────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .min(1, 'El email es requerido')
  .email('Ingresá un email válido')

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(100, 'La contraseña es demasiado larga')

export const strongPasswordSchema = passwordSchema
  .regex(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')

// ─── Auth Schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es requerida'),
})

export const registerSchema = z
  .object({
    displayName: z
      .string()
      .min(2, 'El nombre debe tener al menos 2 caracteres')
      .max(50, 'El nombre es demasiado largo'),
    email: emailSchema,
    password: strongPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirmá tu contraseña'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

export const resetPasswordSchema = z.object({
  email: emailSchema,
})

// ─── Types (JSDoc) ────────────────────────────────────────────────────────────

/**
 * @typedef {z.infer<typeof loginSchema>} LoginFormValues
 * @typedef {z.infer<typeof registerSchema>} RegisterFormValues
 * @typedef {z.infer<typeof resetPasswordSchema>} ResetPasswordFormValues
 */
