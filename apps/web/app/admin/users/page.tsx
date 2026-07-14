'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate, unwrapList, unwrapMeta } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import type { User } from '@/types'
import { useTranslation } from 'react-i18next'

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const { t } = useTranslation()

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
      toast.success(t('admin.toastRoleUpdated'))
      fetch()
    } catch { toast.error(t('admin.toastRoleUpdateFailed')) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.userManagement')}</h1>
        <Button variant="outline" size="sm" onClick={async () => {
          try {
            const res = await adminApi.exportUsers()
            const blob = new Blob([res.data as BlobPart], { type: 'text/csv' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = 'users.csv'; a.click()
            URL.revokeObjectURL(url)
          } catch { toast.error(t('admin.toastExportFailed')) }
        }}>
          <Download className="h-4 w-4" /> {t('admin.exportCsv')}
        </Button>
      </div>

      <div className="relative max-w-xs mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder={t('admin.searchUsers')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colFullName')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colEmail')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colRole')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.verified')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colCreatedAt')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-12"><PageSpinner /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">{t('admin.noUsers')}</td></tr>
            ) : users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                <td className="px-4 py-3">
                  <Link href={`/admin/users/${user.id}`} className="font-medium text-gray-900 dark:text-white hover:text-indigo-600">
                    {user.fullName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                <td className="px-4 py-3">
                  <Select
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    options={[
                      { value: 'USER', label: t('admin.roleUser') },
                      { value: 'STAFF', label: t('admin.roleStaff') },
                      { value: 'ADMIN', label: t('admin.roleAdmin') },
                    ]}
                    className="!h-8 text-xs !w-32"
                  />
                </td>
                <td className="px-4 py-3">
                  <Badge className={user.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                    {user.isVerified ? t('admin.verifiedBadge') : t('admin.unverifiedBadge')}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(user.createdAt, 'dd/MM/yyyy')}</td>
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
