'use client'

import { useState, useMemo } from 'react'
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

export default function RegisterPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const registerSchema = useMemo(() => z.object({
    fullName: z.string().min(1, t('auth.required', { field: t('auth.fullName') })),
    email: z.string().email(t('auth.invalidEmail')),
    password: z.string().min(6, t('auth.passwordMinLength')),
    confirmPassword: z.string().min(1, t('auth.required', { field: t('auth.confirmPassword') })),
  }).refine((data) => data.password === data.confirmPassword, {
    message: t('auth.passwordMismatch'),
    path: ['confirmPassword'],
  }), [t])

  type RegisterForm = z.infer<typeof registerSchema>

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterForm) => {
    setLoading(true)
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      })
      toast.success(t('auth.registerSuccess'))
      router.push('/login')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('auth.registerFailure')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <SeoHead title={t('auth.register')} />
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-indigo-600">
            <Ticket className="h-8 w-8" />
            {t('app.name')}
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">{t('auth.register')}</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {t('auth.hasAccount')}{' '}
            <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
              {t('auth.loginNow')}
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <Input
            id="fullName"
            label={t('auth.fullName')}
            placeholder="Nguyen Van A"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            id="email"
            label={t('auth.email')}
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            id="password"
            label={t('auth.password')}
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            showPasswordToggle
            {...register('password')}
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
            {t('auth.register')}
          </Button>
          <p className="text-center text-xs text-gray-400 dark:text-gray-400">
            {t('auth.termsAgreement')}
          </p>
        </form>
      </div>
    </div>
  )
}
