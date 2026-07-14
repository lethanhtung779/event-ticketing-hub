'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { MapPin, Calendar, Clock, Star, Bell, Heart } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import EventRow from '@/components/events/EventRow'
import { formatDate, formatCurrency, getStatusColor, unwrapList, getErrorMessage, bannerUrl as bu } from '@/lib/utils'
import { eventApi, reviewApi, ticketApi, followApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { Event, Review } from '@/types'
import SeoHead from '@/components/SeoHead'

export default function EventDetailPage(props: { params: Promise<{ id: string }> }) {
  const { t } = useTranslation()
  const params = use(props.params)
  const { isAuthenticated, user } = useAuthStore()
  const [event, setEvent] = useState<Event | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewModal, setReviewModal] = useState(false)
  const [wlModal, setWlModal] = useState(false)
  const [wlTicketTypeId, setWlTicketTypeId] = useState('')
  const [wlQty, setWlQty] = useState(1)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [similarEvents, setSimilarEvents] = useState<Event[]>([])
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const fetchData = () => {
    Promise.all([
      eventApi.getById(params.id),
      reviewApi.getByEvent(params.id),
    ])
      .then(async ([eventRes, reviewRes]) => {
        const ev = eventRes.data as Event
        setEvent(ev)
        setReviews(unwrapList<Review>(reviewRes))
        if (ev.categoryId) {
          try {
            const similarRes = await eventApi.getAll({ categoryId: ev.categoryId, limit: '8' })
            const similar = unwrapList<Event>(similarRes).filter((e) => e.id !== ev.id).slice(0, 6)
            setSimilarEvents(similar)
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [params.id])

  useEffect(() => {
    if (isAuthenticated && event?.organizer) {
      followApi.check(event.organizer.id).then(res => setFollowing(res.data.isFollowing)).catch(() => {})
    }
  }, [isAuthenticated, event?.organizer?.id])

  const handleFollow = async () => {
    if (!event?.organizer) return
    setFollowLoading(true)
    try {
      if (following) {
        await followApi.unfollow(event.organizer.id)
        setFollowing(false)
        toast.success(t('eventDetail.unfollowed'))
      } else {
        await followApi.follow(event.organizer.id)
        setFollowing(true)
        toast.success(t('eventDetail.followed'))
      }
    } catch (err) {
      toast.error(getErrorMessage(err, t('eventDetail.actionFailed')))
    } finally { setFollowLoading(false) }
  }

  const handleSubmitReview = async () => {
    setSubmitting(true)
    try {
      await reviewApi.create(params.id, { rating: reviewRating, comment: reviewComment || undefined })
      toast.success(t('eventDetail.reviewSubmitted'))
      setReviewModal(false)
      setReviewComment('')
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, t('eventDetail.reviewFailed')))
    } finally { setSubmitting(false) }
  }

  const handleJoinWaitingList = async () => {
    setSubmitting(true)
    try {
      await ticketApi.joinWaitingList({ eventId: params.id, ticketTypeId: wlTicketTypeId, quantity: wlQty })
      toast.success(t('eventDetail.waitingListJoined'))
      setWlModal(false)
    } catch (err) {
      toast.error(getErrorMessage(err, t('eventDetail.waitingListFailed')))
    } finally { setSubmitting(false) }
  }

  if (loading) return <PageSpinner />
  if (!event) {
    return <div className="flex h-96 items-center justify-center text-gray-500 dark:text-gray-600">{t('common.noData')}</div>
  }

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description,
    startDate: event.startTime,
    endDate: event.endTime,
    location: event.isOnline ? {
      '@type': 'VirtualLocation',
      url: event.googleMapsLink || '',
    } : {
      '@type': 'Place',
      name: event.venueName || event.location,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.streetAddress || '',
        addressLocality: event.district || '',
        addressRegion: event.province || '',
        addressCountry: 'VN',
      },
    },
    image: event.bannerUrl ? bu(event.bannerUrl) : undefined,
    organizer: event.organizer ? {
      '@type': 'Organization',
      name: event.organizer.name,
      url: event.organizer.website || undefined,
    } : undefined,
    offers: event.ticketTypes?.map(tt => ({
      '@type': 'Offer',
      name: tt.name,
      price: tt.price,
      priceCurrency: 'VND',
      availability: tt.soldQuantity >= tt.totalQuantity ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
      validFrom: tt.saleStartTime || undefined,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SeoHead title={event?.title || t('eventDetail.reviewModalTitle')} description={event?.description?.slice(0, 160)} />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[2/1] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
            {event.bannerUrl ? (
              <img src={bu(event.bannerUrl)!} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 dark:text-gray-500 text-lg">{t('eventDetail.noBanner')}</div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge className={getStatusColor(event.status)}>{t(`status.${event.status}`)}</Badge>
              {event.category && <Badge className="bg-indigo-100 text-indigo-800 dark:bg-emerald-900/30 dark:text-emerald-300">{event.category.name}</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-neutral-900">
              <Calendar className="h-5 w-5 text-indigo-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('eventDetail.date')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(event.startTime, 'EEEE, dd/MM/yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-neutral-900">
              <Clock className="h-5 w-5 text-indigo-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('eventDetail.date')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(event.startTime, 'HH:mm')} - {formatDate(event.endTime, 'HH:mm')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4 dark:bg-neutral-900">
              <MapPin className="h-5 w-5 text-indigo-600 dark:text-emerald-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('eventDetail.location')}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{event.location}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t('eventDetail.overview')}</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line dark:text-gray-300">{event.description}</p>
          </div>

          {event.agenda && Array.isArray(event.agenda) && event.agenda.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('eventDetail.agenda')}</h2>
              <div className="space-y-3">
                {event.agenda.map((item: { time?: string; title?: string; description?: string }, i: number) => (
                  <div key={i} className="flex gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    {item.time && (
                      <div className="shrink-0 text-center">
                        <div className="text-sm font-bold text-indigo-600 dark:text-emerald-400 whitespace-nowrap">{item.time}</div>
                      </div>
                    )}
                    <div className="min-w-0">
                      {item.title && <p className="font-medium text-gray-900 dark:text-white">{item.title}</p>}
                      {item.description && <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('eventDetail.reviews')}</h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{avgRating}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">({reviews.length})</span>
                  </div>
                )}
              </div>
              {isAuthenticated && (
                <Button size="sm" variant="outline" onClick={() => setReviewModal(true)}>
                  <Star className="h-4 w-4" /> {t('eventDetail.reviews')}
                </Button>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('eventDetail.noReviews')}</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="!p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{review.user?.fullName || t('eventDetail.anonymous')}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600 dark:text-gray-300">{review.comment}</p>}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatDate(review.createdAt)}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

          <div className="space-y-6">
          {event.organizer && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('eventDetail.organizer')}</h3>
              <div className="flex items-start gap-4">
                {event.organizer.logo ? (
                  <img src={bu(event.organizer.logo)!} alt={event.organizer.name} className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 font-bold text-lg dark:bg-emerald-900/30 dark:text-emerald-400">
                    {event.organizer.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white">{event.organizer.name}</p>
                  {event.organizer.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{event.organizer.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {event.organizer._count && (
                      <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {t('eventDetail.followers', { count: event.organizer._count.follows })}</span>
                    )}
                  </div>
                  {event.organizer.email && (
                    <a href={`mailto:${event.organizer.email}`} className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-1 block">
                      {event.organizer.email}
                    </a>
                  )}
                  {event.organizer.website && (
                    <a href={event.organizer.website} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline mt-0.5 block truncate">
                      {event.organizer.website}
                    </a>
                  )}
                </div>
              </div>
              {isAuthenticated && (
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                    following
                      ? 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-neutral-800'
                      : 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${following ? 'fill-current' : ''}`} />
                  {following ? t('eventDetail.following') : t('eventDetail.follow')}
                </button>
              )}
            </Card>
          )}

          <Card>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('eventDetail.ticketTypes')}</h3>
            {event.ticketTypes && event.ticketTypes.length > 0 ? (
              <div className="space-y-3">
                {event.ticketTypes.map((tt) => {
                  const available = tt.totalQuantity - tt.soldQuantity
                  const soldOut = available <= 0
                  return (
                    <div key={tt.id} className={`rounded-lg border p-4 ${soldOut ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-neutral-900 opacity-60' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-emerald-400 transition-colors'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">{tt.name}</span>
                        <span className="font-bold text-lg text-indigo-600 dark:text-emerald-400">{formatCurrency(tt.price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{soldOut ? t('eventDetail.soldOut') : t('eventDetail.available', { count: available })}</span>
                      </div>
                      {!soldOut && isAuthenticated && event.status === 'PUBLISHED' && (
                        <Link href={`/events/${event.id}/purchase?ticketTypeId=${tt.id}`}>
                          <Button size="sm" className="mt-3 w-full">{t('eventDetail.buyTickets')}</Button>
                        </Link>
                      )}
                      {soldOut && isAuthenticated && event.status === 'PUBLISHED' && (
                        <Button size="sm" variant="outline" className="mt-3 w-full"
                          onClick={() => { setWlTicketTypeId(tt.id); setWlQty(tt.minPerOrder || 1); setWlModal(true) }}>
                          <Bell className="h-4 w-4" /> {t('eventDetail.waitingList')}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('eventDetail.noTicketTypes')}</p>
            )}

            {!isAuthenticated && (
              <div className="mt-4 rounded-lg bg-indigo-50 p-4 text-center dark:bg-emerald-900/30">
                <p className="text-sm text-indigo-800 dark:text-emerald-200 mb-2">{t('eventDetail.loginToBuy')}</p>
                <Link href="/login"><Button size="sm">{t('auth.login')}</Button></Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      {similarEvents.length > 0 && (
        <div className="mt-16">
          <EventRow title={t('eventDetail.similarEvents')} events={similarEvents} link={event.category ? `/events?categoryId=${event.categoryId}` : undefined} />
        </div>
      )}

      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title={t('eventDetail.reviewModalTitle')}>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{t('eventDetail.rating')}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setReviewRating(r)} className="p-1">
                  <Star className={`h-8 w-8 ${r <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-gray-600'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('eventDetail.reviewLabel')}</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 dark:focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-emerald-400/20 dark:bg-neutral-900 dark:text-white"
              rows={3} placeholder={t('eventDetail.reviewPlaceholder')}
              value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setReviewModal(false)}>{t('common.cancel')}</Button>
            <Button loading={submitting} onClick={handleSubmitReview}>{t('eventDetail.reviewSubmitBtn')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={wlModal} onClose={() => setWlModal(false)} title={t('eventDetail.waitingList')}>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{t('eventDetail.waitingListDesc')}</p>
        <Input label={t('eventDetail.quantity')} type="number" min={1} value={wlQty}
          onChange={(e) => setWlQty(Number(e.target.value))} />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setWlModal(false)}>{t('common.cancel')}</Button>
          <Button loading={submitting} onClick={handleJoinWaitingList}>{t('eventDetail.joinWaitingList')}</Button>
        </div>
      </Modal>
    </div>
    </>
  )
}
