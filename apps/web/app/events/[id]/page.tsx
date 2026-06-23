'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { MapPin, Calendar, Clock, Star, Bell } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, unwrapList, getErrorMessage } from '@/lib/utils'
import { eventApi, reviewApi, ticketApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { Event, Review } from '@/types'

export default function EventDetailPage(props: { params: Promise<{ id: string }> }) {
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

  const fetchData = () => {
    Promise.all([
      eventApi.getById(params.id),
      reviewApi.getByEvent(params.id),
    ])
      .then(([eventRes, reviewRes]) => {
        setEvent(eventRes.data)
        setReviews(unwrapList<Review>(reviewRes))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [params.id])

  const handleSubmitReview = async () => {
    setSubmitting(true)
    try {
      await reviewApi.create(params.id, { rating: reviewRating, comment: reviewComment || undefined })
      toast.success('Đánh giá của bạn đã được gửi!')
      setReviewModal(false)
      setReviewComment('')
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gửi đánh giá thất bại'))
    } finally { setSubmitting(false) }
  }

  const handleJoinWaitingList = async () => {
    setSubmitting(true)
    try {
      await ticketApi.joinWaitingList({ eventId: params.id, ticketTypeId: wlTicketTypeId, quantity: wlQty })
      toast.success('Đã đăng ký hàng chờ! Chúng tôi sẽ thông báo khi có vé.')
      setWlModal(false)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Đăng ký thất bại'))
    } finally { setSubmitting(false) }
  }

  if (loading) return <PageSpinner />
  if (!event) {
    return <div className="flex h-96 items-center justify-center text-gray-500">Không tìm thấy sự kiện</div>
  }

  const avgRating = reviews.length > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="relative aspect-[2/1] overflow-hidden rounded-xl bg-gray-100">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} alt={event.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400 text-lg">Không có ảnh banner</div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <Badge className={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
              {event.category && <Badge className="bg-indigo-100 text-indigo-800">{event.category.name}</Badge>}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
              <Calendar className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Ngày diễn ra</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(event.startTime, 'EEEE, dd/MM/yyyy')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
              <Clock className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Thời gian</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(event.startTime, 'HH:mm')} - {formatDate(event.endTime, 'HH:mm')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-4">
              <MapPin className="h-5 w-5 text-indigo-600" />
              <div>
                <p className="text-xs text-gray-500">Địa điểm</p>
                <p className="text-sm font-medium text-gray-900">{event.location}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Mô tả</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Đánh giá</h2>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium">{avgRating}</span>
                    <span className="text-sm text-gray-500">({reviews.length})</span>
                  </div>
                )}
              </div>
              {isAuthenticated && (
                <Button size="sm" variant="outline" onClick={() => setReviewModal(true)}>
                  <Star className="h-4 w-4" /> Đánh giá
                </Button>
              )}
            </div>

            {reviews.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có đánh giá nào</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="!p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">{review.user?.fullName || 'Ẩn danh'}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    {review.comment && <p className="text-sm text-gray-600">{review.comment}</p>}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn vé</h3>
            {event.ticketTypes && event.ticketTypes.length > 0 ? (
              <div className="space-y-3">
                {event.ticketTypes.map((tt) => {
                  const available = tt.totalQuantity - tt.soldQuantity
                  const soldOut = available <= 0
                  return (
                    <div key={tt.id} className={`rounded-lg border p-4 ${soldOut ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 hover:border-indigo-300 transition-colors'}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{tt.name}</span>
                        <span className="font-bold text-lg text-indigo-600">{formatCurrency(tt.price)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{soldOut ? 'Đã hết vé' : `Còn ${available} vé`}</span>
                      </div>
                      {!soldOut && isAuthenticated && event.status === 'PUBLISHED' && (
                        <Link href={`/events/${event.id}/purchase?ticketTypeId=${tt.id}`}>
                          <Button size="sm" className="mt-3 w-full">Mua ngay</Button>
                        </Link>
                      )}
                      {soldOut && isAuthenticated && event.status === 'PUBLISHED' && (
                        <Button size="sm" variant="outline" className="mt-3 w-full"
                          onClick={() => { setWlTicketTypeId(tt.id); setWlQty(tt.minPerOrder || 1); setWlModal(true) }}>
                          <Bell className="h-4 w-4" /> Đăng ký hàng chờ
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Chưa có loại vé nào</p>
            )}

            {!isAuthenticated && (
              <div className="mt-4 rounded-lg bg-indigo-50 p-4 text-center">
                <p className="text-sm text-indigo-800 mb-2">Vui lòng đăng nhập để mua vé</p>
                <Link href="/login"><Button size="sm">Đăng nhập</Button></Link>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Modal open={reviewModal} onClose={() => setReviewModal(false)} title="Đánh giá sự kiện">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Xếp hạng</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setReviewRating(r)} className="p-1">
                  <Star className={`h-8 w-8 ${r <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nhận xét (không bắt buộc)</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={3} placeholder="Chia sẻ trải nghiệm của bạn..."
              value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setReviewModal(false)}>Huỷ</Button>
            <Button loading={submitting} onClick={handleSubmitReview}>Gửi đánh giá</Button>
          </div>
        </div>
      </Modal>

      <Modal open={wlModal} onClose={() => setWlModal(false)} title="Đăng ký hàng chờ">
        <p className="text-sm text-gray-600 mb-4">Khi có thêm vé, chúng tôi sẽ thông báo cho bạn qua email.</p>
        <Input label="Số lượng" type="number" min={1} value={wlQty}
          onChange={(e) => setWlQty(Number(e.target.value))} />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="secondary" onClick={() => setWlModal(false)}>Huỷ</Button>
          <Button loading={submitting} onClick={handleJoinWaitingList}>Đăng ký</Button>
        </div>
      </Modal>
    </div>
  )
}
