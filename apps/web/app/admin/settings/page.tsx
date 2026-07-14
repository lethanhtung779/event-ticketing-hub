'use client'

import { useState, useEffect } from 'react'
import { Save, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

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
    toast.success(t('admin.toastConfigSaved'))
    setSaving(false)
  }

  const handleReset = () => {
    setForm(defaults)
    toast.success(t('admin.toastReset'))
  }

  if (!loaded) return null

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('admin.systemSettings')}</h1>

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardTitle>{t('admin.generalInfo')}</CardTitle>
          <div className="mt-4 space-y-4">
            <Input label={t('admin.siteName')} value={form.siteName}
              onChange={(e) => setForm({ ...form, siteName: e.target.value })} />
            <Input label={t('admin.supportEmail')} value={form.supportEmail}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })} />
            <Input label={t('admin.supportPhone')} value={form.supportPhone}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })} />
            <Input label={t('admin.currency')} value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })} />
            <Select label={t('admin.defaultLang')} value={form.defaultLang} onChange={(e) => setForm({ ...form, defaultLang: e.target.value })} options={[{ value: 'vi', label: 'Tiếng Việt' }, { value: 'en', label: 'English' }]} />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" /> {t('admin.resetDefaults')}
          </Button>
          <Button loading={saving} onClick={handleSave}>
            <Save className="h-4 w-4" /> {t('admin.saveConfig')}
          </Button>
        </div>
      </div>
    </div>
  )
}
