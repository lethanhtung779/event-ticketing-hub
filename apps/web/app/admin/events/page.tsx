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
      toast.success(editingEvent ? 'Cập nhật sự kiện thành công!' : 'Tạo sự kiện thành công!')
      setModalOpen(false)
      fetchEvents()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Có lỗi xảy ra'))
    } finally { setSaving(false) }
  }

  const handleConfirmAction = async () => {
    if (!confirmAction) return
    const { type, event } = confirmAction
    try {
      if (type === 'publish') {
        await eventApi.publish(event.id)
        toast.success(`Đã xuất bản "${event.title}"!`)
      } else if (type === 'cancel') {
        await eventApi.cancel(event.id)
        toast.success(`Đã huỷ "${event.title}"`)
      } else {
        await eventApi.delete(event.id)
        toast.success(`Đã xoá "${event.title}"`)
      }
      setConfirmAction(null)
      fetchEvents()
    } catch {
      toast.error(type === 'publish' ? 'Xuất bản thất bại' : type === 'cancel' ? 'Huỷ thất bại' : 'Xoá thất bại')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý sự kiện</h1>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <div className="flex items-center gap-1 mr-2">
              <span className="text-sm text-gray-500">Đã chọn {selected.size}</span>
              <Button size="sm" variant="outline" onClick={async () => { setBulkAction('publish'); setBulking(true); try { const res = await adminApi.bulkPublishEvents(Array.from(selected)); const d = res.data as {count: number}; toast.success(`Đã xuất bản ${d.count} sự kiện`); setSelected(new Set()); setBulkAction(null) } catch { toast.error('Thất bại') } finally { setBulking(false) } }} loading={bulking && bulkAction === 'publish'}>Xuất bản</Button>
              <Button size="sm" variant="outline" onClick={async () => { setBulkAction('cancel'); setBulking(true); try { const res = await adminApi.bulkCancelEvents(Array.from(selected)); const d = res.data as {count: number}; toast.success(`Đã huỷ ${d.count} sự kiện`); setSelected(new Set()); setBulkAction(null) } catch { toast.error('Thất bại') } finally { setBulking(false) } }} loading={bulking && bulkAction === 'cancel'}>Huỷ</Button>
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
            } catch { toast.error('Xuất CSV thất bại') }
          }}>
            <Download className="h-4 w-4" /> Xuất CSV
          </Button>
          <Button onClick={openCreate}><Plus className="h-4 w-4" /> Tạo sự kiện</Button>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selected.size === events.length && events.length > 0}
                    onChange={() => setSelected(selected.size === events.length ? new Set() : new Set(events.map(e => e.id)))}
                    className="rounded" />
                </th>
                <th className="px-4 py-3 font-medium text-gray-500">Tên sự kiện</th>
                <th className="px-4 py-3 font-medium text-gray-500">Danh mục</th>
                <th className="px-4 py-3 font-medium text-gray-500">Thời gian</th>
                <th className="px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12"><PageSpinner /></td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Chưa có sự kiện nào</td></tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(event.id)}
                      onChange={() => { const next = new Set(selected); next.has(event.id) ? next.delete(event.id) : next.add(event.id); setSelected(next) }}
                      className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/events/${event.id}`} className="font-medium text-gray-900 hover:text-indigo-600">
                        {event.title}
                      </Link>
                      <Link href={`/events/${event.id}`} className="text-xs text-gray-400 hover:text-indigo-500" target="_blank">
                        Xem
                      </Link>
                    </div>
                    <p className="text-xs text-gray-400">{event.location}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{event.category?.name || '---'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(event.startTime, 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(event)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {event.status === 'DRAFT' && (
                        <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'publish', event })}>
                          Xuất bản
                        </Button>
                      )}
                      {(event.status === 'PUBLISHED' || event.status === 'DRAFT') && (
                        <Button variant="ghost" size="sm" onClick={() => setConfirmAction({ type: 'cancel', event })}>
                          Huỷ
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingEvent ? 'Sửa sự kiện' : 'Tạo sự kiện'}>
        <div className="space-y-4">
          <Input label="Tiêu đề" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Input label="Địa điểm" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          <Select
            label="Danh mục"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Chọn danh mục"
          />
          <Input label="Thời gian bắt đầu" type="datetime-local" value={form.startTime}
            onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <Input label="Thời gian kết thúc" type="datetime-local" value={form.endTime}
            onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <Select
            label="Trạng thái"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'DRAFT', label: 'Nháp' },
              { value: 'PUBLISHED', label: 'Đã xuất bản' },
              { value: 'CANCELLED', label: 'Đã huỷ' },
              { value: 'COMPLETED', label: 'Hoàn thành' },
            ]}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh banner</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBannerFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button loading={saving} onClick={handleSave}>
              {editingEvent ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction?.type === 'publish' ? 'Xuất bản sự kiện' :
          confirmAction?.type === 'cancel' ? 'Huỷ sự kiện' : 'Xoá sự kiện'
        }
      >
        {confirmAction && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              {confirmAction.type === 'publish'
                ? `Bạn có chắc muốn xuất bản sự kiện này?`
                : confirmAction.type === 'cancel'
                ? `Bạn có chắc muốn huỷ sự kiện này?`
                : `Bạn có chắc muốn xoá sự kiện này? Hành động này không thể hoàn tác.`}
            </p>
            <div className="rounded-lg bg-gray-50 p-3 space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500">Tên</span>
                <span className="font-medium text-gray-900">{confirmAction.event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Địa điểm</span>
                <span className="text-gray-900">{confirmAction.event.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thời gian</span>
                <span className="text-gray-900">{formatDate(confirmAction.event.startTime, 'dd/MM/yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Trạng thái</span>
                <Badge className={getStatusColor(confirmAction.event.status)}>
                  {getStatusLabel(confirmAction.event.status)}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setConfirmAction(null)}>Huỷ</Button>
              <Button
                onClick={handleConfirmAction}
                className={
                  confirmAction.type === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                  confirmAction.type === 'cancel' ? 'bg-amber-600 hover:bg-amber-700' : ''
                }
              >
                {confirmAction.type === 'publish' ? 'Xuất bản' :
                 confirmAction.type === 'cancel' ? 'Xác nhận huỷ' : 'Xác nhận xoá'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
