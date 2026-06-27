'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Save, Upload, AlertTriangle, X, Image, Plus, Edit, Trash2, Check, ChevronRight } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { getErrorMessage } from '@/lib/utils'
import { eventApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'

const GENRES = ['Âm nhạc', 'Thể thao', 'Nghệ thuật', 'Hội nghị', 'Giáo dục', 'Hội thảo', 'Sân khấu', 'Triển lãm', 'Workshop', 'Gây quỹ', 'Khác']
const PROVINCES = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'An Giang', 'Bà Rịa - Vũng Tàu', 'Bắc Giang', 'Bắc Kạn', 'Bạc Liêu', 'Bắc Ninh', 'Bến Tre', 'Bình Định', 'Bình Dương', 'Bình Phước', 'Bình Thuận', 'Cà Mau', 'Cao Bằng', 'Đắk Lắk', 'Đắk Nông', 'Điện Biên', 'Đồng Nai', 'Đồng Tháp', 'Gia Lai', 'Hà Giang', 'Hà Nam', 'Hà Tĩnh', 'Hải Dương', 'Hậu Giang', 'Hoà Bình', 'Hưng Yên', 'Khánh Hoà', 'Kiên Giang', 'Kon Tum', 'Lai Châu', 'Lâm Đồng', 'Lạng Sơn', 'Lào Cai', 'Long An', 'Nam Định', 'Nghệ An', 'Ninh Bình', 'Ninh Thuận', 'Phú Thọ', 'Phú Yên', 'Quảng Bình', 'Quảng Nam', 'Quảng Ngãi', 'Quảng Ninh', 'Quảng Trị', 'Sóc Trăng', 'Sơn La', 'Tây Ninh', 'Thái Bình', 'Thái Nguyên', 'Thanh Hoá', 'Thừa Thiên Huế', 'Tiền Giang', 'Trà Vinh', 'Tuyên Quang', 'Vĩnh Long', 'Vĩnh Phúc', 'Yên Bái']

interface TicketTypeForm {
  name: string
  price: string
  totalQuantity: string
  minPerOrder: string
  maxPerOrder: string
  saleStartTime: string
  saleEndTime: string
}

const emptyTicket: TicketTypeForm = { name: '', price: '', totalQuantity: '', minPerOrder: '1', maxPerOrder: '', saleStartTime: '', saleEndTime: '' }

const STEPS = [
  { id: 1, label: 'Thông tin sự kiện' },
  { id: 2, label: 'Thời gian & Loại vé' },
  { id: 3, label: 'Cài đặt' },
  { id: 4, label: 'Thông tin thanh toán' },
]

