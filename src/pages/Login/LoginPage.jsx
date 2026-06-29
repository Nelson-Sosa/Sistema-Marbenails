import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { loginSchema } from '@/schemas/authSchemas'
import { ROUTES } from '@/routes/routes'
import { APP_NAME } from '@/constants/app'
import LogoSrc from '@/assets/LogoMarbenails.jpeg'
import { usePageTitle } from '@/hooks/usePageTitle'
import { usePendingAction } from '@/hooks/usePendingAction'

import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

/**
 * LoginPage — public authentication screen.
 *
 * Features:
 * - Email/password login with Zod validation via React Hook Form
 * - Google sign-in button
 * - Show/hide password toggle
 * - Redirects to intended page after login (using router state.from)
 * - Loading states on both login methods
 */
function LoginPage() {
  usePageTitle('Iniciar sesión', false)

  const { login, loginWithGoogle, isAuthenticated, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const { getPendingAction, clearPendingAction } = usePendingAction()

  // Redirect to the page the user was trying to access, or services (public catalog)
  const from = location.state?.from?.pathname || ROUTES.SERVICES

  // Auto-redirect if already authenticated (covers Google sign-in redirect return)
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(from, { replace: true })
    }
  }, [loading, isAuthenticated, navigate, from])

  const handlePostLogin = () => {
    console.log('[AUDIT TEMP LoginPage] handlePostLogin — INICIO. navigate() hacia:', from)
    const pendingAction = getPendingAction()
    if (pendingAction) {
      if (pendingAction.type === 'BOOK_SERVICE') {
        clearPendingAction()
        console.log('[AUDIT TEMP LoginPage] navigate() hacia APPOINTMENTS con pendingAction')
        navigate(ROUTES.APPOINTMENTS, { 
          state: { selectedServiceId: pendingAction.payload?.serviceId },
          replace: true 
        })
        return
      }
    }
    console.log('[AUDIT TEMP LoginPage] navigate() hacia:', from)
    navigate(from, { replace: true })
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // ─── Email login ─────────────────────────────────────────────────────────
  const onSubmit = async ({ email, password }) => {
    try {
      await login(email, password)
      toast.success('¡Bienvenida de vuelta!')
      handlePostLogin()
    } catch (error) {
      const message = getFirebaseErrorMessage(error.code)
      toast.error(message)
    }
  }

  // ─── Google login ─────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    console.log('[AUDIT TEMP LoginPage] handleGoogleLogin — Inicio login Google (click)')
    setIsGoogleLoading(true)
    try {
      await loginWithGoogle()
      console.log('[AUDIT TEMP LoginPage] handleGoogleLogin — loginWithGoogle completado sin excepciones')
      toast.success('¡Bienvenida!')
      handlePostLogin()
    } catch (error) {
      console.error('[AUDIT TEMP LoginPage] handleGoogleLogin — catch disparado. Detalle del ERROR:', {
        error: error,
        code: error.code,
        message: error.message,
        stack: error.stack
      })
      toast.error('No se pudo iniciar sesión con Google')
    } finally {
      setIsGoogleLoading(false)
      console.log('[AUDIT TEMP LoginPage] handleGoogleLogin — FINALIZADO (finally)')
    }
  }

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-slate-950">
      {/* ── Branding Panel (Top on mobile, Left on desktop) ─────────────────────────── */}
      <div className="relative flex w-full flex-col items-center justify-center overflow-hidden py-12 lg:w-1/2 lg:py-0">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-600/20 via-pink-600/10 to-slate-950" />

        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-500/5 blur-2xl" />

        {/* Content - Branding Block */}
        <div 
          className="relative z-10 flex flex-col items-center justify-center gap-3 transition-transform duration-300 hover:scale-[1.02] md:gap-4"
          style={{ animation: 'fade-in-scale 400ms ease-out forwards' }}
        >
          {/* Logo App-Icon Container */}
          <div className="relative flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-[1.5rem] bg-white shadow-[0_8px_32px_rgba(225,29,72,0.2)] md:rounded-[2rem] 
                          w-[90px] h-[90px] 
                          sm:w-[100px] sm:h-[100px] 
                          md:w-[120px] md:h-[120px] 
                          lg:w-[140px] lg:h-[140px] 
                          xl:w-[160px] xl:h-[160px]">
            {/* The image is scaled up to crop excessive white margins natively without distorting */}
            <img
              src={LogoSrc}
              alt={`${APP_NAME} Logo`}
              className="h-full w-full max-w-none object-contain scale-[1.35] transition-transform duration-500"
            />
          </div>
          {/* Brand Name */}
          <h1 className="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
            {APP_NAME}
          </h1>
        </div>
      </div>

      {/* ── Right panel: Login form ────────────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center px-6 pb-12 pt-4 lg:w-1/2 lg:px-12 lg:py-0">
        <div className="w-full max-w-sm">
          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
            <p className="mt-1.5 text-sm text-slate-400">
              Ingresá tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Email/Password form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            <Input
              label="Email"
              type="email"
              id="login-email"
              placeholder="hola@marbenails.com"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Contraseña"
              type={showPassword ? 'text' : 'password'}
              id="login-password"
              placeholder="••••••••"
              autoComplete="current-password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="text-slate-400 hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              }
              error={errors.password?.message}
              {...register('password')}
            />

            {/* Forgot password link */}
            <div className="flex justify-end">
              <Link
                to="/forgot-password"
                className="text-xs text-rose-400 hover:text-rose-300 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <Button
              type="submit"
              fullWidth
              size="lg"
              loading={isSubmitting}
              className="mt-2"
            >
              Ingresar
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-xs text-slate-500">o continuá con</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          {/* Google login */}
          <Button
            variant="secondary"
            fullWidth
            size="lg"
            loading={isGoogleLoading}
            onClick={handleGoogleLogin}
            leftIcon={
              !isGoogleLoading && (
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              )
            }
          >
            Continuar con Google
          </Button>

          {/* Link to register */}
          <p className="mt-6 text-center text-sm text-slate-400">
            ¿No tenés cuenta?{' '}
            <Link
              to={ROUTES.REGISTER}
              className="text-rose-400 hover:text-rose-300 hover:underline"
            >
              Registrate
            </Link>
          </p>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-slate-600">
            {APP_NAME} © {new Date().getFullYear()}. Sistema de gestión privado.
          </p>
        </div>
      </div>
    </div>
  )
}

/**
 * Translate Firebase auth error codes to user-friendly Spanish messages.
 * @param {string} code - Firebase error code
 * @returns {string}
 */
function getFirebaseErrorMessage(code) {
  const messages = {
    'auth/invalid-credential': 'Email o contraseña incorrectos',
    'auth/user-not-found': 'No existe una cuenta con ese email',
    'auth/wrong-password': 'Contraseña incorrecta',
    'auth/too-many-requests': 'Demasiados intentos. Intentá más tarde',
    'auth/user-disabled': 'Esta cuenta fue deshabilitada',
    'auth/network-request-failed': 'Error de conexión. Verificá tu internet',
  }
  return messages[code] || 'Ocurrió un error al iniciar sesión'
}

export default LoginPage
