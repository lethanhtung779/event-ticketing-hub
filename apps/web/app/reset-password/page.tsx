'use client'

import { useState, use, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Ticket } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'
import SeoHead from '@/components/SeoHead'

export default function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const { t } = useTranslation()
  const searchParams = use(props.searchParams)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const resetSchema = useMemo(() => z.object({
    newPassword: z.string().min(6, t('auth.passwordMinLength')),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: t('auth.passwordMismatch'),
    path: ['confirmPassword'],
  }), [t])

  type ResetForm = z.infer<typeof resetSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetForm) => {
    if (!searchParams.token) {
      toast.error(t('auth.invalidResetToken'))
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword({
        token: searchParams.token,
        newPassword: data.newPassword,
      })
      toast.success(t('auth.resetPasswordSuccess'))
      router.push('/login')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('auth.resetPasswordFailed')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <SeoHead title={t('auth.resetPassword')} />
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-indigo-600">
            <Ticket className="h-8 w-8" />
            {t('app.name')}
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">{t('auth.resetPassword')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{t('auth.resetPasswordDescription')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <Input
            id="newPassword"
            label={t('profile.newPassword')}
            type="password"
            placeholder="••••••••"
            error={errors.newPassword?.message}
            showPasswordToggle
            {...register('newPassword')}
          />
          <Input
            id="confirmPassword"
            label={t('auth.confirmPassword')}
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            showPasswordToggle
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            {t('auth.resetPassword')}
          </Button>
        </form>
      </div>
    </div>
  )
}
