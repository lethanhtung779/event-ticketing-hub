'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { User, Lock } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/auth-store'
import { authApi, userApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const { user, setUser, isLoading } = useAuthStore()
  const router = useRouter()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { fullName: user?.fullName || '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onProfileSubmit = async (data: ProfileForm) => {
    setProfileLoading(true)
    try {
      const { data: res } = await userApi.updateProfile(data)
      setUser(res)
      toast.success('Cập nhật hồ sơ thành công!')
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Cập nhật hồ sơ thất bại'))
    } finally {
      setProfileLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordLoading(true)
    try {
      await authApi.changePassword(data)
      toast.success('Đổi mật khẩu thành công!')
      passwordForm.reset()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Đổi mật khẩu thất bại'))
    } finally {
      setPasswordLoading(false)
    }
  }

  if (isLoading) return <PageSpinner />
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Hồ sơ của tôi</h1>

      <div className="space-y-6">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            Thông tin cá nhân
          </CardTitle>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="mt-4 space-y-4">
            <Input label="Email" value={user.email} disabled />
            <Input
              id="fullName"
              label="Họ tên"
              error={profileForm.formState.errors.fullName?.message}
              {...profileForm.register('fullName')}
            />
            <Button type="submit" loading={profileLoading}>
              Lưu thay đổi
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600" />
            Đổi mật khẩu
          </CardTitle>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-4 space-y-4">
            <Input
              id="currentPassword"
              label="Mật khẩu hiện tại"
              type="password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              id="newPassword"
              label="Mật khẩu mới"
              type="password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Button type="submit" loading={passwordLoading}>
              Đổi mật khẩu
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
