'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { Ticket } from 'lucide-react'
import { GoogleLogin, GoogleOAuthProvider } from '@react-oauth/google'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authApi, userApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { getErrorMessage } from '@/lib/utils'
import SeoHead from '@/components/SeoHead'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const handleAuthSuccess = async (res: { access_token: string; refresh_token: string }) => {
    const { access_token, refresh_token } = res

    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)

    const profile = await userApi.getProfile()
    const user = profile.data

    localStorage.setItem('user', JSON.stringify(user))
    useAuthStore.setState({ user, isAuthenticated: true, isLoading: false })

    toast.success(t('auth.loginSuccess'))
    router.push('/')
  }

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const { data: res } = await authApi.login(data)
      await handleAuthSuccess(res as { access_token: string; refresh_token: string })
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('auth.loginFailure')))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return
    setGoogleLoading(true)
    try {
      const { data: res } = await authApi.googleLogin(credentialResponse.credential)
      await handleAuthSuccess(res as { access_token: string; refresh_token: string })
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Đăng nhập Google thất bại'))
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <SeoHead title="Đăng nhập" />
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-indigo-600">
              <Ticket className="h-8 w-8" />
              {t('app.name')}
            </Link>
            <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">{t('auth.login')}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {t('auth.noAccount')}{' '}
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
                {t('auth.registerNow')}
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

            <div className="flex items-center justify-end">
              <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {t('auth.login')}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white dark:bg-neutral-950 px-3 text-xs text-gray-400 dark:text-gray-500">HOẶC</span>
            </div>
          </div>

          <div className="flex justify-center">
            {googleLoading ? (
              <div className="flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-6 py-2.5 text-sm text-gray-500">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-emerald-600" />
                Đang đăng nhập...
              </div>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => toast.error('Đăng nhập Google thất bại')}
                theme="outline"
                size="large"
                text="signin_with"
                shape="pill"
                width="320"
              />
            )}
          </div>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}
