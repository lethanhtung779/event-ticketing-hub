'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Plus, Edit, Trash2, Users, Clock,
  BarChart3, Languages, FileText, Star,
} from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getErrorMessage } from '@/lib/utils'
import { eventApi, adminApi } from '@/lib/api'
import type { Event, TicketType } from '@/types'
import { useTranslation } from 'react-i18next'

export default function AdminEventDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [waitingList, setWaitingList] = useState<any[]>([])
  const [waitingOpen, setWaitingOpen] = useState(false)
  const [ttModal, setTtModal] = useState(false)
  const [editingTT, setEditingTT] = useState<TicketType | null>(null)
  const [saving, setSaving] = useState(false)
  const { t } = useTranslation()

  const [reportModal, setReportModal] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [reportLoading, setReportLoading] = useState(false)

  const [transModal, setTransModal] = useState<{ type: 'event' | 'tickettype'; id: string; name?: string } | null>(null)
  const [transLang, setTransLang] = useState('en')
  const [transTitle, setTransTitle] = useState('')
  const [transDesc, setTransDesc] = useState('')
  const [transLoc, setTransLoc] = useState('')
  const [transName, setTransName] = useState('')
  const [savingTrans, setSavingTrans] = useState(false)

  const [ttForm, setTtForm] = useState({
    name: '', price: '', totalQuantity: '', minPerOrder: '1', maxPerOrder: '',
    saleStartTime: '', saleEndTime: '',
  })

  const fetchEvent = () => {
    eventApi.getById(params.id)
      .then(({ data }) => setEvent(data))
      .catch(() => router.push('/admin/events'))
      .finally(() => setLoading(false))
  }

  const openWaitingList = async () => {
    setWaitingOpen(true)
    try {
      const { data } = await adminApi.getWaitingList(params.id)
      setWaitingList(data as any[])
    } catch { setWaitingList([]) }
  }

  const openReport = async () => {
    setReportModal(true)
    setReportLoading(true)
    try {
      const { data } = await adminApi.getEventReport(params.id)
      setReportData(data)
    } catch {
      toast.error(t('admin.toastReportFailed'))
    } finally { setReportLoading(false) }
  }

  const openEventTrans = () => {
    setTransModal({ type: 'event', id: params.id })
    setTransLang('en')
    setTransTitle('')
    setTransDesc('')
    setTransLoc('')
    setTransName('')
  }

  const openTTTrans = (tt: TicketType) => {
    setTransModal({ type: 'tickettype', id: tt.id, name: tt.name })
    setTransLang('en')
    setTransName('')
  }

  const handleSaveTrans = async () => {
    setSavingTrans(true)
    try {
      if (transModal?.type === 'event') {
        await adminApi.upsertEventTranslation(transModal.id, {
          language: transLang, title: transTitle || undefined,
          description: transDesc || undefined, location: transLoc || undefined,
        })
        toast.success(t('admin.toastEventTranslationSaved'))
      } else if (transModal?.type === 'tickettype') {
        await adminApi.upsertTicketTypeTranslation(transModal.id, {
          language: transLang, name: transName,
        })
        toast.success(t('admin.toastTTTranslationSaved'))
      }
      setTransModal(null)
    } catch (err) {
      toast.error(getErrorMessage(err, t('admin.toastCategorySaveFailed')))
    } finally { setSavingTrans(false) }
  }

  useEffect(() => { fetchEvent() }, [params.id])

  const openCreateTT = () => {
    setEditingTT(null)
    setTtForm({ name: '', price: '', totalQuantity: '', minPerOrder: '1', maxPerOrder: '', saleStartTime: '', saleEndTime: '' })
    setTtModal(true)
  }

  const openEditTT = (tt: TicketType) => {
    setEditingTT(tt)
    setTtForm({
      name: tt.name,
      price: String(tt.price),
      totalQuantity: String(tt.totalQuantity),
      minPerOrder: String(tt.minPerOrder),
      maxPerOrder: tt.maxPerOrder ? String(tt.maxPerOrder) : '',
      saleStartTime: tt.saleStartTime ? tt.saleStartTime.slice(0, 16) : '',
      saleEndTime: tt.saleEndTime ? tt.saleEndTime.slice(0, 16) : '',
    })
    setTtModal(true)
  }

  const handleSaveTT = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: ttForm.name,
        price: Number(ttForm.price),
        totalQuantity: Number(ttForm.totalQuantity),
        minPerOrder: Number(ttForm.minPerOrder),
      }
      if (ttForm.maxPerOrder) payload.maxPerOrder = Number(ttForm.maxPerOrder)
      if (ttForm.saleStartTime) payload.saleStartTime = ttForm.saleStartTime
      if (ttForm.saleEndTime) payload.saleEndTime = ttForm.saleEndTime

      if (editingTT) {
        await eventApi.updateTicketType(params.id, editingTT.id, payload)
        toast.success(t('admin.toastTTUpdated'))
      } else {
        await eventApi.createTicketType(params.id, payload)
        toast.success(t('admin.toastTTAdded'))
      }
      setTtModal(false)
      fetchEvent()
    } catch (err) {
      toast.error(getErrorMessage(err, t('common.error')))
    } finally { setSaving(false) }
  }

  if (loading) return <PageSpinner />
  if (!event) return null

  return (
    <div>
      <Link href="/admin/events" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> {t('admin.eventManagement')}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {event.location} &middot; {formatDate(event.startTime, 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openReport}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 transition-colors"
          >
            <BarChart3 className="h-4 w-4" /> {t('admin.report')}
          </button>
          <button onClick={openEventTrans}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 transition-colors"
          >
            <Languages className="h-4 w-4" /> {t('admin.translate')}
          </button>
          <button onClick={openWaitingList}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 transition-colors"
          >
            <Clock className="h-4 w-4" /> {t('admin.waitingList')}
          </button>
          <Link
            href={`/admin/events/${event.id}/attendees`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50 transition-colors"
          >
            <Users className="h-4 w-4" /> {t('admin.checkIn')}
          </Link>
          <Badge className={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>{t('admin.ticketTypes')}</CardTitle>
          <Button size="sm" onClick={openCreateTT}><Plus className="h-4 w-4" /> {t('admin.addTicketType')}</Button>
        </div>

        {event.ticketTypes?.length ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {event.ticketTypes.map((tt) => {
              const available = tt.totalQuantity - tt.soldQuantity
              return (
                <div key={tt.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{tt.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(tt.price)} &middot; {tt.soldQuantity}/{tt.totalQuantity} {t('admin.ttSold')} &middot; {t('admin.ttRemaining')} {available}
                    </p>
                  </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openTTTrans(tt)} title={t('admin.translate')}>
                        <Languages className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditTT(tt)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {tt.soldQuantity === 0 && (
                        <Button variant="ghost" size="sm" onClick={async () => {
                        if (!confirm(t('admin.confirmDeleteTicketType'))) return
                        try {
                          await eventApi.deleteTicketType(params.id, tt.id)
                          toast.success(t('admin.toastTTDeleted'))
                          fetchEvent()
                        } catch {
                          toast.error(t('admin.toastTTDeleteFailed'))
                        }
                      }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">{t('admin.noTicketTypes')}</p>
        )}
      </Card>

      <Modal open={ttModal} onClose={() => setTtModal(false)} title={editingTT ? t('admin.editTicketType') : t('admin.addTicketType')}>
        <div className="space-y-4">
          <Input label={t('admin.ttName')} value={ttForm.name} onChange={(e) => setTtForm({ ...ttForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('admin.ttPrice')} type="number" value={ttForm.price}
              onChange={(e) => setTtForm({ ...ttForm, price: e.target.value })} />
            <Input label={t('admin.ttQuantity')} type="number" value={ttForm.totalQuantity}
              onChange={(e) => setTtForm({ ...ttForm, totalQuantity: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('admin.ttMinPerOrder')} type="number" value={ttForm.minPerOrder}
              onChange={(e) => setTtForm({ ...ttForm, minPerOrder: e.target.value })} />
            <Input label={t('admin.ttMaxPerOrder')} type="number" value={ttForm.maxPerOrder} placeholder={t('admin.ttMaxPerOrderPlaceholder')}
              onChange={(e) => setTtForm({ ...ttForm, maxPerOrder: e.target.value })} />
          </div>
          <Input label={t('admin.ttSaleStart')} type="datetime-local" value={ttForm.saleStartTime}
            onChange={(e) => setTtForm({ ...ttForm, saleStartTime: e.target.value })} />
          <Input label={t('admin.ttSaleEnd')} type="datetime-local" value={ttForm.saleEndTime}
            onChange={(e) => setTtForm({ ...ttForm, saleEndTime: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setTtModal(false)}>{t('common.cancel')}</Button>
            <Button loading={saving} onClick={handleSaveTT}>{editingTT ? t('admin.ttUpdate') : t('admin.ttAdd')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={waitingOpen} onClose={() => setWaitingOpen(false)} title={t('admin.waitingList')}>
        {waitingList.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">{t('admin.noWaitingList')}</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {waitingList.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{w.user?.fullName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{w.user?.email}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-500 dark:text-gray-400">{t('admin.waitingListQty')}: {w.quantity}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatDate(w.createdAt, 'dd/MM')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Report Modal */}
      <Modal open={reportModal} onClose={() => setReportModal(false)} title={t('admin.report')} className="!max-w-2xl">
        {reportLoading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('common.loading')}</p>
        ) : reportData ? (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card className="!p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.sold')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{reportData.totalSold}/{reportData.totalCapacity}</p>
              </Card>
              <Card className="!p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.fillRate')}</p>
                <p className="text-xl font-bold text-indigo-600">{reportData.fillRate}%</p>
              </Card>
              <Card className="!p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.avgRating')}</p>
                <p className="text-xl font-bold text-amber-500 flex items-center gap-1">
                  {reportData.avgRating ? reportData.avgRating.toFixed(1) : 'N/A'}
                  {reportData.avgRating && <Star className="h-4 w-4" />}
                </p>
              </Card>
              <Card className="!p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.waitingCount')}</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{reportData._count?.waitingListEntries || 0}</p>
              </Card>
            </div>

            <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-200 mb-2">{t('admin.ttDetail')}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">{t('admin.colTtName')}</th>
                    <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">{t('admin.colPrice')}</th>
                    <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">{t('admin.colQuantity')}</th>
                    <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">{t('admin.colSold')}</th>
                    <th className="px-3 py-2 font-medium text-gray-500 dark:text-gray-400">{t('admin.colRate')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {reportData.ticketTypes?.map((tt: any) => (
                    <tr key={tt.id}>
                      <td className="px-3 py-2 font-medium">{tt.name}</td>
                      <td className="px-3 py-2">{formatCurrency(tt.price)}</td>
                      <td className="px-3 py-2">{tt.totalQuantity}</td>
                      <td className="px-3 py-2">{tt.soldQuantity}</td>
                      <td className="px-3 py-2">
                        {tt.totalQuantity > 0
                          ? Math.round((tt.soldQuantity / tt.totalQuantity) * 100)
                          : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">{t('admin.noData')}</p>
        )}
      </Modal>

      {/* Translation Modal */}
      <Modal
        open={!!transModal}
        onClose={() => setTransModal(null)}
        title={transModal?.type === 'event' ? t('admin.translateEvent') : t('admin.translateTicketType')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('admin.fieldLanguage')}</label>
            <Select
              value={transLang}
              onChange={(e) => setTransLang(e.target.value)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'vi', label: 'Tiếng Việt' },
              ]}
            />
          </div>
          {transModal?.type === 'event' ? (
            <>
              <Input label={t('admin.transTitle')} value={transTitle} onChange={(e) => setTransTitle(e.target.value)} placeholder={t('admin.transTitlePlaceholder')} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('admin.transDesc')}</label>
                <textarea
                  value={transDesc}
                  onChange={(e) => setTransDesc(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm"
                />
              </div>
              <Input label={t('admin.transLoc')} value={transLoc} onChange={(e) => setTransLoc(e.target.value)} placeholder={t('admin.transLocPlaceholder')} />
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.translatingFor')} <strong>{transModal?.name}</strong></p>
              <Input label={t('admin.transName')} value={transName} onChange={(e) => setTransName(e.target.value)} placeholder={t('admin.transNamePlaceholder')} />
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setTransModal(null)}>{t('common.cancel')}</Button>
            <Button loading={savingTrans} onClick={handleSaveTrans}>{t('admin.saveTranslation')}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
