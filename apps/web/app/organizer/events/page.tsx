'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, ExternalLink, Search, Calendar, MapPin, Ticket, DollarSign, AlertTriangle } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getErrorMessage, bannerUrl as bu } from '@/lib/utils'
import { eventApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { Event } from '@/types'
import { useTranslation } from 'react-i18next'

const STATUS_TABS = [
  { value: '', label: 'organizer.all' },
  { value: 'PENDING', label: 'status.PENDING' },
  { value: 'PUBLISHED', label: 'status.PUBLISHED' },
  { value: 'DRAFT', label: 'status.DRAFT' },
  { value: 'REJECTED', label: 'status.REJECTED' },
  { value: 'CANCELLED', label: 'status.CANCELLED' },
  { value: 'COMPLETED', label: 'status.COMPLETED' },
] as const

export default function OrganizerEventsPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const { user, isLoading: authLoading } = useAuthStore()
  const [deleteTarget, setDeleteTarget] = useState<Event | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [showNotesModal, setShowNotesModal] = useState(false)

  const fetchEvents = useCallback(() => {
    if (!user?.id) return
    setLoading(true)
    const params: Record<string, string> = {
      page: String(page), limit: '10', admin: 'true', organizerId: user.id,
    }
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    eventApi.getAll(params)
      .then(({ data }) => {
        setEvents(data.data || data)
        if (data.meta) {
          setTotalPages(data.meta.totalPages)
          setTotal(data.meta.total)
        }
      })
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [page, user?.id, statusFilter, search])

  useEffect(() => { if (!authLoading) fetchEvents() }, [fetchEvents, authLoading])

  useEffect(() => { setPage(1) }, [statusFilter, search])

  const handleSearch = () => {
    setSearch(searchInput)
    setPage(1)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await eventApi.delete(deleteTarget.id)
      toast.success(t('organizer.deleted'))
      setDeleteTarget(null)
      fetchEvents()
    } catch (err) {
      toast.error(getErrorMessage(err, t('organizer.deleteFailed')))
    } finally { setDeleting(false) }
  }

  const calcStats = (event: Event) => {
    const totalSold = event.ticketTypes?.reduce((s, t) => s + t.soldQuantity, 0) || 0
    const revenue = event.ticketTypes?.reduce((s, t) => s + t.soldQuantity * t.price, 0) || 0
    return { totalSold, revenue }
  }

  if (loading && !events.length) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('organizer.myEvents')}</h1>
        <Button onClick={() => setShowNotesModal(true)}>
          <Plus className="h-4 w-4" /> {t('organizer.createEvent')}
        </Button>
      </div>

      <Card className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('organizer.searchEvents')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-10 pr-3 py-2 text-sm shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors ${
                  statusFilter === tab.value
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {t(tab.label)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {events.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 mb-4">{t('organizer.noEvents')}</p>
            <Link href="/organizer/events/new">
              <Button><Plus className="h-4 w-4" /> {t('organizer.createFirstEvent')}</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-3">{t('organizer.totalEventsCount', { count: total })}</div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('organizer.event')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('organizer.time')}</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('organizer.status')}</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('organizer.sold')}</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('organizer.revenue')}</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-600 dark:text-gray-300">{t('organizer.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {events.map((event) => {
                  const { totalSold, revenue } = calcStats(event)
                  return (
                    <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                            {event.bannerUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={bu(event.bannerUrl)!} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                <Calendar className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/organizer/events/${event.id}`}
                              className="font-medium text-gray-900 dark:text-white hover:text-indigo-600 line-clamp-1"
                            >
                              {event.title}
                            </Link>
                            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{event.location}</span>
                              {event.eventType && (
                                <>
                                  <span className="mx-1">·</span>
                                  <span>{event.eventType}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          {formatDate(event.startTime, 'dd/MM/yyyy HH:mm')}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(event.status)}>
                          {getStatusLabel(event.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Ticket className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          <span className={totalSold > 0 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                            {totalSold}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <DollarSign className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                          <span className={revenue > 0 ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}>
                            {formatCurrency(revenue)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/organizer/events/${event.id}`}>
                            <Button variant="ghost" size="sm"><Edit className="h-3.5 w-3.5" /></Button>
                          </Link>
                          <Link href={`/events/${event.id}`} target="_blank">
                            <Button variant="ghost" size="sm"><ExternalLink className="h-3.5 w-3.5" /></Button>
                          </Link>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(event)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">{t('organizer.pageInfo', { current: page, total: totalPages })}</div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </>
      )}

      <Modal open={showNotesModal} onClose={() => setShowNotesModal(false)} title={t('organizer.createEventNoticeTitle')} className="max-w-xl">
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800 mb-1">Vui lòng đọc kỹ trước khi đăng tải</p>
              <ol className="list-decimal pl-4 space-y-1.5 text-amber-700">
                <li>Vui lòng không hiển thị thông tin liên lạc của Ban Tổ Chức (ví dụ: Số điện thoại/ Email/ Website/ Facebook/ Instagram&hellip;) trên banner và trong nội dung bài đăng. Chỉ sử dụng duy nhất Hotline TicketHub - 1900.6408.</li>
                <li>Trong trường hợp Ban tổ chức tạo mới hoặc cập nhật sự kiện không đúng theo quy định nêu trên, TicketHub có quyền từ chối phê duyệt sự kiện.</li>
                <li>TicketHub sẽ liên tục kiểm tra thông tin các sự kiện đang được hiển thị trên nền tảng, nếu phát hiện có sai phạm liên quan đến hình ảnh/ nội dung bài đăng, TicketHub có quyền gỡ bỏ hoặc từ chối cung cấp dịch vụ đối với các sự kiện này, dựa theo điều khoản 2.9 trong Hợp đồng dịch vụ.</li>
              </ol>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowNotesModal(false)}>{t('common.cancel')}</Button>
            <Button onClick={() => { setShowNotesModal(false); router.push('/organizer/events/new') }}>
              {t('organizer.gotIt')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('organizer.deleteEvent')}>
        {deleteTarget && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{t('organizer.deleteConfirm', { title: deleteTarget.title })}</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
              <Button loading={deleting} onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{t('organizer.delete')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
