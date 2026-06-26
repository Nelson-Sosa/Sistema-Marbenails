import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { UserCircle, Phone, Mail, Save, MessageCircle, Key } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuth } from '@/context/AuthContext'
import { usePageTitle } from '@/hooks/usePageTitle'
import { useUpdateUserProfile } from '@/hooks/useUserProfile'
import { USER_ROLES } from '@/constants/app'
import { formatPhoneDisplayPY, formatPhoneStoragePY } from '@/utils/formatters'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

const profileSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z
    .string()
    .optional()
    .transform((v) => v?.trim() || '')
    .refine(
      (v) => v === '' || /^[\d\s\-()]{6,20}$/.test(v),
      'Número de teléfono inválido (escribí solo los números locales)'
    ),
  whatsappOptIn: z.boolean().optional(),
})

export default function ProfilePage() {
  usePageTitle('Mi Perfil')
  const { user, userProfile, role, sendPasswordReset } = useAuth()
  const { mutateAsync: updateProfile, isPending } = useUpdateUserProfile()

  const isAdmin = role === USER_ROLES.ADMIN

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: userProfile?.displayName || user?.displayName || '',
      phone: formatPhoneDisplayPY(userProfile?.phone),
      whatsappOptIn: userProfile?.whatsappOptIn ?? false,
    },
  })

  useEffect(() => {
    if (userProfile) {
      reset({
        displayName: userProfile.displayName || '',
        phone: formatPhoneDisplayPY(userProfile.phone),
        whatsappOptIn: userProfile.whatsappOptIn ?? false,
      })
    }
  }, [userProfile, reset])

  const phoneValue = watch('phone')

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        phone: formatPhoneStoragePY(data.phone)
      }
      await updateProfile(payload)
      toast.success('Perfil actualizado correctamente')
    } catch (err) {
      toast.error('No se pudo actualizar el perfil')
    }
  }

  const handlePasswordReset = async () => {
    try {
      await sendPasswordReset(user?.email)
      toast.success('Te enviamos un correo para restablecer tu contraseña')
    } catch (error) {
      toast.error('No se pudo enviar el correo de restablecimiento')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 flex-wrap">
        {userProfile?.photoURL ? (
          <img
            src={userProfile.photoURL}
            alt={userProfile.displayName}
            className="h-16 w-16 rounded-full border-2 border-slate-700 object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
            <UserCircle className="h-9 w-9 text-slate-400" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {isAdmin 
              ? 'Gestiona tu información de cuenta.'
              : 'Actualizá tus datos de contacto para recibir recordatorios de tus turnos por WhatsApp.'}
          </p>
        </div>
      </div>

      {/* ── USER ONLY: Phone missing banner ───────────────────────────────── */}
      {!isAdmin && !userProfile?.phone && (
        <div className="flex items-start sm:items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <MessageCircle className="h-5 w-5 flex-shrink-0 text-amber-400 mt-0.5 sm:mt-0" />
          <p className="text-sm text-amber-300">
            <strong>Agregá tu número de teléfono</strong> para recibir recordatorios de tus turnos por WhatsApp.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Personal Info ─────────────────────────────────────────────────── */}
        <Card>
          <Card.Header title="Información personal" />
          <Card.Body>
            <div className="space-y-4">
              <Input
                label="Nombre completo"
                id="profile-displayName"
                placeholder="Tu nombre"
                leftIcon={<UserCircle className="h-4 w-4" />}
                error={errors.displayName?.message}
                {...register('displayName')}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-slate-200">Correo electrónico</label>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-800 bg-slate-800/50 px-3 opacity-70">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span className="text-sm text-slate-400">{user?.email}</span>
                  <span className="ml-auto rounded px-1.5 py-0.5 text-xs font-medium bg-slate-700 text-slate-400">
                    No editable
                  </span>
                </div>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* ── USER ONLY: Contact Info ───────────────────────────────────────── */}
        {!isAdmin && (
          <Card>
            <Card.Header title="Contacto y WhatsApp" />
            <Card.Body>
              <div className="space-y-4">
                <Input
                  label="Número de teléfono"
                  id="profile-phone"
                  placeholder="0986321987"
                  leftIcon={<Phone className="h-4 w-4" />}
                  error={errors.phone?.message}
                  {...register('phone')}
                />

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-rose-500 focus:ring-rose-500 cursor-pointer"
                    {...register('whatsappOptIn')}
                    disabled={!phoneValue?.trim()}
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      Deseo recibir recordatorios por WhatsApp
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Te avisaremos 24hs antes de tu turno. {!phoneValue?.trim() && '(Requiere número de teléfono)'}
                    </p>
                  </div>
                </label>
              </div>
            </Card.Body>
          </Card>
        )}

        {/* ── Actions ───────────────────────────────────────────────────────── */}
        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isPending}
            disabled={!isDirty}
            leftIcon={<Save className="h-4 w-4" />}
          >
            Guardar cambios
          </Button>
        </div>
      </form>

      {/* ── ADMIN ONLY: Account Info & Security ─────────────────────────────── */}
      {isAdmin && (
        <>
          <Card>
            <Card.Header title="Información de la cuenta" />
            <Card.Body>
              <div className="space-y-3 rounded-lg bg-slate-800/30 p-4">
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-sm text-slate-400">Rol</span>
                  <span className="text-sm font-medium text-slate-200">Administrador</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-3">
                  <span className="text-sm text-slate-400">Fecha de registro</span>
                  <span className="text-sm font-medium text-slate-200">
                    {userProfile?.createdAt?.seconds 
                      ? format(new Date(userProfile.createdAt.seconds * 1000), "d 'de' MMMM, yyyy", { locale: es })
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-sm text-slate-400 shrink-0">UID</span>
                  <span className="text-xs font-mono text-slate-500 truncate max-w-[160px] sm:max-w-[280px]" title={user?.uid}>{user?.uid}</span>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header title="Seguridad" />
            <Card.Body>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-200">Contraseña</h3>
                  <p className="text-xs text-slate-500">Te enviaremos un correo para cambiar tu contraseña.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handlePasswordReset} leftIcon={<Key className="h-4 w-4" />} className="self-start sm:self-auto">
                  Cambiar contraseña
                </Button>
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  )
}
