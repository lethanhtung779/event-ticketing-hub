'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { User, Lock, Mail, CheckCircle2, AlertCircle } from 'lucide-react'
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

type ProfileForm = z.infer<typeof profileSchema>

interface PasswordForm {
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
  newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  confirmNewPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
})

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, setUser, isLoading } = useAuthStore()
  const router = useRouter()
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { fullName: user?.fullName || '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const { setError } = passwordForm

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
    if (data.newPassword !== data.confirmNewPassword) {
      setError('confirmNewPassword', { message: 'Mật khẩu xác nhận không khớp' })
      return
    }
    setPasswordLoading(true)
    try {
      const { confirmNewPassword: _, ...payload } = data
      await authApi.changePassword(payload)
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
      <h1 className="text-2xl font-bold text-gray-900 mb-8">{t('profile.title')}</h1>

      <div className="space-y-6">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-indigo-600" />
            Email
          </CardTitle>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-900">{user.email}</p>
              {user.isVerified ? (
                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                  <CheckCircle2 className="h-3 w-3" /> Đã xác thực
                </p>
              ) : (
                <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="h-3 w-3" /> Chưa xác thực
                </p>
              )}
            </div>
            {!user.isVerified && (
              <Button size="sm" variant="outline" loading={verifying} onClick={async () => {
                setVerifying(true)
                try {
                  await authApi.sendVerification()
                  toast.success('Email xác thực đã được gửi!')
                } catch (err) {
                  toast.error(getErrorMessage(err, 'Gửi email thất bại'))
                } finally { setVerifying(false) }
              }}>
                Gửi lại xác thực
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" />
            {t('profile.personalInfo')}
          </CardTitle>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="mt-4 space-y-4">
            <Input label={t('auth.email')} value={user.email} disabled />
            <Input
              id="fullName"
              label={t('auth.fullName')}
              error={profileForm.formState.errors.fullName?.message}
              {...profileForm.register('fullName')}
            />
            <Button type="submit" loading={profileLoading}>
              {t('profile.save')}
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-indigo-600" />
            {t('profile.changePassword')}
          </CardTitle>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-4 space-y-4">
            <Input
              id="currentPassword"
              label={t('profile.currentPassword')}
              type="password"
              showPasswordToggle
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <Input
              id="newPassword"
              label={t('profile.newPassword')}
              type="password"
              showPasswordToggle
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <Input
              id="confirmNewPassword"
              label={t('profile.confirmNewPassword')}
              type="password"
              showPasswordToggle
              error={passwordForm.formState.errors.confirmNewPassword?.message}
              {...passwordForm.register('confirmNewPassword')}
            />
            <Button type="submit" loading={passwordLoading}>
              {t('profile.changePassword')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
