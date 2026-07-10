'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  User, Lock, Mail, CheckCircle2, AlertCircle, Heart,
  Users, Calendar, ExternalLink, ShoppingBag, LayoutDashboard, Settings,
} from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { useAuthStore } from '@/stores/auth-store'
import { authApi, userApi, followApi } from '@/lib/api'
import { getErrorMessage, bannerUrl as bu, formatCurrency, formatDate } from '@/lib/utils'
import SeoHead from '@/components/SeoHead'

interface FollowedOrganizer {
  id: string
  name: string
  description: string | null
  logo: string | null
  verified: boolean
  eventCount: number
  followerCount: number
  followedAt: string
}

interface OrderTicket {
  id: string
  status: string
  ticketType: {
    id: string
    name: string
    price: number
    event: {
      id: string
      title: string
      startTime: string
      location: string
      bannerUrl: string | null
    }
  }
}

interface Order {
  id: string
  totalAmount: number
  discount: number
  finalAmount: number
  promoCode: string | null
  status: string
  paidAt: string | null
  createdAt: string
  tickets: OrderTicket[]
}

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

const tabs: { key: string; label: string; icon: any; href?: string }[] = [
  { key: 'overview', label: 'Tổng quan tài khoản', icon: LayoutDashboard },
  { key: 'settings', label: 'Cài đặt tài khoản', icon: Settings },
  { key: 'orders', label: 'Đơn hàng của tôi', icon: ShoppingBag },
  { key: 'my-events', label: 'Sự kiện của tôi', icon: Calendar, href: '/organizer/events' },
]

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, setUser, isLoading } = useAuthStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<string>('overview')
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [follows, setFollows] = useState<FollowedOrganizer[]>([])
  const [followsLoading, setFollowsLoading] = useState(true)
  const [unfollowing, setUnfollowing] = useState<string | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: { fullName: user?.fullName || '' },
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const { setError } = passwordForm

  useEffect(() => {
    followApi.getMyFollows().then(res => setFollows(res.data)).catch(() => {}).finally(() => setFollowsLoading(false))
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') {
      setOrdersLoading(true)
      userApi.getMyOrders().then(res => setOrders(res.data)).catch(() => {}).finally(() => setOrdersLoading(false))
    }
  }, [activeTab])

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

  const handleUnfollow = async (organizerId: string) => {
    setUnfollowing(organizerId)
    try {
      await followApi.unfollow(organizerId)
      setFollows(prev => prev.filter(o => o.id !== organizerId))
      toast.success('Đã bỏ theo dõi')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'))
    } finally { setUnfollowing(null) }
  }

  if (isLoading) return <PageSpinner />
  if (!user) {
    router.push('/login')
    return null
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <SeoHead title="Hồ sơ" />
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-64 shrink-0">
          <div className="flex items-center gap-3 mb-6 lg:mb-8 px-1">
            <Avatar src={user.avatar} name={user.fullName} size="md" />
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white truncate">{user.fullName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
            </div>
          </div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {tabs.map((tab) => {
              const Icon = tab.icon
              if (tab.href) {
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800 transition-colors shrink-0"
                  >
                    <Icon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    {tab.label}
                  </Link>
                )
              }
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors shrink-0 whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-800'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${activeTab === tab.key ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'}`} />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tổng quan tài khoản</h2>

              <Card>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-emerald-600" />
                  Email
                </CardTitle>
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">{user.email}</p>
                    {user.isVerified ? (
                      <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3 w-3" /> Đã xác thực
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3" /> Chưa xác thực &middot; <button onClick={() => setActiveTab('settings')} className="underline hover:text-amber-800">Xác thực ngay</button>
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-emerald-600" />
                  Đang theo dõi
                </CardTitle>
                <div className="mt-4">
                  {followsLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</p>
                  ) : follows.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                      <Heart className="mx-auto mb-2 h-8 w-8" />
                      <p className="text-sm">Chưa theo dõi nhà tổ chức nào</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {follows.map((org) => (
                        <div key={org.id} className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                          {org.logo ? (
                            <img src={bu(org.logo)!} alt={org.name} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 font-bold dark:bg-emerald-900/30 dark:text-emerald-400">
                              {org.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{org.name}</p>
                            <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {org.eventCount}</span>
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {org.followerCount}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Link href={`/events?organizerId=${org.id}`} className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                            <button
                              onClick={() => handleUnfollow(org.id)}
                              disabled={unfollowing === org.id}
                              className="rounded border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
                            >
                              {unfollowing === org.id ? '...' : 'Bỏ theo dõi'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cài đặt tài khoản</h2>

              <Card>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Thông tin cá nhân
                </CardTitle>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="mt-4 space-y-5">
                  <div className="rounded-lg bg-gray-50 dark:bg-neutral-900 p-4 space-y-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {user.email}
                      {user.isVerified ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                      )}
                    </p>
                  </div>

                  <Input
                    id="fullName"
                    label="Họ và tên"
                    error={profileForm.formState.errors.fullName?.message}
                    {...profileForm.register('fullName')}
                  />

                  <div className="flex items-center gap-3 pt-1">
                    <Button type="submit" loading={profileLoading} className="min-w-[140px]">
                      Lưu thay đổi
                    </Button>
                    {profileForm.formState.isDirty && !profileLoading && (
                      <button
                        type="button"
                        onClick={() => profileForm.reset()}
                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                      >
                        Hoàn tác
                      </button>
                    )}
                  </div>
                </form>
              </Card>

              <Card>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-emerald-600" />
                  Xác thực tài khoản
                </CardTitle>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center ${user.isVerified ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                        {user.isVerified ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Xác thực email</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {user.isVerified
                            ? 'Email của bạn đã được xác thực. Bạn có thể nhận thông báo và đặt lại mật khẩu.'
                            : 'Xác thực email để bảo vệ tài khoản và nhận thông báo về sự kiện.'
                          }
                        </p>
                      </div>
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
                      }} className="shrink-0">
                        Gửi xác thực
                      </Button>
                    )}
                  </div>

                  {!user.isVerified && (
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 p-3">
                      <div className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            Email xác thực sẽ được gửi đến <strong>{user.email}</strong>. Nếu không thấy email, hãy kiểm tra thư mục Spam.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-neutral-950 px-3 text-xs text-gray-400 dark:text-gray-500">BẢO MẬT</span>
                </div>
              </div>

              <Card>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-600" />
                  Đổi mật khẩu
                </CardTitle>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="mt-4 space-y-5">
                  <Input
                    id="currentPassword"
                    label="Mật khẩu hiện tại"
                    type="password"
                    showPasswordToggle
                    placeholder="Nhập mật khẩu hiện tại"
                    error={passwordForm.formState.errors.currentPassword?.message}
                    {...passwordForm.register('currentPassword')}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      id="newPassword"
                      label="Mật khẩu mới"
                      type="password"
                      showPasswordToggle
                      placeholder="Ít nhất 6 ký tự"
                      error={passwordForm.formState.errors.newPassword?.message}
                      {...passwordForm.register('newPassword')}
                    />
                    <Input
                      id="confirmNewPassword"
                      label="Xác nhận mật khẩu mới"
                      type="password"
                      showPasswordToggle
                      placeholder="Nhập lại mật khẩu mới"
                      error={passwordForm.formState.errors.confirmNewPassword?.message}
                      {...passwordForm.register('confirmNewPassword')}
                    />
                  </div>
                  <Button type="submit" loading={passwordLoading} className="min-w-[140px]">
                    Cập nhật mật khẩu
                  </Button>
                </form>
              </Card>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Đơn hàng của tôi</h2>

              {ordersLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</p>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
                  <ShoppingBag className="mb-4 h-12 w-12" />
                  <p className="text-lg font-medium">Chưa có đơn hàng nào</p>
                  <Link href="/events" className="mt-4 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
                    Khám phá sự kiện
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="!p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">#{order.id.slice(0, 8)}</span>
                          <Badge className={order.status === 'PAID' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}>
                            {order.status === 'PAID' ? 'Đã thanh toán' : order.status === 'PENDING' ? 'Chờ thanh toán' : order.status === 'CANCELLED' ? 'Đã hủy' : 'Đã hoàn tiền'}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatCurrency(order.finalAmount)}</p>
                      </div>
                      <div className="space-y-2">
                        {order.tickets.map((ticket) => (
                          <div key={ticket.id} className="flex items-center gap-3">
                            {ticket.ticketType.event.bannerUrl ? (
                              <img src={bu(ticket.ticketType.event.bannerUrl)!} alt="" className="h-10 w-16 rounded object-cover shrink-0" />
                            ) : (
                              <div className="h-10 w-16 rounded bg-gray-100 dark:bg-neutral-800 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <Link href={`/events/${ticket.ticketType.event.id}`} className="text-sm font-medium text-gray-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 truncate block">
                                {ticket.ticketType.event.title}
                              </Link>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {ticket.ticketType.name} &middot; {formatCurrency(ticket.ticketType.price)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
