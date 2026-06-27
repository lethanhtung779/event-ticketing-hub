'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, ExternalLink, RotateCcw, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency, formatDate, getErrorMessage, unwrapList, unwrapMeta } from '@/lib/utils'
import { adminApi, paymentApi } from '@/lib/api'
import type { Order } from '@/types'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [refundTarget, setRefundTarget] = useState<any>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  const fetch = async (q?: string) => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' }
      if (q) params.search = q
      if (statusFilter) params.status = statusFilter
      const res = await adminApi.getOrders(params)
      const data = unwrapList<any>(res)
      setOrders(data)
      const meta = unwrapMeta(res)
      if (meta) setTotalPages(meta.totalPages)
    } catch { setOrders([]) }
    finally { setLoading(false) }
  }

  const doSearch = (q: string) => {
    setPage(1)
    setSearch(q)
    fetch(q)
  }

  useEffect(() => { fetch() }, [page, statusFilter])

  const handleRefund = async () => {
    if (!refundTarget || !refundReason.trim()) return
    setRefunding(true)
    try {
      await paymentApi.refund({ orderId: refundTarget.id, reason: refundReason })
      toast.success('Hoàn tiền thành công!')
      setRefundTarget(null)
      setRefundReason('')
      fetch()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Hoàn tiền thất bại'))
    } finally { setRefunding(false) }
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-purple-100 text-purple-800',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý đơn hàng</h1>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm đơn hàng..."
            value={search}
            onChange={(e) => { if (!e.target.value) doSearch(''); else setSearch(e.target.value) }}
            onKeyDown={(e) => { if (e.key === 'Enter') doSearch(e.currentTarget.value) }}
            className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {search && (
            <button onClick={() => doSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={() => doSearch(search)} className="mb-0.5">Tìm</Button>
        <Select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'Tất cả trạng thái' },
            { value: 'PENDING', label: 'Chờ thanh toán' },
            { value: 'PAID', label: 'Đã thanh toán' },
            { value: 'CANCELLED', label: 'Đã huỷ' },
            { value: 'REFUNDED', label: 'Đã hoàn tiền' },
          ]}
          className="!w-44"
        />
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Mã đơn</th>
                <th className="px-4 py-3 font-medium text-gray-500">Khách hàng</th>
                <th className="px-4 py-3 font-medium text-gray-500">Tổng tiền</th>
                <th className="px-4 py-3 font-medium text-gray-500">Giảm giá</th>
                <th className="px-4 py-3 font-medium text-gray-500">Thành tiền</th>
                <th className="px-4 py-3 font-medium text-gray-500">Số vé</th>
                <th className="px-4 py-3 font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-gray-500">Ngày tạo</th>
                <th className="px-4 py-3 font-medium text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12"><PageSpinner /></td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center text-gray-500">Không tìm thấy đơn hàng</td></tr>
              ) : orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-900">#{o.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{o.user?.fullName || '---'}</p>
                    <p className="text-xs text-gray-400">{o.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{formatCurrency(o.totalAmount)}</td>
                  <td className="px-4 py-3 text-gray-600">{o.discount > 0 ? formatCurrency(o.discount) : '---'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(o.finalAmount)}</td>
                  <td className="px-4 py-3 text-gray-600">{o._count?.tickets ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[o.status] || 'bg-gray-100 text-gray-800'}>{o.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(o.createdAt, 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Link href={`/admin/orders/${o.id}`}>
                        <Button variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /></Button>
                      </Link>
                      {o.status === 'PAID' && (
                        <Button variant="ghost" size="sm" onClick={() => setRefundTarget(o)}>
                          <RotateCcw className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
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

      <Modal open={!!refundTarget} onClose={() => setRefundTarget(null)} title="Hoàn tiền">
        {refundTarget && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Xác nhận hoàn tiền đơn hàng <strong>#{refundTarget.id.slice(0, 8)}</strong>
              {' '}({formatCurrency(refundTarget.finalAmount)})?
            </p>
            <Input label="Lý do" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Nhập lý do..." />
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setRefundTarget(null)}>Huỷ</Button>
              <Button loading={refunding} onClick={handleRefund} className="bg-red-600 hover:bg-red-700">Xác nhận</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