export default function CreateEventPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [showNotice, setShowNotice] = useState(true)

  // Step 1
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [description, setDescription] = useState('')
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [organizerName, setOrganizerName] = useState(user?.fullName || '')
  const [organizerInfo, setOrganizerInfo] = useState('')

  // Step 2
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [ticketTypes, setTicketTypes] = useState<TicketTypeForm[]>([])
  const [ttModal, setTtModal] = useState(false)
  const [editingTT, setEditingTT] = useState<number | null>(null)
  const [ttForm, setTtForm] = useState<TicketTypeForm>({ ...emptyTicket })

  // Step 3
  const [isOnline, setIsOnline] = useState(false)
  const [venueName, setVenueName] = useState('')
  const [province, setProvince] = useState('')
  const [district, setDistrict] = useState('')
  const [streetAddress, setStreetAddress] = useState('')
  const [googleMapsLink, setGoogleMapsLink] = useState('')

  // Step 4
  const [bankName, setBankName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankAccountHolder, setBankAccountHolder] = useState('')
  const [paymentInfo, setPaymentInfo] = useState('')

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!title.trim() || !description.trim()) {
        toast.error('Vui lòng điền tên và mô tả sự kiện')
        return false
      }
      return true
    }
    if (s === 2) {
      if (!startTime || !endTime) {
        toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc')
        return false
      }
      if (ticketTypes.length === 0) {
        toast.error('Vui lòng thêm ít nhất một loại vé')
        return false
      }
      return true
    }
    return true
  }

  const nextStep = () => {
    if (validateStep(step)) setStep(prev => Math.min(prev + 1, 4))
  }

  const prevStep = () => setStep(prev => Math.max(prev - 1, 1))

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2)) return
    setSaving(true)
    try {
      const location = [streetAddress, venueName, district, province].filter(Boolean).join(', ') || 'Đang cập nhật'
      const { data } = await eventApi.create({
        title,
        description,
        location,
        eventType: genre || undefined,
        startTime,
        endTime,
        isOnline,
        googleMapsLink: googleMapsLink || undefined,
        venueName: venueName || undefined,
        province: province || undefined,
        district: district || undefined,
        streetAddress: streetAddress || undefined,
        organizerName: organizerName || undefined,
        organizerInfo: organizerInfo || undefined,
        bankName: bankName || undefined,
        bankAccountNumber: bankAccountNumber || undefined,
        bankAccountHolder: bankAccountHolder || undefined,
        paymentInfo: paymentInfo || undefined,
      })
      const event = data as any

      if (bannerFile) {
        try {
          const fd = new FormData()
          fd.append('file', bannerFile)
          await eventApi.uploadBanner(event.id, fd)
        } catch {
          toast.error('Upload banner thất bại')
        }
      }

      if (logoFile) {
        try {
          const fd = new FormData()
          fd.append('file', logoFile)
          await eventApi.uploadBanner(event.id, fd)
        } catch { /* ignore */ }
      }

      for (const tt of ticketTypes) {
        const payload: Record<string, unknown> = {
          name: tt.name,
          price: Number(tt.price),
          totalQuantity: Number(tt.totalQuantity),
          minPerOrder: Number(tt.minPerOrder),
        }
        if (tt.maxPerOrder) payload.maxPerOrder = Number(tt.maxPerOrder)
        if (tt.saleStartTime) payload.saleStartTime = tt.saleStartTime
        if (tt.saleEndTime) payload.saleEndTime = tt.saleEndTime
        await eventApi.createTicketType(event.id, payload)
      }

      toast.success('Tạo sự kiện thành công!')
      router.push(`/organizer/events/${event.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Tạo sự kiện thất bại'))
    } finally {
      setSaving(false)
    }
  }

  const handleBanner = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const openCreateTT = () => {
    setEditingTT(null)
    setTtForm({ ...emptyTicket })
    setTtModal(true)
  }

  const openEditTT = (index: number) => {
    setEditingTT(index)
    setTtForm({ ...ticketTypes[index] })
    setTtModal(true)
  }

  const handleSaveTT = () => {
    if (!ttForm.name.trim() || !ttForm.price || !ttForm.totalQuantity) {
      toast.error('Vui lòng điền đầy đủ thông tin loại vé')
      return
    }
    if (editingTT !== null) {
      const updated = [...ticketTypes]
      updated[editingTT] = { ...ttForm }
      setTicketTypes(updated)
    } else {
      setTicketTypes(prev => [...prev, { ...ttForm }])
    }
    setTtModal(false)
  }

  const handleDeleteTT = (index: number) => {
    setTicketTypes(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/organizer/events" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> Sự kiện của tôi
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tạo sự kiện mới</h1>

      {/* Step indicator */}
      <div className="flex items-center justify-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              step === s.id ? 'bg-indigo-600 text-white' : step > s.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {step > s.id ? <Check className="h-4 w-4" /> : <span className="flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold border-2 border-current">{s.id}</span>}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="h-4 w-4 mx-2 text-gray-300" />}
          </div>
        ))}
      </div>

      {showNotice && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 relative">
          <button onClick={() => setShowNotice(false)} className="absolute top-3 right-3 text-amber-500 hover:text-amber-700">
            <X className="h-4 w-4" />
          </button>
          <div className="flex gap-3 pr-6">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 space-y-1.5">
              <p className="font-semibold">LƯU Ý KHI ĐĂNG TẢI SỰ KIỆN</p>
              <p>1. Vui lòng không hiển thị thông tin liên lạc của Ban Tổ Chức (ví dụ: Số điện thoại/ Email/ Website/ Facebook/ Instagram…) trên banner và trong nội dung bài đăng. Chỉ sử dụng duy nhất Hotline TicketHub - 1900.6408.</p>
              <p>2. Trong trường hợp Ban tổ chức tạo mới hoặc cập nhật sự kiện không đúng theo quy định nêu trên, TicketHub có quyền từ chối phê duyệt sự kiện.</p>
              <p>3. TicketHub sẽ liên tục kiểm tra thông tin các sự kiện đang được hiển thị trên nền tảng, nếu phát hiện có sai phạm liên quan đến hình ảnh/ nội dung bài đăng, TicketHub có quyền gỡ bỏ hoặc từ chối cung cấp dịch vụ đối với các sự kiện này, dựa theo điều khoản 2.9 trong Hợp đồng dịch vụ.</p>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardTitle>Thông tin cơ bản</CardTitle>
            <div className="mt-4 space-y-4">
              <Input label="Tên sự kiện *" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tên sự kiện..." />
              <Select label="Thể loại sự kiện" value={genre} onChange={e => setGenre(e.target.value)}
                options={[{ value: '', label: 'Chọn thể loại' }, ...GENRES.map(g => ({ value: g, label: g }))]} />
            </div>
          </Card>
          <Card>
            <CardTitle>Hình ảnh & Mô tả</CardTitle>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner sự kiện</label>
                <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                  {bannerPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={bannerPreview} alt="Preview" className="h-full object-contain" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Upload className="h-8 w-8 mx-auto mb-2" />
                      <span className="text-sm">Chọn ảnh banner (1200x600px khuyến nghị)</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBanner} />
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả chi tiết *</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={5}
                  placeholder="Mô tả sự kiện, thông tin nghệ sĩ/diễn giả, lịch trình chương trình..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
          </Card>
          <Card>
            <CardTitle>Thông tin Ban Tổ chức</CardTitle>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo Ban Tổ chức</label>
                <label className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
                  {logoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoPreview} alt="Logo preview" className="h-full object-contain" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Image className="h-6 w-6 mx-auto mb-1" />
                      <span className="text-xs">Chọn logo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                </label>
              </div>
              <Input label="Tên Ban Tổ chức" value={organizerName} onChange={e => setOrganizerName(e.target.value)} placeholder="Tên đơn vị tổ chức" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin Ban Tổ chức</label>
                <textarea value={organizerInfo} onChange={e => setOrganizerInfo(e.target.value)} rows={3}
                  placeholder="Giới thiệu ngắn về Ban Tổ chức..."
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardTitle>Thời gian diễn ra</CardTitle>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Thời gian bắt đầu *" type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
              <Input label="Thời gian kết thúc *" type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Loại vé</CardTitle>
              <Button size="sm" onClick={openCreateTT}><Plus className="h-4 w-4" /> Thêm loại vé</Button>
            </div>
            {ticketTypes.length === 0 ? (
              <p className="text-sm text-gray-500 py-4">Chưa có loại vé nào. Thêm ít nhất một loại vé để tiếp tục.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {ticketTypes.map((tt, i) => (
                  <div key={i} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-gray-900">{tt.name}</p>
                      <p className="text-sm text-gray-500">{Number(tt.price).toLocaleString()}đ &middot; {tt.totalQuantity} vé</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditTT(i)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteTT(i)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {step === 3 && (
        <Card>
          <CardTitle>Cài đặt sự kiện</CardTitle>
          <div className="mt-4 space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isOnline} onChange={e => setIsOnline(e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm text-gray-700">Sự kiện trực tuyến (Online / Webinar)</span>
            </label>
            {!isOnline && (
              <>
                <Input label="Tên địa điểm" value={venueName} onChange={e => setVenueName(e.target.value)} placeholder="Ví dụ: Nhà hát Hoà Bình, White Palace..." />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select label="Tỉnh / Thành phố" value={province} onChange={e => setProvince(e.target.value)}
                    options={[{ value: '', label: 'Chọn tỉnh/thành' }, ...PROVINCES.map(p => ({ value: p, label: p }))]} />
                  <Input label="Quận / Huyện" value={district} onChange={e => setDistrict(e.target.value)} placeholder="Quận 1, Phường Bến Nghé..." />
                </div>
                <Input label="Số nhà / Đường" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} placeholder="123 Nguyễn Huệ" />
                <Input label="Google Maps Link" value={googleMapsLink} onChange={e => setGoogleMapsLink(e.target.value)} placeholder="https://maps.google.com/..." />
              </>
            )}
            {isOnline && (
              <Input label="Link nền tảng" value={streetAddress} onChange={e => setStreetAddress(e.target.value)} placeholder="Zoom, Google Meet, YouTube Live..." />
            )}
          </div>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardTitle>Thông tin thanh toán</CardTitle>
          <p className="mt-1 text-sm text-gray-500">Thông tin tài khoản ngân hàng để nhận tiền bán vé.</p>
          <div className="mt-4 space-y-4">
            <Input label="Tên ngân hàng" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Ví dụ: Vietcombank, Techcombank..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Số tài khoản" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} placeholder="1234567890" />
              <Input label="Chủ tài khoản" value={bankAccountHolder} onChange={e => setBankAccountHolder(e.target.value)} placeholder="NGUYEN VAN A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thông tin thêm</label>
              <textarea value={paymentInfo} onChange={e => setPaymentInfo(e.target.value)} rows={3}
                placeholder="Ghi chú thêm về thanh toán (nếu có)..."
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
          </div>
        </Card>
      )}

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center justify-between">
        <div>
          {step > 1 && <Button variant="secondary" onClick={prevStep}>Quay lại</Button>}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/organizer/events">
            <Button variant="secondary">Huỷ</Button>
          </Link>
          {step < 4 ? (
            <Button onClick={nextStep} className="flex items-center gap-2">
              Tiếp theo <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button loading={saving} onClick={handleSubmit} className="flex items-center gap-2">
              <Save className="h-4 w-4" /> Tạo sự kiện
            </Button>
          )}
        </div>
      </div>

      <Modal open={ttModal} onClose={() => setTtModal(false)} title={editingTT !== null ? 'Sửa loại vé' : 'Thêm loại vé'}>
        <div className="space-y-4">
          <Input label="Tên loại vé" value={ttForm.name} onChange={e => setTtForm({ ...ttForm, name: e.target.value })} placeholder="Vé thường, VIP..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Giá (VND)" type="number" value={ttForm.price} onChange={e => setTtForm({ ...ttForm, price: e.target.value })} />
            <Input label="Tổng số lượng" type="number" value={ttForm.totalQuantity} onChange={e => setTtForm({ ...ttForm, totalQuantity: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tối thiểu/đơn" type="number" value={ttForm.minPerOrder} onChange={e => setTtForm({ ...ttForm, minPerOrder: e.target.value })} />
            <Input label="Tối đa/đơn" type="number" value={ttForm.maxPerOrder} placeholder="Không giới hạn" onChange={e => setTtForm({ ...ttForm, maxPerOrder: e.target.value })} />
          </div>
          <Input label="Mở bán từ" type="datetime-local" value={ttForm.saleStartTime} onChange={e => setTtForm({ ...ttForm, saleStartTime: e.target.value })} />
          <Input label="Kết thúc bán" type="datetime-local" value={ttForm.saleEndTime} onChange={e => setTtForm({ ...ttForm, saleEndTime: e.target.value })} />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setTtModal(false)}>Huỷ</Button>
            <Button onClick={handleSaveTT}>{editingTT !== null ? 'Cập nhật' : 'Thêm'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}