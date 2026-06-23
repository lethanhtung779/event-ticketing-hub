'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import type { RevenueReport } from '@/types'

export default function RevenuePage() {
  const [report, setReport] = useState<RevenueReport[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)

  useEffect(() => {
    Promise.all([
      adminApi.getRevenueReport(),
      adminApi.getStats(),
    ])
      .then(([reportRes, statsRes]) => {
        const data = reportRes.data as { totalRevenue: number; totalTransactions: number; payments: { amount: number; paidAt: string; method: string }[]; byMethod: Record<string, number> }
        setTotalRevenue(data.totalRevenue || 0)
        setTotalOrders(data.totalTransactions || 0)
        setReport((data.payments || []).map((p) => ({
          date: formatDate(p.paidAt, 'dd/MM/yyyy'),
          revenue: p.amount,
          orders: 0,
        })))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const summaryCards = [
    { label: 'Tổng doanh thu', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-green-500' },
    { label: 'Tổng giao dịch', value: totalOrders, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: 'Số ngày có giao dịch', value: new Set(report.map((r) => r.date)).size, icon: Calendar, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Báo cáo doanh thu</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {summaryCards.map((card) => (
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

      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          Lịch sử giao dịch
        </h3>
        {report.length === 0 ? (
          <p className="text-sm text-gray-500 py-8 text-center">Chưa có giao dịch nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500">Ngày</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Doanh thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {report.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{r.date}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
