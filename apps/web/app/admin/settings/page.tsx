'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'

export default function SettingsPage() {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    siteName: 'TicketHub',
    supportEmail: 'support@tickethub.com',
    supportPhone: '1900 1234',
    currency: 'VND',
    defaultLang: 'vi',
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 500))
    toast.success('Đã lưu cấu hình!')
    setSaving(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Cấu hình hệ thống</h1>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardTitle>Thông tin chung</CardTitle>
          <div className="mt-4 space-y-4">
            <Input label="Tên trang" value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
            <Input label="Email hỗ trợ" value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
            <Input label="Số điện thoại" value={form.supportPhone}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} />
            <Input label="Đơn vị tiền tệ" value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })} />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button loading={saving} onClick={handleSave}>
            <Save className="h-4 w-4" /> Lưu cấu hình
          </Button>
        </div>
      </div>
    </div>
  )
}
