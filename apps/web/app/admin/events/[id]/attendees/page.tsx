'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import { adminApi, api } from '@/lib/api'
import { useTranslation } from 'react-i18next'

interface Attendee {
  id: string
  user: { id: string; fullName: string; email: string }
  ticketType: { name: string }
  checkedInAt: string
}

export default function AttendeesPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  const fetchAttendees = () => {
    setLoading(true)
    adminApi
      .getAttendees(params.id)
      .then(({ data }) => setAttendees(data as Attendee[]))
      .catch(() => toast.error(t('admin.toastAttendeeLoadFailed')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAttendees() }, [params.id])

  const handleExportCsv = async () => {
    try {
      const res = await adminApi.getAttendees(params.id, { format: 'csv' })
      const blob = new Blob([res.data as string], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `attendees-${params.id}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(t('admin.toastExportFailed'))
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <Link
        href={`/admin/events/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> {t('admin.eventDetail')}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.checkInList')}</h1>
          <span className="text-sm text-gray-400 dark:text-gray-500">({attendees.length})</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="h-4 w-4" /> {t('admin.exportCsv')}
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colIndex')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colFullName')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colEmail')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colTicketType')}</th>
                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colCheckInTime')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {attendees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    {t('admin.noAttendees')}
                  </td>
                </tr>
              ) : attendees.map((a, i) => (
                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{a.user.fullName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.user.email}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.ticketType.name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{formatDate(a.checkedInAt, 'dd/MM/yyyy HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
