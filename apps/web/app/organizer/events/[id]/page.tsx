'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Plus, Edit, Trash2, ExternalLink } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getErrorMessage, bannerUrl as bu } from '@/lib/utils'
import { eventApi } from '@/lib/api'
import type { Event, TicketType } from '@/types'

export default function OrganizerEventDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const [ttModal, setTtModal] = useState(false)
  const [editingTT, setEditingTT] = useState<TicketType | null>(null)
  const [ttForm, setTtForm] = useState({ name: '', price: '', totalQuantity: '', minPerOrder: '1', maxPerOrder: '', saleStartTime: '', saleEndTime: '' })

  const [form, setForm] = useState({
    title: '', description: '', location: '', isOnline: false,
    googleMapsLink: '', genre: '', startTime: '', endTime: '',
    venueName: '', province: '', district: '', streetAddress: '',

    bankName: '', bankAccountNumber: '', bankAccountHolder: '', paymentInfo: '',
  })

  const fetchData = async () => {
    try {
      const eventRes = await eventApi.getById(params.id)
      const e = eventRes.data as Event
      setEvent(e)
      setForm({
        title: e.title, description: e.description, location: e.location,
        isOnline: e.isOnline, googleMapsLink: e.googleMapsLink || '',
        genre: e.eventType || '',
        startTime: e.startTime.slice(0, 16), endTime: e.endTime.slice(0, 16),
        venueName: e.venueName || '', province: e.province || '',
        district: e.district || '', streetAddress: e.streetAddress || '',

        bankName: e.bankName || '', bankAccountNumber: e.bankAccountNumber || '',
        bankAccountHolder: e.bankAccountHolder || '', paymentInfo: e.paymentInfo || '',
      })
    } catch {
      router.push('/organizer/events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [params.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const location = [form.streetAddress, form.venueName, form.district, form.province].filter(Boolean).join(', ') || form.location
      await eventApi.update(params.id, {
        ...form,
        location,
        eventType: form.genre || undefined,
      })
      toast.success('Cập nhật thành công!')
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Cập nhật thất bại'))
    } finally { setSaving(false) }
  }

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await eventApi.publish(params.id)
      toast.success('Đã công bố sự kiện!')
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Công bố thất bại'))
    } finally { setPublishing(false) }
  }

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn huỷ sự kiện này?')) return
    setCancelling(true)
    try {
      await eventApi.cancel(params.id)
      toast.success('Đã huỷ sự kiện')
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Huỷ thất bại'))
    } finally { setCancelling(false) }
  }

  const openCreateTT = () => {
    setEditingTT(null)
    setTtForm({ name: '', price: '', totalQuantity: '', minPerOrder: '1', maxPerOrder: '', saleStartTime: '', saleEndTime: '' })
    setTtModal(true)
  }

  const openEditTT = (tt: TicketType) => {
    setEditingTT(tt)
    setTtForm({
      name: tt.name, price: String(tt.price), totalQuantity: String(tt.totalQuantity),
      minPerOrder: String(tt.minPerOrder), maxPerOrder: tt.maxPerOrder ? String(tt.maxPerOrder) : '',
      saleStartTime: tt.saleStartTime ? tt.saleStartTime.slice(0, 16) : '',
      saleEndTime: tt.saleEndTime ? tt.saleEndTime.slice(0, 16) : '',
    })
    setTtModal(true)
  }

  const handleSaveTT = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: ttForm.name, price: Number(ttForm.price), totalQuantity: Number(ttForm.totalQuantity),
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
      fetchData()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Có lỗi xảy ra'))
    } finally { setSaving(false) }
  }

  const GENRES = ['Âm nhạc', 'Thể thao', 'Nghệ thuật', 'Hội nghị', 'Giáo dục', 'Hội thảo', 'Sân khấu', 'Triển lãm', 'Workshop', 'Gây quỹ', 'Khác']
  const PROVINCES = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hoà Bình', 'Hưng Yên', 'Khánh Hoà', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hoá', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái']

  if (loading) return <PageSpinner />
  if (!event) return null

  return (
    <div>
      <Link href="/organizer/events" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> Sự kiện của tôi
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{event.title}</h1>
        <div className="flex items-center gap-2">
          {event.status === 'DRAFT' && (
            <Button loading={publishing} onClick={handlePublish} className="bg-green-600 hover:bg-green-700">Công bố</Button>
          )}
          {event.status === 'PENDING' && (
            <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Đang chờ admin duyệt</span>
          )}
          {event.status === 'REJECTED' && (
            <span className="text-sm text-red-600 dark:text-red-400 font-medium">Bị từ chối, vui lòng chỉnh sửa và gửi lại</span>
          )}
          {event.status !== 'CANCELLED' && event.status !== 'COMPLETED' && (
            <Button variant="secondary" loading={cancelling} onClick={handleCancel}>Huỷ sự kiện</Button>
          )}
          <Link href={`/events/${event.id}`} target="_blank">
            <Button variant="outline" size="sm"><ExternalLink className="h-4 w-4" /> Xem</Button>
          </Link>
          <Badge className={getStatusColor(event.status)}>{getStatusLabel(event.status)}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic info */}
        <Card>
          <CardTitle>Thông tin cơ bản</CardTitle>
          <div className="mt-4 space-y-4">
            <Input label="Tên sự kiện" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Select label="Thể loại sự kiện" value={form.genre} onChange={(e) => setForm({ ...form, genre: e.target.value })}
              options={[{ value: '', label: 'Chọn thể loại' }, ...GENRES.map(g => ({ value: g, label: g }))]} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Bắt đầu" type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
              <Input label="Kết thúc" type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
        </Card>

        {/* Location */}
        <Card>
          <CardTitle>Địa điểm</CardTitle>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isOnline} onChange={(e) => setForm({ ...form, isOnline: e.target.checked })} className="rounded border-gray-300 dark:border-gray-600" />
              <span className="text-sm text-gray-700 dark:text-gray-200">Sự kiện trực tuyến</span>
            </label>
            {!form.isOnline && (
              <>
                <Input label="Tên địa điểm" value={form.venueName} onChange={(e) => setForm({ ...form, venueName: e.target.value })} placeholder="Ví dụ: Nhà hát Hoà Bình" />
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Tỉnh / Thành phố" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}
                    options={[{ value: '', label: 'Chọn' }, ...PROVINCES.map(p => ({ value: p, label: p }))]} />
                  <Input label="Quận / Huyện" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} placeholder="Quận 1, Phường Bến Nghé..." />
                </div>
                <Input label="Số nhà / Đường" value={form.streetAddress} onChange={(e) => setForm({ ...form, streetAddress: e.target.value })} placeholder="123 Nguyễn Huệ" />
                <Input label="Google Maps" value={form.googleMapsLink} onChange={(e) => setForm({ ...form, googleMapsLink: e.target.value })} placeholder="https://maps.google.com/..." />
              </>
            )}
            {form.isOnline && (
              <Input label="Link nền tảng" value={form.streetAddress} onChange={(e) => setForm({ ...form, streetAddress: e.target.value })} placeholder="Zoom, Google Meet..." />
            )}
          </div>
        </Card>

        {/* Banner */}
        {event.bannerUrl && (
          <Card className="lg:col-span-2">
            <CardTitle>Banner</CardTitle>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={bu(event.bannerUrl)!} alt={event.title} className="mt-4 w-full h-48 object-cover rounded-lg" />
          </Card>
        )}

        {/* Description full width */}
        <Card className="lg:col-span-2">
          <CardTitle>Mô tả</CardTitle>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={5}
            className="mt-4 block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />
        </Card>

        {/* Organizer info */}
        <Card className="lg:col-span-2">
          <CardTitle>Thông tin Ban Tổ chức</CardTitle>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              {event?.organizer?.logo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bu(event.organizer.logo) ?? ''} alt={event.organizer.name} className="h-16 w-16 rounded-xl object-cover border border-gray-200 dark:border-gray-700" />
              )}
              <Input label="Tên Ban Tổ chức" value={event?.organizer?.name || ''} disabled />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Thông tin ban tổ chức được quản lý trong <Link href="/organizer/profile" className="text-indigo-500 hover:text-indigo-600">hồ sơ của bạn</Link>.</p>
          </div>
        </Card>

        {/* Payment info */}
        <Card className="lg:col-span-2">
          <CardTitle>Thông tin thanh toán</CardTitle>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tài khoản nhận tiền bán vé.</p>
          <div className="mt-4 space-y-4">
            <Input label="Tên ngân hàng" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} placeholder="Vietcombank, Techcombank..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Số tài khoản" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} placeholder="1234567890" />
              <Input label="Chủ tài khoản" value={form.bankAccountHolder} onChange={(e) => setForm({ ...form, bankAccountHolder: e.target.value })} placeholder="NGUYEN VAN A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Thông tin thêm</label>
              <textarea value={form.paymentInfo} onChange={(e) => setForm({ ...form, paymentInfo: e.target.value })} rows={3}
                placeholder="Ghi chú thêm về thanh toán..."
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
        </Card>

        {/* Ticket types */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Loại vé</CardTitle>
            <Button size="sm" onClick={openCreateTT}><Plus className="h-4 w-4" /> Thêm loại vé</Button>
          </div>
          {event.ticketTypes?.length ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {event.ticketTypes.map((tt) => (
                <div key={tt.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{tt.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatCurrency(tt.price)} &middot; {tt.soldQuantity}/{tt.totalQuantity} đã bán
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditTT(tt)}><Edit className="h-4 w-4" /></Button>
                    {tt.soldQuantity === 0 && (
                      <Button variant="ghost" size="sm" onClick={async () => {
                        if (!confirm(`Xoá "${tt.name}"?`)) return
                        try { await eventApi.deleteTicketType(params.id, tt.id); toast.success('Đã xoá'); fetchData() }
                        catch { toast.error('Xoá thất bại') }
                      }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Chưa có loại vé nào. Thêm loại vé để bắt đầu bán.</p>
          )}
        </Card>
      </div>

      <div className="mt-6 flex justify-end">
        <Button loading={saving} onClick={handleSave} className="flex items-center gap-2">
          <Save className="h-4 w-4" /> Lưu thay đổi
        </Button>
      </div>

      <Modal open={ttModal} onClose={() => setTtModal(false)} title={editingTT ? 'Sửa loại vé' : 'Thêm loại vé'}>
        <div className="space-y-4">
          <Input label="Tên loại vé" value={ttForm.name} onChange={(e) => setTtForm({ ...ttForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Giá (VND)" type="number" value={ttForm.price} onChange={(e) => setTtForm({ ...ttForm, price: e.target.value })} />
            <Input label="Tổng số lượng" type="number" value={ttForm.totalQuantity} onChange={(e) => setTtForm({ ...ttForm, totalQuantity: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tối thiểu/đơn" type="number" value={ttForm.minPerOrder} onChange={(e) => setTtForm({ ...ttForm, minPerOrder: e.target.value })} />
            <Input label="Tối đa/đơn" type="number" value={ttForm.maxPerOrder} placeholder="Không giới hạn" onChange={(e) => setTtForm({ ...ttForm, maxPerOrder: e.target.value })} />
          </div>
          <Input label="Mở bán từ" type="datetime-local" value={ttForm.saleStartTime} onChange={(e) => setTtForm({ ...ttForm, saleStartTime: e.target.value })} />
          <Input label="Kết thúc bán" type="datetime-local" value={ttForm.saleEndTime} onChange={(e) => setTtForm({ ...ttForm, saleEndTime: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setTtModal(false)}>Huỷ</Button>
            <Button loading={saving} onClick={handleSaveTT}>{editingTT ? 'Cập nhật' : 'Thêm'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
