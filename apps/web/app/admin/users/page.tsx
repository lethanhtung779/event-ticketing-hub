'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { getStatusColor, getStatusLabel, formatDate, unwrapList, unwrapMeta } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import type { User } from '@/types'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  const fetch = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' }
      if (search) params.search = search
      const res = await adminApi.getUsers(params)
      setUsers(unwrapList<User>(res))
      const meta = unwrapMeta(res)
      if (meta) setTotalPages(meta.totalPages)
    } catch { setUsers([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [page, search])

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await adminApi.updateUserRole(userId, role)
      toast.success('Cập nhật vai trò thành công!')
      fetch()
    } catch { toast.error('Cập nhật thất bại') }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý người dùng</h1>

      <div className="relative max-w-xs mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Tìm kiếm người dùng..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Họ tên</th>
              <th className="px-4 py-3 font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 font-medium text-gray-500">Vai trò</th>
              <th className="px-4 py-3 font-medium text-gray-500">Xác thực</th>
              <th className="px-4 py-3 font-medium text-gray-500">Ngày tạo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12"><PageSpinner /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500">Không tìm thấy người dùng</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{user.fullName}</td>
                <td className="px-4 py-3 text-gray-600">{user.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    options={[
                      { value: 'USER', label: 'Người dùng' },
                      { value: 'STAFF', label: 'Nhân viên' },
                      { value: 'ADMIN', label: 'Quản trị viên' },
                    ]}
                    className="!h-8 text-xs !w-32"
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge className={user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">{formatDate(user.createdAt, 'dd/MM/yyyy')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
