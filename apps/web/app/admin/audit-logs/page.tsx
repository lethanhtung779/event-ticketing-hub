'use client'

import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { Pagination } from '@/components/ui/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import type { AuditLog } from '@/types'
import { useTranslation } from 'react-i18next'

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { t } = useTranslation()

  const [action, setAction] = useState('')
  const [entity, setEntity] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const fetchLogs = () => {
    setLoading(true)
    const params: Record<string, string> = { page: String(page), limit: '20' }
    if (action) params.action = action
    if (entity) params.entity = entity
    if (fromDate) params.fromDate = fromDate
    if (toDate) params.toDate = toDate

    adminApi
      .getAuditLogs(params)
      .then(({ data }) => {
        setLogs(data.data || data)
        if (data.meta) setTotalPages(data.meta.totalPages)
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchLogs() }, [page])

  const handleFilter = () => {
    setPage(1)
    fetchLogs()
  }

  const clearFilters = () => {
    setAction('')
    setEntity('')
    setFromDate('')
    setToDate('')
    setPage(1)
  }

  const actions = ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'REFUND', 'PUBLISH', 'CANCEL']
  const entities = ['Event', 'User', 'Order', 'TicketType', 'PromoCode', 'Category', 'Ticket']

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.auditLogs')}</h1>
        <Button variant="secondary" size="sm" onClick={() => setShowFilters(!showFilters)}>
          <Filter className="h-4 w-4" /> {t('admin.filters')}
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <div className="flex items-end gap-3 flex-wrap">
            <Select
              label={t('admin.filterAction')}
              value={action}
              onChange={(e) => setAction(e.target.value)}
              options={[{ value: '', label: t('admin.filterAll') }, ...actions.map(a => ({ value: a, label: a }))]}
            />
            <Select
              label={t('admin.filterEntity')}
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              options={[{ value: '', label: t('admin.filterAll') }, ...entities.map(e => ({ value: e, label: e }))]}
            />
            <Input label={t('admin.filterFromDate')} type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            <Input label={t('admin.filterToDate')} type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            <div className="flex gap-2 mb-0.5">
              <Button size="sm" onClick={handleFilter}>{t('admin.filterBtn')}</Button>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colTime')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colUser')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colAction')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colEntity')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colDetail')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {logs.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">{t('admin.noLogs')}</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-900 dark:text-white">{log.user?.fullName || log.user?.email || '---'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-100">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {log.entity}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ''}
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-xs truncate">{log.detail || '---'}</td>
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
