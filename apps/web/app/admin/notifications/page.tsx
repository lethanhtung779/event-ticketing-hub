'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Bell, Send, Users, Mail } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { getErrorMessage } from '@/lib/utils'
import { adminApi } from '@/lib/api'

export default function AdminNotificationsPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [allUsers, setAllUsers] = useState(true)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number } | null>(null)

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung')
      return
    }
    setSending(true)
    setResult(null)
    try {
      const { data } = await adminApi.sendNotification({ subject, message, allUsers })
      setResult(data as { sent: number })
      toast.success('Đã gửi thông báo!')
      setSubject('')
      setMessage('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Gửi thất bại'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Bell className="h-6 w-6 text-indigo-600" /> Gửi thông báo
      </h1>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button
            onClick={() => setAllUsers(true)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition-colors ${
              allUsers ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Users className="h-4 w-4" /> Tất cả người dùng
          </button>
          <button
            onClick={() => setAllUsers(false)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition-colors ${
              !allUsers ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Mail className="h-4 w-4" /> Chọn người dùng
          </button>
        </div>

        <div className="space-y-4">
          <Input label="Tiêu đề" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Nhập tiêu đề email..." />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nhập nội dung email..."
              rows={6}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end">
            <Button loading={sending} onClick={handleSend} className="flex items-center gap-2">
              <Send className="h-4 w-4" /> Gửi thông báo
            </Button>
          </div>
          {result && (
            <p className="text-sm text-green-600 text-center">
              Đã gửi thành công đến {result.sent} người dùng qua email
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
