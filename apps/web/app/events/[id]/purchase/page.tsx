'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowLeft, Minus, Plus, Ticket } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils'
import { eventApi, ticketApi } from '@/lib/api'
import type { Event, TicketType } from '@/types'

export default function PurchasePage(props: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation()
  const params = use(props.params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedTypeId = searchParams.get('ticketTypeId')?.trim()

  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoApplied, setPromoApplied] = useState('')

  useEffect(() => {
    eventApi.getById(params.id).then(({ data }) => {
      setEvent(data)
      const initial: Record<string, number> = {}
      if (selectedTypeId) {
        initial[selectedTypeId] = 1
      } else if (data.ticketTypes?.length) {
        initial[data.ticketTypes[0].id] = 1
      }
      setQuantities(initial)
    }).catch(() => router.push('/events')).finally(() => setLoading(false))
  }, [params.id, selectedTypeId, router])

  const ticketTypes = event?.ticketTypes || []
  const selectedTypes = ticketTypes.filter((tt) => (quantities[tt.id] || 0) > 0)
  const subtotal = selectedTypes.reduce((sum, tt) => sum + tt.price * (quantities[tt.id] || 0), 0)
  const total = Math.max(0, subtotal - promoDiscount)

  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 0
      const next = Math.max(0, current + delta)
      const tt = ticketTypes.find((t) => t.id === id)
      if (tt && next > (tt.maxPerOrder || 999)) return prev
      return { ...prev, [id]: next }
    })
    setPromoApplied('')
    setPromoDiscount(0)
  }

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    try {
      const { data } = await ticketApi.validatePromo({ code: promoCode, totalPrice: subtotal })
      setPromoDiscount(data.discount || 0)
      setPromoApplied(promoCode)
      toast.success(t('purchase.promoApplied'))
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('purchase.promoInvalid')
      toast.error(msg)
      setPromoDiscount(0)
      setPromoApplied('')
    }
  }

  const handlePurchase = async () => {
    const items = Object.entries(quantities).filter(([, qty]) => qty > 0)
    if (items.length === 0) {
      toast.error(t('purchase.selectAtLeastOne'))
      return
    }

    for (const [ticketTypeId] of items) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(ticketTypeId.trim())) {
        toast.error(t('purchase.invalidTicketTypeId'))
        return
      }
    }

    setPurchasing(true)
    try {
      let orderId = ''
      for (const [ticketTypeId, quantity] of items) {
        const { data } = await ticketApi.purchase({
          ticketTypeId: ticketTypeId.trim(),
          quantity: Number(quantity),
          promoCode: promoApplied || undefined,
        })
        const order = data as { orderId: string }
        if (!orderId) orderId = order.orderId
      }
      toast.success(t('purchase.success'))
      if (orderId) {
        router.push(`/payments/${orderId}`)
      } else {
        router.push('/my-tickets')
      }
    } catch (err: unknown) {
      console.error('Purchase error:', err)
      toast.error(getErrorMessage(err, t('purchase.failure')))
    } finally {
      setPurchasing(false)
    }
  }

  if (loading) return <PageSpinner />
  if (!event) return null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/events/${event.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('purchase.backToEvent')}
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('purchase.title')}</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-300">{event.title}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {ticketTypes.map((tt) => {
            const available = tt.totalQuantity - tt.soldQuantity
            const qty = quantities[tt.id] || 0
            return (
              <Card key={tt.id} className={`!p-4 ${qty > 0 ? 'ring-2 ring-indigo-500' : ''}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{tt.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('eventDetail.available', { count: available })} · {formatCurrency(tt.price)} / {t('eventDetail.ticketTypes')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQty(tt.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={qty <= 0}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{qty}</span>
                    <button
                      onClick={() => updateQty(tt.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                      disabled={qty >= available || (tt.maxPerOrder !== null && qty >= tt.maxPerOrder)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('purchase.summary')}</h3>

            <div className="space-y-2 text-sm">
              {selectedTypes.map((tt) => (
                <div key={tt.id} className="flex justify-between text-gray-600 dark:text-gray-300">
                  <span>
                    {tt.name} x{quantities[tt.id]}
                  </span>
                  <span>{formatCurrency(tt.price * (quantities[tt.id] || 0))}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-medium text-gray-900 dark:text-white">
                <span>{t('purchase.subtotal')}</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {promoDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t('purchase.discount')} ({promoApplied})</span>
                  <span>-{formatCurrency(promoDiscount)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-lg text-indigo-600">
                <span>{t('purchase.total')}</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            {subtotal > 0 && (
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder={t('purchase.promoPlaceholder')}
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="!h-9 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleApplyPromo}
                    disabled={!promoCode.trim()}
                    className="shrink-0"
                  >
                    {t('purchase.applyPromo')}
                  </Button>
                </div>
              </div>
            )}

            <Button
              className="mt-4 w-full"
              size="lg"
              loading={purchasing}
              onClick={handlePurchase}
              disabled={selectedTypes.length === 0}
            >
              <Ticket className="h-5 w-5" />
              {t('purchase.confirm')}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
