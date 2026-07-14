'use client'

import { Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { PageSpinner } from '@/components/ui/Spinner'
import EventsContent from './content'
import SeoHead from '@/components/SeoHead'

export default function EventsPage() {
  const { t } = useTranslation()
  return (
    <>
      <SeoHead title={t('events.title')} description={t('events.pageDescription')} />
      <Suspense fallback={<PageSpinner />}>
        <EventsContent />
      </Suspense>
    </>
  )
}
