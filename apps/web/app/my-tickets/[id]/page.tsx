'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { ArrowLeft, Copy, Check, Send, Download } from 'lucide-react'
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
  const { t } = useTranslation()
  const params = use(props.params)
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [transferOpen, setTransferOpen] = useState(false)
  const [targetEmail, setTargetEmail] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [qrSrc, setQrSrc] = useState('')

  const generatingQRText = t('ticketDetail.generatingQR')
  const labelTicketType = t('ticketDetail.ticketType')
  const labelPrice = t('ticketDetail.price')
  const labelLocation = t('eventDetail.location')
  const labelDate = t('eventDetail.date')
  const labelPurchaseDate = t('ticketDetail.purchaseDate')
  const labelStatus = t('ticketDetail.status')
  const labelCode = t('ticketDetail.code')

  useEffect(() => {
    let cancelled = false
    ticketApi
      .getById(params.id)
      .then(({ data }) => {
        if (cancelled) return
        setTicket(data)
      })
      .catch(() => { if (!cancelled) router.push('/my-tickets') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [params.id, router])

  useEffect(() => {
    if (!ticket?.qrCodeToken) return
    import('qrcode').then(mod => {
      mod.default.toDataURL(ticket.qrCodeToken, {
        width: 200, margin: 2, color: { dark: '#1e1e2e', light: '#ffffff' },
      }).then(url => setQrSrc(url))
    })
  }, [ticket?.qrCodeToken])

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
      toast.success(t('ticketDetail.transferSuccess'))
      setTransferOpen(false)
      setTargetEmail('')
      const { data } = await ticketApi.getById(params.id)
      setTicket(data)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('ticketDetail.transferFailed')))
    } finally {
      setTransferring(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm(t('ticketDetail.cancelConfirm'))) return
    setCancelling(true)
    try {
      await ticketApi.cancelTicket(params.id)
      toast.success(t('ticketDetail.cancelSuccess'))
      const { data } = await ticketApi.getById(params.id)
      setTicket(data)
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('ticketDetail.cancelFailed')))
    } finally {
      setCancelling(false)
    }
  }

  const handleDownload = async () => {
    if (!ticket) return
    const mod = await import('qrcode')
    const qrDataUrl = await mod.default.toDataURL(ticket.qrCodeToken, {
      width: 400, margin: 2, color: { dark: '#1e1e2e', light: '#ffffff' },
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const padding = 40
    const qrSize = 280
    const lineHeight = 24
    const infoHeight = 200
    canvas.width = qrSize + padding * 2
    canvas.height = qrSize + padding * 2 + infoHeight

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = '#1e1e2e'
    ctx.font = 'bold 20px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(ticket.ticketType?.event?.title || t('ticketDetail.eventFallback'), canvas.width / 2, 30)

    const img = new Image()
    img.src = qrDataUrl
    await new Promise((resolve) => { img.onload = resolve })
    ctx.drawImage(img, padding, 50, qrSize, qrSize)

    ctx.fillStyle = '#374151'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    const lines = [
      `${labelTicketType}: ${ticket.ticketType?.name || '---'}`,
      `${labelLocation}: ${ticket.ticketType?.event?.location || '---'}`,
      `${labelDate}: ${ticket.ticketType?.event?.startTime ? formatDate(ticket.ticketType.event.startTime, 'dd/MM/yyyy HH:mm') : '---'}`,
      `${labelCode}: ${ticket.qrCodeToken.slice(0, 16)}...`,
    ]
    lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, qrSize + 80 + i * lineHeight)
    })

    const link = document.createElement('a')
    link.download = `ve-${ticket.id.slice(0, 8)}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  if (loading) return <PageSpinner />
  if (!ticket) return null

  const canTransfer = ticket.status === 'VALID' || ticket.status === 'PENDING'
  const canCancel = ticket.status === 'PENDING' || ticket.status === 'VALID'

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/my-tickets"
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('ticketDetail.back')}
      </Link>

      <Card className="text-center">
        <div className="mb-6">
          <Badge className={getStatusColor(ticket.status) + ' text-sm px-3 py-1'}>
            {getStatusLabel(ticket.status)}
          </Badge>
        </div>

        <div className="flex justify-center mb-6">
          <div className="relative">
            {qrSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qrSrc} alt="QR Code" className="h-48 w-48 rounded-xl border-2 border-gray-200" />
            ) : (
              <div className="h-48 w-48 rounded-xl border-2 border-gray-200 flex items-center justify-center text-gray-400 dark:text-gray-400 text-sm">
                {generatingQRText}
              </div>
            )}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <Badge className="bg-indigo-100 text-indigo-800 text-xs">{t('ticketDetail.qrCode')}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            {copied ? (
              <><Check className="h-4 w-4" /> {t('common.copied')}</>
            ) : (
              <><Copy className="h-4 w-4" /> {t('ticketDetail.copyCode')}</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4" /> {t('ticketDetail.download')}
          </Button>
        </div>

        <div className="space-y-3 text-left border-t pt-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center">
            {ticket.ticketType?.event?.title}
          </h2>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('ticketDetail.ticketType')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{ticket.ticketType?.name}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('ticketDetail.price')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(ticket.ticketType?.price || 0)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('eventDetail.location')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{ticket.ticketType?.event?.location}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('eventDetail.date')}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {ticket.ticketType?.event?.startTime
                  ? formatDate(ticket.ticketType.event.startTime, 'dd/MM/yyyy HH:mm')
                  : '---'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('ticketDetail.purchaseDate')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDate(ticket.createdAt)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">{t('ticketDetail.status')}</p>
              <p className="font-medium text-gray-900 dark:text-white">{getStatusLabel(ticket.status)}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 border-t pt-6">
          {canTransfer && (
            <Button variant="outline" onClick={() => setTransferOpen(true)}>
              <Send className="h-4 w-4" />
              {t('ticketDetail.transferTicket')}
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" loading={cancelling} onClick={handleCancel}>
              {t('ticketDetail.cancelTicket')}
            </Button>
          )}
        </div>
      </Card>

      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title={t('ticketDetail.transferTitle')}>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {t('ticketDetail.transferDescription')}
        </p>
        <Input
          label={t('ticketDetail.recipientEmail')}
          type="email"
          placeholder={t('ticketDetail.recipientEmailPlaceholder')}
          value={targetEmail}
          onChange={(e) => setTargetEmail(e.target.value)}
        />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setTransferOpen(false)}>
            {t('common.cancel')}
          </Button>
          <Button loading={transferring} onClick={handleTransfer}>
            {t('ticketDetail.transferBtn')}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
