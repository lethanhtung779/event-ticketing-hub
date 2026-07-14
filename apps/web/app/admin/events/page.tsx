'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, MoreHorizontal, Download, CheckSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, unwrapList, unwrapMeta, getErrorMessage } from '@/lib/utils'
import { eventApi, categoryApi, adminApi } from '@/lib/api'
import type { Event, Category } from '@/types'
import { useTranslation } from 'react-i18next'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '', description: '', location: '', categoryId: '',
    startTime: '', endTime: '', status: 'DRAFT',
  })
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ type: 'publish' | 'cancel' | 'delete'; event: Event } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkAction, setBulkAction] = useState<'publish' | 'cancel' | null>(null)
  const [bulking, setBulking] = useState(false)
  const { t } = useTranslation()

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await eventApi.getAll({ page: String(page), limit: '10', admin: 'true' })
      setEvents(unwrapList<Event>(res))
      const meta = unwrapMeta(res)
      if (meta) setTotalPages(meta.totalPages)
    } catch { setEvents([]) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    fetchEvents()
    categoryApi.getAll().then((res) => setCategories(unwrapList<Category>(res))).catch(() => {})
  }, [page])

  const openCreate = () => {
    setEditingEvent(null)
    setForm({ title: '', description: '', location: '', categoryId: '', startTime: '', endTime: '', status: 'DRAFT' })
    setBannerFile(null)
    setModalOpen(true)
  }

  const openEdit = (event: Event) => {
    setEditingEvent(event)
    setForm({
      title: event.title,
      description: event.description,
      location: event.location,
      categoryId: event.categoryId || '',
      startTime: event.startTime.slice(0, 16),
      endTime: event.endTime.slice(0, 16),
      status: event.status,
    })
    setBannerFile(null)
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      let eventId = editingEvent?.id
      if (editingEvent) {
        await eventApi.update(editingEvent.id, payload)
      } else {
        const { status: _, ...createPayload } = payload
        const { data } = await eventApi.create(createPayload)
        eventId = (data as { id: string }).id
      }
      if (bannerFile && eventId) {
        const fd = new FormData()
        fd.append('file', bannerFile)
        await eventApi.uploadBanner(eventId, fd)
      }
      toast.success(editingEvent ? t('admin.toastUpdated') : t('admin.toastCreated'))
      setModalOpen(false)
      fetchEvents()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('common.error')))
    } finally { setSaving(false) }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    const { type, event } = confirmAction
    try {
      if (type === 'publish') {
        await eventApi.publish(event.id)
        toast.success(t('admin.toastPublished'))
      } else if (type === 'cancel') {
        await eventApi.cancel(event.id)
        toast.success(t('admin.toastCancelled'))
      } else {
        await eventApi.delete(event.id)
        toast.success(t('admin.toastDeleted'))
      }
      setConfirmAction(null)
      fetchEvents()
    } catch {
      toast.error(type === 'publish' ? t('admin.toastPublishFailed') : type === 'cancel' ? t('admin.toastCancelFailed') : t('admin.toastDeleteFailed'))
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.eventManagement')}</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <div className="flex items-center gap-1 mr-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('admin.selected')} {selected.size}</span>
              <Button size="sm" variant="outline" onClick={async () => { setBulkAction('publish'); setBulking(true); try { const res = await adminApi.bulkPublishEvents(Array.from(selected)); const d = res.data as {count: number}; toast.success(t('admin.toastBulkPublished', { count: d.count })); setSelected(new Set()); setBulkAction(null) } catch { toast.error(t('admin.toastBulkFailed')) } finally { setBulking(false) } }} loading={bulking && bulkAction === 'publish'}>{t('admin.bulkPublish')}</Button>
              <Button size="sm" variant="outline" onClick={async () => { setBulkAction('cancel'); setBulking(true); try { const res = await adminApi.bulkCancelEvents(Array.from(selected)); const d = res.data as {count: number}; toast.success(t('admin.toastBulkCancelled', { count: d.count })); setSelected(new Set()); setBulkAction(null) } catch { toast.error(t('admin.toastBulkFailed')) } finally { setBulking(false) } }} loading={bulking && bulkAction === 'cancel'}>{t('admin.bulkCancel')}</Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={async () => {
            try {
              const res = await adminApi.exportEvents()
              const blob = new Blob([res.data as BlobPart], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = 'events.csv'; a.click()
              URL.revokeObjectURL(url)
            } catch { toast.error(t('admin.toastExportFailed')) }
          }}>
            <Download className="h-4 w-4" /> {t('admin.exportCsv')}
          </Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> {t('admin.createEvent')}</Button>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.size === events.length && events.length > 0}
                    onChange={() => setSelected(selected.size === events.length ? new Set() : new Set(events.map(e => e.id)))}
                    className="rounded" />
                </th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colEventName')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colCategory')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colTime')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colStatus')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12"><PageSpinner /></td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">{t('admin.noEvents')}</td></tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(event.id)}
                      onChange={() => { const next = new Set(selected); next.has(event.id) ? next.delete(event.id) : next.add(event.id); setSelected(next) }}
                      className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/events/${event.id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600">
                        {event.title}
                      </Link>
                      <Link href={`/events/${event.id}`} className="text-xs text-gray-400 dark:text-gray-500 hover:text-indigo-500" target="_blank">
                        {t('admin.view')}
                      </Link>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{event.location}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{event.category?.name || '---'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(event.startTime, 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(event)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {event.status === 'PENDING' && (
                        <>
                          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700" onClick={async () => { try { await eventApi.approve(event.id); toast.success(t('admin.toastApproved')); fetchEvents() } catch { toast.error(t('admin.toastApprovalFailed')) } }}>
                            {t('admin.approve')}
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={async () => { try { await eventApi.reject(event.id); toast.success(t('admin.toastRejected')); fetchEvents() } catch { toast.error(t('admin.toastApprovalFailed')) } }}>
                            {t('admin.reject')}
                          </Button>
                        </>
                      )}
                      {event.status === 'DRAFT' && (
                        <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'publish', event })}>
                          {t('admin.publish')}
                        </Button>
                      )}
                      {(event.status === 'PUBLISHED' || event.status === 'DRAFT') && (
                        <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'cancel', event })}>
                          {t('admin.cancel')}
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'delete', event })}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? t('admin.editEvent') : t('admin.createEvent')}>
        <div className="space-y-4">
          <Input label={t('admin.fieldTitle')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('admin.fieldDescription')}</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Input label={t('admin.fieldLocation')} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Select
            label={t('admin.fieldCategory')}
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder={t('admin.selectCategory')}
          />
          <Input label={t('admin.fieldStartTime')} type="datetime-local" value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <Input label={t('admin.fieldEndTime')} type="datetime-local" value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <Select
            label={t('admin.fieldStatus')}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'DRAFT', label: t('admin.statusDraft') },
              { value: 'PENDING', label: t('admin.statusPending') },
              { value: 'PUBLISHED', label: t('admin.statusPublished') },
              { value: 'REJECTED', label: t('admin.statusRejected') },
              { value: 'CANCELLED', label: t('admin.statusCancelled') },
              { value: 'COMPLETED', label: t('admin.statusCompleted') },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('admin.fieldBanner')}</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button loading={saving} onClick={handleSave}>
              {editingEvent ? t('admin.update') : t('admin.create')}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.type === 'publish' ? t('admin.publishEvent') :
          confirmAction?.type === 'cancel' ? t('admin.cancelEvent') : t('admin.deleteEvent')
        }
      >
        {confirmAction && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {confirmAction.type === 'publish'
                ? t('admin.confirmPublish')
                : confirmAction.type === 'cancel'
                ? t('admin.confirmCancel')
                : t('admin.confirmDeleteText')}
            </p>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('admin.colEventName')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{confirmAction.event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('admin.fieldLocation')}</span>
                <span className="text-gray-900 dark:text-white">{confirmAction.event.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('admin.colTime')}</span>
                <span className="text-gray-900 dark:text-white">{formatDate(confirmAction.event.startTime, 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('admin.colStatus')}</span>
                <Badge className={getStatusColor(confirmAction.event.status)}>
                  {getStatusLabel(confirmAction.event.status)}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmAction(null)}>{t('common.cancel')}</Button>
              <Button
                onClick={handleConfirmAction}
                className={
                  confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  confirmAction.type === 'cancel' ? 'bg-amber-600 hover:bg-amber-700' : ''
                }
              >
                {confirmAction.type === 'publish' ? t('admin.btnConfirmPublish') :
                 confirmAction.type === 'cancel' ? t('admin.btnConfirmCancel') : t('admin.btnConfirmDelete')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
