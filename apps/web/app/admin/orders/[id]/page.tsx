'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Ticket, CreditCard, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate, getErrorMessage } from '@/lib/utils'
import { adminApi, paymentApi } from '@/lib/api'

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAID: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  REFUNDED: 'bg-purple-100 text-purple-800',
}

export default function OrderDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refundModal, setRefundModal] = useState(false)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  const fetchOrder = () => {
    adminApi.getOrder(params.id)
      .then(({ data }) => setOrder(data))
      .catch(() => router.push('/admin/orders'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrder() }, [params.id])

  const handleRefund = async () => {
    if (!refundReason.trim()) return
    setRefunding(true)
    try {
      await paymentApi.refund({ orderId: params.id, reason: refundReason })
      toast.success('Hoàn tiền thành công!')
      setRefundModal(false)
      setRefundReason('')
      fetchOrder()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Hoàn tiền thất bại'))
    } finally { setRefunding(false) }
  }

  if (loading) return <PageSpinner />
  if (!order) return null

  return (
    <div>
      <Link href="/admin/orders" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> Quản lý đơn hàng
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Đơn hàng #{params.id.slice(0, 8)}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{formatDate(order.createdAt, 'dd/MM/yyyy HH:mm')}</p>
        </div>
        <Badge className={statusColors[order.status] || ''}>{order.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-600" /> Khách hàng
          </CardTitle>
          <div className="mt-4 space-y-2 text-sm">
            <p><span className="text-gray-500 dark:text-gray-400">Tên:</span> {order.user?.fullName}</p>
            <p><span className="text-gray-500 dark:text-gray-400">Email:</span> {order.user?.email}</p>
          </div>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-indigo-600" /> Thanh toán
          </CardTitle>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Tạm tính</span><span>{formatCurrency(order.totalAmount)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Giảm giá</span><span className="text-green-600">-{formatCurrency(order.discount)}</span></div>}
            <div className="flex justify-between font-bold text-base border-t pt-2"><span>Thành tiền</span><span>{formatCurrency(order.finalAmount)}</span></div>
            {order.promoCode && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Mã giảm giá</span><span className="font-mono">{order.promoCode}</span></div>}
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <CardTitle className="flex items-center gap-2">
          <Ticket className="h-5 w-5 text-indigo-600" /> Vé ({order.tickets?.length || 0})
        </CardTitle>
        {order.tickets?.length ? (
          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {order.tickets.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{t.ticketType?.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t.ticketType?.event?.title}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(t.ticketType?.price || 0)}</p>
                  <Badge className={`text-xs ${t.status === 'VALID' ? 'bg-green-100 text-green-800' : t.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-800' : t.status === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {t.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 py-4">Không có vé nào</p>
        )}
      </Card>

      {order.payments?.length > 0 && (
        <Card className="mb-6">
          <CardTitle>Giao dịch</CardTitle>
          <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
            {order.payments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{p.method}</p>
                  <p className="text-gray-400 dark:text-gray-500 text-xs">{p.transactionNo || '---'}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(p.amount)}</p>
                  <Badge className={`text-xs ${p.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {order.status === 'PAID' && (
        <div className="flex justify-end">
          <Button onClick={() => setRefundModal(true)} className="bg-red-600 hover:bg-red-700">
            <RotateCcw className="h-4 w-4" /> Hoàn tiền
          </Button>
        </div>
      )}

      <Modal open={refundModal} onClose={() => setRefundModal(false)} title="Hoàn tiền">
        <Input label="Lý do" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Nhập lý do..." />
        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setRefundModal(false)}>Huỷ</Button>
          <Button loading={refunding} onClick={handleRefund} className="bg-red-600 hover:bg-red-700">Xác nhận</Button>
        </div>
      </Modal>
    </div>
  )
}
