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
      toast.error('Không thể tải báo cáo')
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
        toast.success('Đã lưu bản dịch sự kiện!')
      } else if (transModal?.type === 'tickettype') {
        await adminApi.upsertTicketTypeTranslation(transModal.id, {
          language: transLang, name: transName,
        })
        toast.success('Đã lưu bản dịch loại vé!')
      }
      setTransModal(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Lưu thất bại'))
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
        <div className="flex items-center gap-2">
          <button onClick={openReport}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <BarChart3 className="h-4 w-4" /> Báo cáo
          </button>
          <button onClick={openEventTrans}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Languages className="h-4 w-4" /> Dịch
          </button>
          <button onClick={openWaitingList}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Clock className="h-4 w-4" /> Chờ
          </button>
          <Link
            href={`/admin/events/${event.id}/attendees`}
            className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Users className="h-4 w-4" /> Check-in
          </Link>
          <Badge className={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
        </div>
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
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openTTTrans(tt)} title="Dịch thuật">
                        <Languages className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openEditTT(tt)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {tt.soldQuantity === 0 && (
                        <Button variant="ghost" size="sm" onClick={async () => {
                        if (!confirm(`Xoá loại vé "${tt.name}"?`)) return
                        try {
                          await eventApi.deleteTicketType(params.id, tt.id)
                          toast.success('Đã xoá loại vé')
                          fetchEvent()
                        } catch {
                          toast.error('Xoá thất bại')
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

      <Modal open={waitingOpen} onClose={() => setWaitingOpen(false)} title="Danh sách chờ">
        {waitingList.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">Chưa có ai đăng ký chờ</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {waitingList.map((w: any) => (
              <div key={w.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900">{w.user?.fullName}</p>
                  <p className="text-xs text-gray-400">{w.user?.email}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="text-gray-500">SL: {w.quantity}</p>
                  <p className="text-xs text-gray-400">{formatDate(w.createdAt, 'dd/MM')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Report Modal */}
      <Modal open={reportModal} onClose={() => setReportModal(false)} title="Báo cáo sự kiện" className="!max-w-2xl">
        {reportLoading ? (
          <p className="text-center text-gray-500 py-8">Đang tải...</p>
        ) : reportData ? (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <Card className="!p-4">
                <p className="text-xs text-gray-500">Đã bán</p>
                <p className="text-xl font-bold text-gray-900">{reportData.totalSold}/{reportData.totalCapacity}</p>
              </Card>
              <Card className="!p-4">
                <p className="text-xs text-gray-500">Tỷ lệ lấp đầy</p>
                <p className="text-xl font-bold text-indigo-600">{reportData.fillRate}%</p>
              </Card>
              <Card className="!p-4">
                <p className="text-xs text-gray-500">Đánh giá TB</p>
                <p className="text-xl font-bold text-amber-500 flex items-center gap-1">
                  {reportData.avgRating ? reportData.avgRating.toFixed(1) : 'N/A'}
                  {reportData.avgRating && <Star className="h-4 w-4" />}
                </p>
              </Card>
              <Card className="!p-4">
                <p className="text-xs text-gray-500">DS chờ</p>
                <p className="text-xl font-bold text-gray-900">{reportData._count?.waitingListEntries || 0}</p>
              </Card>
            </div>

            <h4 className="font-semibold text-sm text-gray-700 mb-2">Chi tiết loại vé</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium text-gray-500">Tên</th>
                    <th className="px-3 py-2 font-medium text-gray-500">Giá</th>
                    <th className="px-3 py-2 font-medium text-gray-500">SL</th>
                    <th className="px-3 py-2 font-medium text-gray-500">Đã bán</th>
                    <th className="px-3 py-2 font-medium text-gray-500">Tỷ lệ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
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
          <p className="text-center text-gray-500 py-8">Không có dữ liệu</p>
        )}
      </Modal>

      {/* Translation Modal */}
      <Modal
        open={!!transModal}
        onClose={() => setTransModal(null)}
        title={transModal?.type === 'event' ? 'Dịch sự kiện' : 'Dịch loại vé'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ</label>
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
              <Input label="Tiêu đề" value={transTitle} onChange={(e) => setTransTitle(e.target.value)} placeholder="Dịch tiêu đề..." />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={transDesc}
                  onChange={(e) => setTransDesc(e.target.value)}
                  rows={3}
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <Input label="Địa điểm" value={transLoc} onChange={(e) => setTransLoc(e.target.value)} placeholder="Dịch địa điểm..." />
            </>
          ) : (
            <>
              <p className="text-sm text-gray-500">Đang dịch: <strong>{transModal?.name}</strong></p>
              <Input label="Tên loại vé" value={transName} onChange={(e) => setTransName(e.target.value)} placeholder="Dịch tên loại vé..." />
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setTransModal(null)}>Huỷ</Button>
            <Button loading={savingTrans} onClick={handleSaveTrans}>Lưu bản dịch</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
