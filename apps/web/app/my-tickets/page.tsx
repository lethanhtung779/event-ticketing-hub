'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { CreditCard, QrCode, Ticket as TicketIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'
import { formatDate, formatCurrency, getStatusColor, unwrapList } from '@/lib/utils'
import { ticketApi } from '@/lib/api'
import type { Ticket } from '@/types'
import SeoHead from '@/components/SeoHead'

type TicketSection = { label: string; icon: React.ReactNode; filter: (t: Ticket) => boolean }

function MyTicketsContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const payment = searchParams.get('payment')
    if (payment === 'success') {
      toast.success(t('payment.success'))
    } else if (payment === 'failure') {
      toast.error(t('payment.failure'))
    }
  }, [searchParams, t])

  useEffect(() => {
    ticketApi
      .getMyTickets()
      .then((res) => setTickets(unwrapList<Ticket>(res)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const sections: TicketSection[] = [
    { label: t('myTickets.unpaid'), icon: <CreditCard className="h-5 w-5" />, filter: (t) => t.order?.status === 'PENDING' },
    { label: t('myTickets.valid'), icon: <TicketIcon className="h-5 w-5" />, filter: (t) => t.status === 'VALID' },
    { label: t('myTickets.used'), icon: <QrCode className="h-5 w-5" />, filter: (t) => t.status === 'CHECKED_IN' },
    { label: t('myTickets.cancelled'), icon: <TicketIcon className="h-5 w-5" />, filter: (t) => t.status === 'CANCELLED' || t.status === 'TRANSFERRED' },
  ]

  if (loading) return <PageSpinner />

  const hasTickets = tickets.length > 0

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('myTickets.title')}</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">{t('myTickets.subtitle')}</p>
      </div>

      {!hasTickets ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          <TicketIcon className="h-16 w-16 mb-4" />
          <p className="text-lg font-medium">{t('myTickets.empty')}</p>
          <Link href="/events" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700">
            {t('myTickets.exploreEvents')}
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map((section) => {
            const filtered = tickets.filter(section.filter)
            if (filtered.length === 0) return null
            return (
              <div key={section.label}>
                <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-300">
                  {section.icon}
                  <h2 className="text-lg font-semibold">{section.label}</h2>
                  <span className="text-sm text-gray-400 dark:text-gray-400">({filtered.length})</span>
                </div>
                <div className="space-y-3">
                  {filtered.map((ticket) => (
                    <Card key={ticket.id}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getStatusColor(ticket.status)}>
                              {t(`status.${ticket.status}`)}
                            </Badge>
                            {ticket.ticketType?.event?.startTime && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatDate(ticket.ticketType.event.startTime, 'dd/MM/yyyy')}
                              </span>
                            )}
                          </div>

                          <Link href={`/my-tickets/${ticket.id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white hover:text-indigo-600 transition-colors">
                              {ticket.ticketType?.event?.title || t('myTickets.event')}
                            </h3>
                          </Link>

                          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                            <span>{t('myTickets.type')}: {ticket.ticketType?.name}</span>
                            <span>{t('myTickets.price')}: {formatCurrency(ticket.ticketType?.price || 0)}</span>
                            <span>{t('myTickets.purchased')}: {formatDate(ticket.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {section.label === t('myTickets.unpaid') && (
                            <Button
                              size="sm"
                              onClick={() => router.push(`/payments/${ticket.order!.id}`)}
                            >
                              <CreditCard className="h-4 w-4 mr-1" />
                              {t('myTickets.pay')}
                            </Button>
                          )}
                          <Link
                            href={`/my-tickets/${ticket.id}`}
                            className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          >
                            <QrCode className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function MyTicketsPage() {
  const { t } = useTranslation()
  return (
    <>
      <SeoHead title={t('myTickets.title')} />
      <Suspense fallback={<PageSpinner />}>
        <MyTicketsContent />
      </Suspense>
    </>
  )
}
