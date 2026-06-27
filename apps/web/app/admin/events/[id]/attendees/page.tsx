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

  const fetchAttendees = () => {
    setLoading(true)
    adminApi
      .getAttendees(params.id)
      .then(({ data }) => setAttendees(data as Attendee[]))
      .catch(() => toast.error('Tải danh sách thất bại'))
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
      toast.error('Xuất CSV thất bại')
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <Link
        href={`/admin/events/${params.id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4"
      >
        <ArrowLeft className="h-4 w-4" /> Chi tiết sự kiện
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-900">Danh sách check-in</h1>
          <span className="text-sm text-gray-400">({attendees.length})</span>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCsv}>
          <Download className="h-4 w-4" /> Xuất CSV
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500">STT</th>
                <th className="px-4 py-3 font-medium text-gray-500">Họ tên</th>
                <th className="px-4 py-3 font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 font-medium text-gray-500">Loại vé</th>
                <th className="px-4 py-3 font-medium text-gray-500">Thời gian check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                    Chưa có ai check-in
                  </td>
                </tr>
              ) : attendees.map((a, i) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-600">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{a.user.fullName}</td>
                  <td className="px-4 py-3 text-gray-600">{a.user.email}</td>
                  <td className="px-4 py-3 text-gray-600">{a.ticketType.name}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(a.checkedInAt, 'dd/MM/yyyy HH:mm')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
