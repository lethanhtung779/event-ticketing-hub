'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Calendar, DollarSign, ShoppingCart, Tag } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import type { AdminStats } from '@/types'

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
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
    { label: 'Tổng người dùng', value: stats?.totalUsers ?? 0, icon: Users, color: 'bg-blue-500' },
    { label: 'Tổng sự kiện', value: stats?.totalEvents ?? 0, icon: Calendar, color: 'bg-green-500' },
    { label: 'Tổng đơn hàng', value: stats?.totalOrders ?? 0, icon: ShoppingCart, color: 'bg-purple-500' },
    { label: 'Doanh thu', value: formatCurrency(stats?.totalRevenue ?? 0), icon: DollarSign, color: 'bg-amber-500' },
    { label: 'Đơn hàng gần đây', value: stats?.recentOrders ?? 0, icon: TrendingUp, color: 'bg-indigo-500' },
    { label: 'Mã giảm giá đang hoạt động', value: stats?.activePromoCodes ?? 0, icon: Tag, color: 'bg-pink-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color} text-white`}>
                <card.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
