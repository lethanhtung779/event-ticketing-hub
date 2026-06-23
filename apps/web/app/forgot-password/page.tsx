'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Ticket, ArrowLeft } from 'lucide-react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { authApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'

const forgotSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
})

type ForgotForm = z.infer<typeof forgotSchema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotForm>({
    resolver: zodResolver(forgotSchema),
  })

  const onSubmit = async (data: ForgotForm) => {
    setLoading(true)
    try {
      await authApi.forgotPassword(data.email)
      setSent(true)
      toast.success('Email khôi phục mật khẩu đã được gửi!')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Gửi yêu cầu thất bại'))
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
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Quên mật khẩu</h1>
          <p className="mt-2 text-sm text-gray-600">
            Nhập email của bạn để nhận liên kết khôi phục mật khẩu
          </p>
        </div>

        {sent ? (
          <div className="rounded-xl bg-green-50 p-6 text-center">
            <p className="text-green-800 font-medium">
              Email khôi phục mật khẩu đã được gửi!
            </p>
            <p className="mt-2 text-sm text-green-600">
              Vui lòng kiểm tra hộp thư đến của bạn.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              Gửi yêu cầu
            </Button>
          </form>
        )}

        <div className="text-center">
          <Link href="/login" className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="h-4 w-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
