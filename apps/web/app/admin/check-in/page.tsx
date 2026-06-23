'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Scan, CheckCircle, XCircle } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getErrorMessage } from '@/lib/utils'
import { ticketApi } from '@/lib/api'
import type { Ticket } from '@/types'

export default function CheckInPage() {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [error, setError] = useState('')

  const handleCheckIn = async () => {
    if (!code.trim()) return
    setChecking(true)
    setTicket(null)
    setError('')
    try {
      const { data } = await ticketApi.checkIn(code.trim())
      setTicket(data as Ticket)
      toast.success('Check-in thành công!')
    } catch (err) {
      setError(getErrorMessage(err, 'Check-in thất bại'))
      toast.error(getErrorMessage(err, 'Check-in thất bại'))
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Check-in vé</h1>

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
            onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
          />
          <Button onClick={handleCheckIn} loading={checking} className="shrink-0">
            Check-in
          </Button>
        </div>
      </Card>

      {ticket && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-semibold text-green-700">Check-in thành công!</p>
              <p className="text-sm text-gray-500">{formatDate(new Date().toISOString())}</p>
            </div>
          </div>
          <div className="space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between"><span className="text-gray-500">Mã vé</span><span className="font-mono font-medium">{ticket.qrCodeToken.slice(0, 20)}...</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Sự kiện</span><span className="font-medium">{ticket.ticketType?.event?.title}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Loại vé</span><span className="font-medium">{ticket.ticketType?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Trạng thái</span><Badge className={getStatusColor(ticket.status)}>{getStatusLabel(ticket.status)}</Badge></div>
          </div>
        </Card>
      )}

      {error && (
        <Card className="!border-red-200 !bg-red-50">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="font-semibold text-red-700">Check-in thất bại</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
