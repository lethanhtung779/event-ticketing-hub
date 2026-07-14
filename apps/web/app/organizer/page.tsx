'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, DollarSign, Ticket, ExternalLink } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { organizerApi } from '@/lib/api'
import { useTranslation } from 'react-i18next'

export default function OrganizerDashboard() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [noOrg, setNoOrg] = useState(false)

  useEffect(() => {
    organizerApi.getStats()
      .then(({ data }) => setStats(data))
      .catch((err: any) => {
        if (err?.response?.status === 404) setNoOrg(true)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />
  if (noOrg) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('organizer.tabOverview')}</h1>
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('organizer.tabOverview')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Link href="/organizer/events">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500 text-white">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('organizer.events')}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalEvents ?? 0}</p>
              </div>
            </div>
          </Card>
        </Link>
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500 text-white">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('organizer.ticketsSold')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.totalTicketsSold ?? 0}</p>
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500 text-white">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('organizer.revenue')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-indigo-600" />
          {t('organizer.recentOrders')}
        </CardTitle>
        {stats?.recentOrders?.length ? (
          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {stats.recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{o.eventTitle}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">#{o.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-600">{formatCurrency(o.finalAmount)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{o.paidAt ? formatDate(o.paidAt, 'dd/MM HH:mm') : ''}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">{t('organizer.noOrders')}</p>
        )}
      </Card>
    </div>
  )
}
