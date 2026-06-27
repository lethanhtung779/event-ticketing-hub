'use client'

import { useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Ticket } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'

const resetSchema = z.object({
  newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})

type ResetForm = z.infer<typeof resetSchema>

export default function ResetPasswordPage(props: { searchParams: Promise<{ token?: string }> }) {
  const searchParams = use(props.searchParams)
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  })

  const onSubmit = async (data: ResetForm) => {
    if (!searchParams.token) {
      toast.error('Token không hợp lệ')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword({
        token: searchParams.token,
        newPassword: data.newPassword,
      })
      toast.success('Mật khẩu đã được đặt lại thành công!')
      router.push('/login')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Đặt lại mật khẩu thất bại'))
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
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Đặt lại mật khẩu</h1>
          <p className="mt-2 text-sm text-gray-600">Nhập mật khẩu mới của bạn</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <Input
            id="newPassword"
            label="Mật khẩu mới"
            type="password"
            placeholder="••••••••"
            error={errors.newPassword?.message}
            showPasswordToggle
            {...register('newPassword')}
          />
          <Input
            id="confirmPassword"
            label="Xác nhận mật khẩu"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword?.message}
            showPasswordToggle
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Đặt lại mật khẩu
          </Button>
        </form>
      </div>
    </div>
  )
}
