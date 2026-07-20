import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { registerSchema } from '@/schemas/authSchemas'
import { ROUTES } from '@/routes/routes'
import { APP_NAME } from '@/constants/app'
import LogoSrc from '@/assets/LogoMarbenails.jpeg'
import { usePageTitle } from '@/hooks/usePageTitle'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

function RegisterPage() {
  usePageTitle('Crear cuenta', false)

  const { register: registerUser, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const from = location.state?.from?.pathname || ROUTES.SERVICES

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [loading, isAuthenticated, navigate, from])

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async ({ displayName, email, password }) => {
    try {
      await registerUser(email, password, displayName)
      toast.success('¡Cuenta creada con éxito!')
      navigate(from, { replace: true })
    } catch (error) {
      const message = getFirebaseErrorMessage(error.code)
      toast.error(message)
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-brand-bg">
      {/* ── Branding Panel ──────────────────────────────────── */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-12 lg:w-1/2 lg:py-0">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-pastel via-brand-pastel/30 to-brand-bg" />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-brand-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-brand-secondary/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/10 blur-2xl" />

        <div
          className="relative z-10 flex flex-col items-center justify-center gap-3 transition-transform duration-300 hover:scale-[1.02] md:gap-4"
          style={{ animation: 'fade-in-scale 400ms ease-out forwards' }}
        >
          <div className="relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-white shadow-xl md:rounded-[2rem] 
                          w-[90px] h-[90px] 
                          sm:w-[100px] sm:h-[100px] 
                          md:w-[120px] md:h-[120px] 
                          lg:w-[140px] lg:h-[140px] 
                          xl:w-[160px] xl:h-[160px]">
            <img
              src={LogoSrc}
              alt={`${APP_NAME} Logo`}
              className="h-full w-full max-w-none object-contain scale-[1.35] transition-transform duration-500"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text md:text-3xl lg:text-4xl">
            {APP_NAME}
          </h1>
        </div>
      </div>

      {/* ── Register Form ───────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center px-6 pb-12 pt-4 lg:w-1/2 lg:px-12 lg:py-0">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-brand-text">Crear cuenta</h2>
            <p className="mt-1.5 text-sm font-medium text-brand-text-muted">
              Completá tus datos para registrarte
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            <Input
              label="Nombre"
              type="text"
              id="register-name"
              placeholder="Tu nombre"
              autoComplete="name"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.displayName?.message}
              {...formRegister('displayName')}
            />

            <Input
              label="Email"
              type="email"
              id="register-email"
              placeholder="hola@marbenails.com"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...formRegister('email')}
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="register-password"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="text-brand-text-muted hover:text-brand-primary"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...formRegister('password')}
            />

            <Input
              label="Confirmar contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              id="register-confirm-password"
              placeholder="••••••••"
              autoComplete="new-password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="text-brand-text-muted hover:text-brand-primary"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.confirmPassword?.message}
              {...formRegister('confirmPassword')}
            />

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              className="mt-2"
            >
              Crear cuenta
            </Button>
          </form>

          {/* Footer link to login */}
          <p className="mt-8 text-center text-sm font-medium text-brand-text-muted">
            ¿Ya tenés cuenta?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="text-brand-primary hover:text-brand-primary-hover hover:underline"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function getFirebaseErrorMessage(code) {
  const messages = {
    'auth/email-already-in-use': 'Este email ya está registrado',
    'auth/invalid-email': 'El email ingresado no es válido',
    'auth/weak-password': 'La contraseña es demasiado débil',
    'auth/network-request-failed': 'Error de conexión. Verificá tu internet',
    'auth/too-many-requests': 'Demasiados intentos. Intentá más tarde',
  }
  return messages[code] || 'Ocurrió un error al crear la cuenta'
}

export default RegisterPage
