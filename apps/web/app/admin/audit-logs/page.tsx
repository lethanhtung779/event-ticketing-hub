'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/Card'
import { Pagination } from '@/components/ui/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate, unwrapList, unwrapMeta } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import type { AuditLog } from '@/types'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    adminApi
      .getAuditLogs({ page: String(page), limit: '20' })
      .then(({ data }) => {
        setLogs(data.data || data)
        if (data.meta) setTotalPages(data.meta.totalPages)
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [page])

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nhật ký hoạt động</h1>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">Thời gian</th>
                <th className="px-4 py-3 font-medium text-gray-500">Người dùng</th>
                <th className="px-4 py-3 font-medium text-gray-500">Hành động</th>
                <th className="px-4 py-3 font-medium text-gray-500">Đối tượng</th>
                <th className="px-4 py-3 font-medium text-gray-500">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Chưa có nhật ký</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-900">{log.user?.fullName || log.user?.email || '---'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{log.detail || '---'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
