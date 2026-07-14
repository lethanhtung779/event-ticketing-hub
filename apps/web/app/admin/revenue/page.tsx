'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, DollarSign, ShoppingCart, Calendar, RotateCcw, Printer } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts'
import toast from 'react-hot-toast'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { PageSpinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils'
import { adminApi, paymentApi } from '@/lib/api'
import { useTranslation } from 'react-i18next'

interface PaymentItem {
  amount: number
  paidAt: string
  method: string
  orderId: string
}

function groupPayments(payments: PaymentItem[], groupBy: 'day' | 'month' | 'year') {
  return Object.entries(
    payments.reduce<Record<string, number>>((acc, p) => {
      let key: string
      if (groupBy === 'year') {
        key = formatDate(p.paidAt, 'yyyy')
      } else if (groupBy === 'month') {
        key = formatDate(p.paidAt, 'MM/yyyy')
      } else {
        key = formatDate(p.paidAt, 'dd/MM')
      }
      acc[key] = (acc[key] || 0) + p.amount
      return acc
    }, {})
  )
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => {
      if (groupBy === 'year') return a.date.localeCompare(b.date)
      const [aD, aM, aY] = a.date.split(/[/]/).map(Number)
      const [bD, bM, bY] = b.date.split(/[/]/).map(Number)
      if (aY !== bY) return aY - bY
      if (groupBy === 'month') return aM - bM
      return aM !== bM ? aM - bM : aD - bD
    })
}

export default function RevenuePage() {
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalOrders, setTotalOrders] = useState(0)
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [groupBy, setGroupBy] = useState<'day' | 'month' | 'year'>('month')
  const { t } = useTranslation()

  const [refundModal, setRefundModal] = useState(false)
  const [refundOrderId, setRefundOrderId] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  const fetchData = async (from?: string, to?: string) => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (from) params.fromDate = from
      if (to) params.toDate = to

      const [reportRes, statsRes] = await Promise.all([
        adminApi.getRevenueReport(params),
        adminApi.getStats(params),
      ])

      const data = reportRes.data as {
        totalRevenue: number
        totalTransactions: number
        payments: PaymentItem[]
        byMethod: Record<string, number>
      }
      setTotalRevenue(data.totalRevenue || 0)
      setTotalOrders(data.totalTransactions || 0)
      setPayments(data.payments || [])
    } catch {
      toast.error(t('admin.toastDataLoadFailed'))
    } finally {
      setLoading(false)
    }
  }

  const chartData = useMemo(() => groupPayments(payments, groupBy), [payments, groupBy])

  useEffect(() => { fetchData() }, [])

  const handleFilter = () => fetchData(fromDate || undefined, toDate || undefined)

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      toast.error(t('admin.toastRequireReason'))
      return
    }
    setRefunding(true)
    try {
      await paymentApi.refund({ orderId: refundOrderId, reason: refundReason })
      toast.success(t('admin.toastRefundSuccess'))
      setRefundModal(false)
      setRefundReason('')
      fetchData(fromDate || undefined, toDate || undefined)
    } catch (err) {
      toast.error(getErrorMessage(err, t('admin.toastRefundFailed')))
    } finally {
      setRefunding(false)
    }
  }

  const openRefund = (orderId: string) => {
    setRefundOrderId(orderId)
    setRefundReason('')
    setRefundModal(true)
  }

  if (loading) return <PageSpinner />

  const summaryCards = [
    { label: t('admin.totalRevenue'), value: formatCurrency(totalRevenue), icon: DollarSign, color: 'bg-green-500' },
    { label: t('admin.totalTransactions'), value: totalOrders, icon: ShoppingCart, color: 'bg-blue-500' },
    { label: t('admin.daysWithTransactions'), value: new Set(payments.map((p) => formatDate(p.paidAt, 'dd/MM/yyyy'))).size, icon: Calendar, color: 'bg-purple-500' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.revenueReport')}</h1>
        <Button variant="secondary" size="sm" onClick={() => window.print()} className="flex items-center gap-2">
          <Printer className="h-4 w-4" /> {t('admin.printPdf')}
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex items-end gap-3">
          <Input label={t('admin.filterFromDate')} type="date" value={fromDate}
            onChange={(e) => setFromDate(e.target.value)} />
          <Input label={t('admin.filterToDate')} type="date" value={toDate}
            onChange={(e) => setToDate(e.target.value)} />
          <Button onClick={handleFilter} className="mb-0.5">{t('admin.filterBtn')}</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {summaryCards.map((card) => (
          <Card key={card.label}>
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
        ))}
      </div>

      {payments.length > 0 && (
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-indigo-600" />
              {t('admin.revenueChart')}
            </CardTitle>
            <Select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'month' | 'year')}
              options={[
                { value: 'day', label: t('admin.byDay') },
                { value: 'month', label: t('admin.byMonth') },
                { value: 'year', label: t('admin.byYear') },
              ]}
              className="!w-32"
            />
          </div>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v)}
                />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), t('admin.revenueLabel')]}
                  labelStyle={{ fontWeight: 600 }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  dot={{ r: 3, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 5, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <Card>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          {t('admin.transactionHistory')}
        </CardTitle>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{t('admin.noTransactions')}</p>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colDate')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colRevenue')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colMethod')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colOrderId')}</th>
                  <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {payments.map((p, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">{formatDate(p.paidAt, 'dd/MM/yyyy')}</td>
                    <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(p.amount)}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.method}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">{p.orderId.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" onClick={() => openRefund(p.orderId)}>
                        <RotateCcw className="h-4 w-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={refundModal} onClose={() => setRefundModal(false)} title={t('admin.refundOrder')}>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {t('admin.confirmRefundText', { id: refundOrderId.slice(0, 8), amount: '' })}
        </p>
        <Input
          label={t('admin.refundReason')}
          value={refundReason}
          onChange={(e) => setRefundReason(e.target.value)}
          placeholder={t('admin.refundReasonPlaceholder')}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRefundModal(false)}>{t('common.cancel')}</Button>
          <Button loading={refunding} onClick={handleRefund} className="bg-red-600 hover:bg-red-700">
            {t('admin.refundConfirm')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
