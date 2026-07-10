'use client'

import { useState, useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

const STORAGE_KEY = 'tickethub_admin_settings'

const defaults = {
  siteName: 'TicketHub',
  supportEmail: 'support@tickethub.com',
  supportPhone: '1900 1234',
  currency: 'VND',
  defaultLang: 'vi',
}

export default function SettingsPage() {
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaults)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setForm({ ...defaults, ...JSON.parse(saved) })
    } catch {}
    setLoaded(true)
  }, [])

  const handleSave = async () => {
    setSaving(true)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    await new Promise((r) => setTimeout(r, 300))
    toast.success('Đã lưu cấu hình!')
    setSaving(false)
  }

  const handleReset = () => {
    setForm(defaults)
    toast.success('Đã khôi phục mặc định')
  }

  if (!loaded) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Cấu hình hệ thống</h1>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardTitle>Thông tin chung</CardTitle>
          <div className="mt-4 space-y-4">
            <Input label="Tên trang" value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
            <Input label="Email hỗ trợ" value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
            <Input label="Số điện thoại hỗ trợ" value={form.supportPhone}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} />
            <Input label="Đơn vị tiền tệ" value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            <Select label="Ngôn ngữ mặc định" value={form.defaultLang} onChange={(e) => setForm({ ...form, defaultLang: e.target.value })} options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" /> Mặc định
          </Button>
          <Button loading={saving} onClick={handleSave}>
            <Save className="h-4 w-4" /> Lưu cấu hình
          </Button>
        </div>
      </div>
    </div>
  )
}
