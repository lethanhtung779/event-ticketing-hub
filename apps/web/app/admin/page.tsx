'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Users, Calendar, DollarSign, ShoppingCart, Tag, ArrowUpRight } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { adminApi } from '@/lib/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .getStats()
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const cards = [
    { label: 'Tổng người dùng', value: stats?.totalUsers ?? 0, icon: Users, color: 'bg-blue-500', href: '/admin/users' },
    { label: 'Tổng sự kiện', value: stats?.totalEvents ?? 0, icon: Calendar, color: 'bg-green-500', href: '/admin/events' },
    { label: 'Tổng đơn hàng', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'bg-purple-500', href: '/admin/orders' },
    { label: 'Doanh thu', value: formatCurrency(stats?.revenue ?? 0), icon: DollarSign, color: 'bg-amber-500', href: '/admin/revenue' },
    { label: 'Vé đã bán', value: stats?.totalTickets ?? 0, icon: TrendingUp, color: 'bg-indigo-500', href: '/admin/events' },
    { label: 'Check-in', value: stats?.checkedInTickets ?? 0, icon: Tag, color: 'bg-pink-500', href: '/admin/check-in' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <Link href="/admin/revenue" className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
          Xem báo cáo <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color} text-white`}>
                  <card.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Đơn hàng gần đây</CardTitle>
          {stats?.recentOrders?.length ? (
            <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
              {stats.recentOrders.map((o: any) => (
                <Link key={o.id} href={`/admin/orders/${o.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 -mx-6 px-6 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">#{o.id.slice(0, 8)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{o.user?.fullName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(o.finalAmount)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{o.paidAt ? formatDate(o.paidAt, 'dd/MM HH:mm') : ''}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Chưa có đơn hàng nào</p>
          )}
        </Card>

        <Card>
          <CardTitle>Người dùng mới</CardTitle>
          {stats?.recentUsers?.length ? (
            <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
              {stats.recentUsers.map((u: any) => (
                <Link key={u.id} href={`/admin/users/${u.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 -mx-6 px-6 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{u.fullName}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge className={u.role === 'ADMIN' ? 'bg-red-100 text-red-800' : u.role === 'STAFF' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100'}>
                      {u.role}
                    </Badge>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(u.createdAt, 'dd/MM')}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Chưa có người dùng mới</p>
          )}
        </Card>
      </div>
    </div>
  )
}
