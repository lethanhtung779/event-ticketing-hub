'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Shield } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { organizerApi } from '@/lib/api'
import { getErrorMessage } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export default function OrganizerSetup() {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(t('organizer.nameRequired'))
      return
    }
    setLoading(true)
    try {
      await organizerApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
      })
      toast.success(t('organizer.createSuccess'))
      router.push('/organizer')
    } catch (err) {
      toast.error(getErrorMessage(err, t('organizer.createFailed')))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/organizer" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('organizer.createProfileTitle')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardTitle>{t('organizer.organizerInfo')}</CardTitle>
          <div className="mt-4 space-y-4">
            <Input
              label={t('organizer.organizerNameRequired')}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('organizer.namePlaceholder')}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('organizer.description')}</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder={t('organizer.descPlaceholder')}
                className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle>{t('organizer.contactInfo')}</CardTitle>
          <div className="mt-4 space-y-4">
            <Input
              label={t('organizer.email')}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="contact@example.com"
            />
            <Input
              label={t('organizer.phone')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0901234567"
            />
            <Input
              label={t('organizer.website')}
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
        </Card>

        <Card className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">{t('organizer.noticeTitle')}</p>
              <p className="mt-1">{t('organizer.setupNotice')}</p>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Link href="/organizer">
            <Button variant="secondary" type="button">{t('common.cancel')}</Button>
          </Link>
          <Button type="submit" loading={loading}>
            {t('organizer.createProfile')}
          </Button>
        </div>
      </form>
    </div>
  )
}
