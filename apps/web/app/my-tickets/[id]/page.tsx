'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { ArrowLeft, Copy, Check, Send } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, getErrorMessage } from '@/lib/utils'
import { ticketApi } from '@/lib/api'
import type { Ticket } from '@/types'

export default function TicketDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [targetEmail, setTargetEmail] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    ticketApi
      .getById(params.id)
      .then(({ data }) => setTicket(data))
      .catch(() => router.push('/my-tickets'))
      .finally(() => setLoading(false))
  }, [params.id, router])

  const handleCopy = () => {
    if (ticket?.qrCodeToken) {
      navigator.clipboard.writeText(ticket.qrCodeToken)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleTransfer = async () => {
    if (!targetEmail.trim()) return
    setTransferring(true)
    try {
      await ticketApi.transfer(params.id, targetEmail)
      toast.success('Chuyển vé thành công!')
      setTransferOpen(false)
      setTargetEmail('')
      const { data } = await ticketApi.getById(params.id)
      setTicket(data)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Chuyển vé thất bại'))
    } finally {
      setTransferring(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Bạn có chắc muốn huỷ vé này?')) return
    setCancelling(true)
    try {
      await ticketApi.cancelTicket(params.id)
      toast.success('Đã huỷ vé')
      const { data } = await ticketApi.getById(params.id)
      setTicket(data)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Huỷ vé thất bại'))
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <PageSpinner />
  if (!ticket) return null

  const canTransfer = ticket.status === 'VALID' || ticket.status === 'PENDING'
  const canCancel = ticket.status === 'PENDING' || ticket.status === 'VALID'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/my-tickets"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại vé của tôi
      </Link>

      <Card className="text-center">
        <div className="mb-6">
          <Badge className={getStatusColor(ticket.status) + ' text-sm px-3 py-1'}>
            {getStatusLabel(ticket.status)}
          </Badge>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-48 w-48 rounded-xl bg-white border-2 border-gray-200 p-3 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-2xl tracking-widest text-gray-800 mb-2">
                  {ticket.qrCodeToken.slice(0, 16)}
                </div>
                <div className="text-[10px] text-gray-400 leading-tight">
                  {ticket.qrCodeToken.slice(16)}
                </div>
              </div>
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <Badge className="bg-indigo-100 text-indigo-800 text-xs">QR Token</Badge>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={handleCopy} className="mb-6">
          {copied ? (
            <><Check className="h-4 w-4" /> Đã sao chép</>
          ) : (
            <><Copy className="h-4 w-4" /> Sao chép mã vé</>
          )}
        </Button>

        <div className="space-y-3 text-left border-t pt-6">
          <h2 className="text-xl font-bold text-gray-900 text-center">
            {ticket.ticketType?.event?.title}
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Loại vé</p>
              <p className="font-medium text-gray-900">{ticket.ticketType?.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Giá vé</p>
              <p className="font-medium text-gray-900">{formatCurrency(ticket.ticketType?.price || 0)}</p>
            </div>
            <div>
              <p className="text-gray-500">Địa điểm</p>
              <p className="font-medium text-gray-900">{ticket.ticketType?.event?.location}</p>
            </div>
            <div>
              <p className="text-gray-500">Thời gian</p>
              <p className="font-medium text-gray-900">
                {ticket.ticketType?.event?.startTime
                  ? formatDate(ticket.ticketType.event.startTime, 'dd/MM/yyyy HH:mm')
                  : '---'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Ngày mua</p>
              <p className="font-medium text-gray-900">{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500">Trạng thái</p>
              <p className="font-medium text-gray-900">{getStatusLabel(ticket.status)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 border-t pt-6">
          {canTransfer && (
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <Send className="h-4 w-4" />
              Chuyển vé
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" loading={cancelling} onClick={handleCancel}>
              Huỷ vé
            </Button>
          )}
        </div>
      </Card>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="Chuyển vé">
        <p className="text-sm text-gray-600 mb-4">
          Nhập email của người nhận vé này.
        </p>
        <Input
          label="Email người nhận"
          type="email"
          placeholder="nguoinhan@example.com"
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setTransferOpen(false)}>
            Huỷ
          </Button>
          <Button loading={transferring} onClick={handleTransfer}>
            Chuyển vé
          </Button>
        </div>
      </Modal>
    </div>
  )
}
