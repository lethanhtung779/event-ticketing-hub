'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp, DollarSign, ShoppingCart, Users, BarChart3, ArrowLeft,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts'
import { Card, CardTitle } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/lib/utils'
import { adminApi } from '@/lib/api'

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi.getAnalytics()
      .then(({ data }) => setData(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />
  if (!data) return <p className="text-gray-500 dark:text-gray-400 text-center py-12">Không có dữ liệu</p>

  return (
    <div>
      <Link href="/admin" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <BarChart3 className="h-6 w-6 text-indigo-600" /> Thống kê nâng cao
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <Card className="!p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Tổng doanh thu</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.totalRevenue)}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Đơn đã thanh toán</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{data.totalPaidOrders}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Top sự kiện (vé bán)</p>
          <p className="text-xl font-bold text-indigo-600">{data.topEvents?.[0]?.totalSold || 0}</p>
        </Card>
        <Card className="!p-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Danh mục</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{data.revenueByCategory?.length || 0}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top events */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600" /> Top sự kiện bán chạy
          </CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topEvents || []} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => v.toLocaleString()} />
                <YAxis type="category" dataKey="title" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: any) => [v.toLocaleString(), 'Đã bán']} />
                <Bar dataKey="totalSold" fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue by category */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" /> Doanh thu theo danh mục
          </CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.revenueByCategory || []}
                  dataKey="revenue"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {(data.revenueByCategory || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly revenue */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" /> Doanh thu theo tháng
          </CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyRevenue || []} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : `${(v / 1_000).toFixed(0)}K`} />
                <Tooltip formatter={(v: any) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* User growth */}
        <Card>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" /> Người dùng mới theo tháng
          </CardTitle>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.userGrowth || []} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Top ticket types */}
      <Card className="mb-8">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-pink-600" /> Loại vé bán chạy nhất
        </CardTitle>
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Loại vé</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Sự kiện</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Giá</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Đã bán</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Doanh thu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {(data.ticketTypePerformance || []).map((tt: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{tt.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{tt.eventTitle}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatCurrency(tt.price)}</td>
                  <td className="px-4 py-3 font-medium text-indigo-600">{tt.soldQuantity}</td>
                  <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(tt.price * tt.soldQuantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
