'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getErrorMessage } from '@/lib/utils'
import { eventApi } from '@/lib/api'
import type { Event, TicketType } from '@/types'

export default function AdminEventDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [ttModal, setTtModal] = useState(false)
  const [editingTT, setEditingTT] = useState<TicketType | null>(null)
  const [saving, setSaving] = useState(false)
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
        toast.success('Cập nhật loại vé thành công!')
      } else {
        await eventApi.createTicketType(params.id, payload)
        toast.success('Thêm loại vé thành công!')
      }
      setTtModal(false)
      fetchEvent()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Có lỗi xảy ra'))
    } finally { setSaving(false) }
  }

  if (loading) return <PageSpinner />
  if (!event) return null

  return (
    <div>
      <Link href="/admin/events" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> Quản lý sự kiện
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {event.location} &middot; {formatDate(event.startTime, 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
        <Badge className={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle>Loại vé</CardTitle>
          <Button size="sm" onClick={openCreateTT}><Plus className="h-4 w-4" /> Thêm loại vé</Button>
        </div>

        {event.ticketTypes?.length ? (
          <div className="divide-y divide-gray-100">
            {event.ticketTypes.map((tt) => {
              const available = tt.totalQuantity - tt.soldQuantity
              return (
                <div key={tt.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">{tt.name}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(tt.price)} &middot; {tt.soldQuantity}/{tt.totalQuantity} đã bán &middot; còn {available}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEditTT(tt)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 py-4">Chưa có loại vé nào</p>
        )}
      </Card>

      <Modal open={ttModal} onClose={() => setTtModal(false)} title={editingTT ? 'Sửa loại vé' : 'Thêm loại vé'}>
        <div className="space-y-4">
          <Input label="Tên loại vé" value={ttForm.name} onChange={(e) => setTtForm({ ...ttForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Giá (VND)" type="number" value={ttForm.price}
              onChange={(e) => setTtForm({ ...ttForm, price: e.target.value })} />
            <Input label="Tổng số lượng" type="number" value={ttForm.totalQuantity}
              onChange={(e) => setTtForm({ ...ttForm, totalQuantity: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tối thiểu/đơn" type="number" value={ttForm.minPerOrder}
              onChange={(e) => setTtForm({ ...ttForm, minPerOrder: e.target.value })} />
            <Input label="Tối đa/đơn" type="number" value={ttForm.maxPerOrder} placeholder="Không giới hạn"
              onChange={(e) => setTtForm({ ...ttForm, maxPerOrder: e.target.value })} />
          </div>
          <Input label="Mở bán từ" type="datetime-local" value={ttForm.saleStartTime}
            onChange={(e) => setTtForm({ ...ttForm, saleStartTime: e.target.value })} />
          <Input label="Kết thúc bán" type="datetime-local" value={ttForm.saleEndTime}
            onChange={(e) => setTtForm({ ...ttForm, saleEndTime: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setTtModal(false)}>Huỷ</Button>
            <Button loading={saving} onClick={handleSaveTT}>{editingTT ? 'Cập nhật' : 'Thêm'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
