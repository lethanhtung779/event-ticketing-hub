'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react'
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
import { eventApi, categoryApi } from '@/lib/api'
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
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form }
      if (editingEvent) {
        await eventApi.update(editingEvent.id, payload)
        toast.success('Cập nhật sự kiện thành công!')
      } else {
        await eventApi.create(payload)
        toast.success('Tạo sự kiện thành công!')
      }
      setModalOpen(false)
      fetchEvents()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Có lỗi xảy ra'))
    } finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá sự kiện này?')) return
    try {
      await eventApi.delete(id)
      toast.success('Đã xoá sự kiện')
      fetchEvents()
    } catch {
      toast.error('Xoá thất bại')
    }
  }

  const handlePublish = async (id: string) => {
    try {
      await eventApi.publish(id)
      toast.success('Đã xuất bản sự kiện!')
      fetchEvents()
    } catch { toast.error('Xuất bản thất bại') }
  }

  const handleCancel = async (id: string) => {
    try {
      await eventApi.cancel(id)
      toast.success('Đã huỷ sự kiện')
      fetchEvents()
    } catch { toast.error('Huỷ thất bại') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý sự kiện</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> Tạo sự kiện</Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Tên sự kiện</th>
                <th className="px-4 py-3 font-medium text-gray-500">Danh mục</th>
                <th className="px-4 py-3 font-medium text-gray-500">Thời gian</th>
                <th className="px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-12"><PageSpinner /></td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Chưa có sự kiện nào</td></tr>
              ) : events.map((event) => (
                <tr key={event.id} className="hover:bg-gray-50">
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
                        <Button variant="ghost" size="sm" onClick={() => handlePublish(event.id)}>
                          Xuất bản
                        </Button>
                      )}
                      {(event.status === 'PUBLISHED' || event.status === 'DRAFT') && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(event.id)}>
                          Huỷ
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(event.id)}>
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
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Huỷ</Button>
            <Button loading={saving} onClick={handleSave}>
              {editingEvent ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
