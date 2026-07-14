'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { organizerApi, eventApi } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart3, Ticket, DollarSign, Calendar, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@/stores/auth-store'
import type { Event } from '@/types'
import { useTranslation } from 'react-i18next'

export default function ReportsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<{
    totalEvents: number
    totalTicketsSold: number
    totalRevenue: number
    recentOrders: Array<{ id: string; finalAmount: number; paidAt: string | null; eventTitle: string }>
  } | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [noOrg, setNoOrg] = useState(false)

  useEffect(() => {
    Promise.all([
      organizerApi.getStats(),
      eventApi.getAll({ admin: 'true', limit: '100', organizerId: user?.id || '' }),
    ])
      .then(([statsRes, eventsRes]) => {
        setStats(statsRes.data as any)
        setEvents((eventsRes.data as any).data || [])
      })
      .catch((err: any) => {
        if (err?.response?.status === 404) setNoOrg(true)
      })
      .finally(() => setLoading(false))
  }, [user?.id])

  if (loading) return <PageSpinner />
  if (noOrg) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('organizer.reports')}</h1>
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('organizer.noProfile')}</p>
            <Link href="/organizer/setup">
              <Button>{t('organizer.createProfileNow')}</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('organizer.reports')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('organizer.totalEvents')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalEvents || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-50 text-green-600">
              <Ticket className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('organizer.ticketsSold')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.totalTicketsSold || 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('organizer.revenue')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalRevenue || 0)}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-amber-50 text-amber-600">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('organizer.recentOrders')}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.recentOrders?.length || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>{t('organizer.revenueByEvent')}</CardTitle>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 font-medium text-gray-600 dark:text-gray-300">{t('organizer.event')}</th>
                <th className="text-center py-3 font-medium text-gray-600 dark:text-gray-300">{t('organizer.ticketsSold')}</th>
                <th className="text-right py-3 font-medium text-gray-600 dark:text-gray-300">{t('organizer.revenue')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {events.map((event) => {
                const totalSold = event.ticketTypes?.reduce((s, t) => s + t.soldQuantity, 0) || 0
                const revenue = event.ticketTypes?.reduce((s, t) => s + t.soldQuantity * t.price, 0) || 0
                return (
                  <tr key={event.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900 dark:text-white">{event.title}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(event.startTime, 'dd/MM/yyyy')}</p>
                    </td>
                    <td className="py-3 px-4 text-center">{totalSold}</td>
                    <td className="py-3 pl-4 text-right font-medium">{formatCurrency(revenue)}</td>
                  </tr>
                )
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-400 dark:text-gray-500">{t('organizer.noData')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
