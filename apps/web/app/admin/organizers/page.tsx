'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle2, XCircle, Users, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { unwrapList, unwrapMeta, getErrorMessage, formatDate, bannerUrl as bu, getStatusColor } from '@/lib/utils'
import { adminApi } from '@/lib/api'

interface Organizer {
  id: string
  name: string
  description: string | null
  logo: string | null
  email: string | null
  phone: string | null
  website: string | null
  verified: boolean
  createdAt: string
  user: { id: string; email: string; fullName: string; role: string }
  _count: { events: number; follows: number }
}

export default function AdminOrganizersPage() {
  const [organizers, setOrganizers] = useState<Organizer[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [verifiedFilter, setVerifiedFilter] = useState('')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchOrganizers = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: '20' }
      if (search) params.search = search
      if (verifiedFilter) params.verified = verifiedFilter

      const res = await adminApi.getOrganizers(params)
      setOrganizers(unwrapList<Organizer>(res))
      const meta = unwrapMeta(res)
      if (meta) {
        setTotalPages(meta.totalPages)
        setTotal(meta.total)
      }
    } catch {
      setOrganizers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchOrganizers() }, [page, verifiedFilter])

  const handleVerify = async (id: string, verified: boolean) => {
    setProcessingId(id)
    try {
      await adminApi.verifyOrganizer(id, verified)
      toast.success(verified ? 'Đã xác thực nhà tổ chức' : 'Đã huỷ xác thực')
      fetchOrganizers()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'))
    } finally {
      setProcessingId(null)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchOrganizers()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quản lý nhà tổ chức</h1>
      </div>

      <div className="flex gap-3 mb-6">
        <form onSubmit={handleSearch} className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm nhà tổ chức..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-neutral-900 dark:text-white"
          />
        </form>
        <select
          value={verifiedFilter}
          onChange={(e) => { setVerifiedFilter(e.target.value); setPage(1) }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-neutral-900 dark:text-white"
        >
          <option value="">Tất cả</option>
          <option value="true">Đã xác thực</option>
          <option value="false">Chưa xác thực</option>
        </select>
      </div>

      <Card className="!p-0 overflow-hidden">
        {loading ? (
          <div className="py-12"><PageSpinner /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Nhà tổ chức</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Người dùng</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Sự kiện</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Theo dõi</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Trạng thái</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Ngày tạo</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {organizers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">Chưa có nhà tổ chức nào</td></tr>
              ) : organizers.map((org) => (
                <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {org.logo ? (
                        <img src={bu(org.logo)!} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 font-bold text-sm dark:bg-emerald-900/30 dark:text-emerald-400">
                          {org.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{org.name}</p>
                        {org.email && <p className="text-xs text-gray-500 dark:text-gray-400">{org.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900 dark:text-white">{org.user.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{org.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{org._count.events}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{org._count.follows}</td>
                  <td className="px-4 py-3">
                    <Badge className={org.verified ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'}>
                      {org.verified ? 'Đã xác thực' : 'Chờ xác thực'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(org.createdAt, 'dd/MM/yyyy')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {org.verified ? (
                        <Button variant="ghost" size="sm" onClick={() => handleVerify(org.id, false)} disabled={processingId === org.id} title="Huỷ xác thực">
                          <XCircle className="h-4 w-4 text-red-500" />
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleVerify(org.id, true)} disabled={processingId === org.id} title="Xác thực">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                      <Link href={`/events?organizerId=${org.id}`} target="_blank" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                        <ExternalLink className="h-4 w-4 text-indigo-500" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}
