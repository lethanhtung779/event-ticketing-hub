'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Image, Upload } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { organizerApi } from '@/lib/api'
import { getErrorMessage, bannerUrl } from '@/lib/utils'
import { useTranslation } from 'react-i18next'

export default function OrganizerProfile() {
  const { t } = useTranslation()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [logo, setLogo] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState('')

  useEffect(() => {
    organizerApi.getProfile()
      .then(({ data }) => {
        setName(data.name ?? '')
        setDescription(data.description ?? '')
        setEmail(data.email ?? '')
        setPhone(data.phone ?? '')
        setWebsite(data.website ?? '')
        setLogo(data.logo ?? '')
        if (data.logo) setLogoPreview(bannerUrl(data.logo) ?? '')
      })
      .catch((err: any) => {
        if (err?.response?.status === 404) {
          router.replace('/organizer/setup')
        } else {
          toast.error(t('organizer.loadFailed'))
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error(t('organizer.nameRequired'))
      return
    }
    setSaving(true)
    try {
      if (logoFile) {
        const fd = new FormData()
        fd.append('file', logoFile)
        await organizerApi.uploadLogo(fd)
      }
      await organizerApi.updateProfile({
        name: name.trim(),
        description: description.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
      })
      toast.success(t('organizer.updateSuccess'))
      setLogoFile(null)
    } catch (err) {
      toast.error(getErrorMessage(err, t('organizer.updateFailed')))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/organizer" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> {t('common.back')}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('organizer.profile')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardTitle>{t('organizer.logo')}</CardTitle>
          <div className="mt-4">
            <label className="flex flex-col items-center justify-center h-32 w-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-indigo-400 transition-colors">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoPreview} alt="Logo" className="h-full object-contain" />
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-500">
                  <Image className="h-8 w-8 mx-auto mb-1" />
                  <span className="text-xs">{t('organizer.chooseLogo')}</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
        </Card>

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

        <div className="flex items-center justify-end gap-3">
          <Link href="/organizer">
            <Button variant="secondary" type="button">{t('common.cancel')}</Button>
          </Link>
          <Button type="submit" loading={saving}>{t('organizer.saveChanges')}</Button>
        </div>
      </form>
    </div>
  )
}
