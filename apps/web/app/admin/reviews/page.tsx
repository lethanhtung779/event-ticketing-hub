'use client'

import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate, unwrapList, unwrapMeta, getErrorMessage } from '@/lib/utils'
import { adminApi } from '@/lib/api'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getReviews({ page: String(page), limit: '15' })
      setReviews(unwrapList<any>(res))
      const meta = unwrapMeta(res)
      if (meta) setTotalPages(meta.totalPages)
    } catch { setReviews([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [page])

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await adminApi.deleteReview(deleteTarget.id)
      toast.success('Đã xoá đánh giá')
      setDeleteTarget(null)
      fetch()
    } catch { toast.error('Xoá thất bại') }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý đánh giá</h1>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Người dùng</th>
                <th className="px-4 py-3 font-medium text-gray-500">Sự kiện</th>
                <th className="px-4 py-3 font-medium text-gray-500">Đánh giá</th>
                <th className="px-4 py-3 font-medium text-gray-500">Nội dung</th>
                <th className="px-4 py-3 font-medium text-gray-500">Ngày tạo</th>
                <th className="px-4 py-3 font-medium text-gray-500">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-4 py-12"><PageSpinner /></td></tr>
              ) : reviews.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500">Chưa có đánh giá nào</td></tr>
              ) : reviews.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{r.user?.fullName}</p>
                    <p className="text-xs text-gray-400">{r.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-900">{r.event?.title}</td>
                  <td className="px-4 py-3">
                    <span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{r.comment || '---'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(r.createdAt, 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(r)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
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

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xoá đánh giá">
        {deleteTarget && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Xoá đánh giá của <strong>{deleteTarget.user?.fullName}</strong> cho sự kiện <strong>{deleteTarget.event?.title}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Huỷ</Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xác nhận xoá</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
