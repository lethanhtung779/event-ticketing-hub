'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Scan, CheckCircle, XCircle, User, Calendar, MapPin } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getErrorMessage } from '@/lib/utils'
import { ticketApi } from '@/lib/api'

export default function CheckInPage() {
  const [code, setCode] = useState('')
  const [looking, setLooking] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [ticket, setTicket] = useState<any>(null)
  const [checkedIn, setCheckedIn] = useState(false)
  const [error, setError] = useState('')

  const handleLookup = async () => {
    if (!code.trim()) return
    setLooking(true)
    setTicket(null)
    setCheckedIn(false)
    setError('')
    try {
      const { data } = await ticketApi.lookupTicket(code.trim())
      setTicket(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Tra cứu thất bại'))
    } finally {
      setLooking(false)
    }
  }

  const handleConfirmCheckIn = async () => {
    if (!ticket) return
    setCheckingIn(true)
    try {
      const { data } = await ticketApi.checkIn(ticket.qrCodeToken)
      setTicket(data)
      setCheckedIn(true)
      toast.success('Check-in thành công!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Check-in thất bại'))
    } finally {
      setCheckingIn(false)
    }
  }

  const handleReset = () => {
    setCode('')
    setTicket(null)
    setCheckedIn(false)
    setError('')
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Check-in vé</h1>

      <Card className="mb-6">
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5 text-indigo-600" />
          Quét mã vé
        </CardTitle>
        <div className="mt-4 flex gap-2">
          <Input
            placeholder="Nhập mã QR token..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !ticket && handleLookup()}
            disabled={!!ticket}
          />
          {!ticket ? (
            <Button onClick={handleLookup} loading={looking} className="shrink-0">
              Tra cứu
            </Button>
          ) : (
            <Button variant="secondary" onClick={handleReset} className="shrink-0">
              Làm lại
            </Button>
          )}
        </div>
      </Card>

      {ticket && !checkedIn && (
        <Card className="mb-6 !border-amber-200">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-amber-500" />
            <span className="font-semibold text-amber-800">Xác minh danh tính</span>
          </div>

          <div className="space-y-3 text-sm border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 mb-4">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Họ tên</span>
              <span className="font-semibold text-gray-900 dark:text-white text-base">{ticket.user?.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="font-medium text-gray-900 dark:text-white">{ticket.user?.email}</span>
            </div>
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Sự kiện</span>
                <span className="font-medium text-gray-900 dark:text-white text-right max-w-[200px]">{ticket.ticketType?.event?.title}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500 dark:text-gray-400">Loại vé</span>
                <span className="font-medium text-gray-900 dark:text-white">{ticket.ticketType?.name}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500 dark:text-gray-400">Giá vé</span>
                <span className="font-medium text-gray-900 dark:text-white">{formatCurrency(ticket.ticketType?.price || 0)}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500 dark:text-gray-400">Thời gian</span>
                <span className="font-medium text-gray-900 dark:text-white">{ticket.ticketType?.event?.startTime ? formatDate(ticket.ticketType.event.startTime, 'dd/MM/yyyy HH:mm') : '---'}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-gray-500 dark:text-gray-400">Địa điểm</span>
                <span className="font-medium text-gray-900 dark:text-white">{ticket.ticketType?.event?.location}</span>
              </div>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="text-gray-500 dark:text-gray-400">Trạng thái</span>
              <Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge>
            </div>
          </div>

          <p className="text-sm text-amber-700 mb-4 bg-amber-50 rounded-lg p-3 border border-amber-200">
            Yêu cầu khách hàng xuất trình giấy tờ tuỳ thân.
            Đối chiếu <strong>họ tên</strong> và <strong>email</strong> trước khi xác nhận.
          </p>

          <Button
            onClick={handleConfirmCheckIn}
            loading={checkingIn}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="h-4 w-4" /> Xác nhận Check-in
          </Button>
        </Card>
      )}

      {checkedIn && ticket && (
        <Card className="!border-green-200">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <div>
              <p className="font-semibold text-green-700 text-lg">Check-in thành công!</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{ticket.user?.fullName} &middot; {formatDate(new Date().toISOString())}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Sự kiện</span><span className="font-medium">{ticket.ticketType?.event?.title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Loại vé</span><span className="font-medium">{ticket.ticketType?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Người dùng</span><span className="font-medium">{ticket.user?.fullName} ({ticket.user?.email})</span></div>
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Trạng thái</span><Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge></div>
          </div>
        </Card>
      )}

      {error && !ticket && (
        <Card className="!border-red-200 !bg-red-50">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="font-semibold text-red-700">Không tìm thấy vé</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
