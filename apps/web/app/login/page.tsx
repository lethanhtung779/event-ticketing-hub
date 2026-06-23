'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Ticket } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authApi, userApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { getErrorMessage } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const { data: res } = await authApi.login(data)
      const { access_token, refresh_token } = res as { access_token: string; refresh_token: string }

      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)

      const profile = await userApi.getProfile()
      const user = profile.data

      localStorage.setItem('user', JSON.stringify(user))
      useAuthStore.setState({ user, isAuthenticated: true, isLoading: false })

      toast.success('Đăng nhập thành công!')
      router.push('/')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Đăng nhập thất bại'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-indigo-600">
            <Ticket className="h-8 w-8" />
            TicketHub
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="mt-2 text-sm text-gray-600">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-700">
              Đăng ký ngay
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            id="password"
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            error={errors.password?.message}
            {...register('password')}
          />

          <div className="flex items-center justify-end">
            <Link href="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Quên mật khẩu?
            </Link>
          </div>

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Đăng nhập
          </Button>
        </form>
      </div>
    </div>
  )
}
