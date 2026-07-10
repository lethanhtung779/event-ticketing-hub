'use client'

import { Suspense } from 'react'
import { PageSpinner } from '@/components/ui/Spinner'
import EventsContent from './content'
import SeoHead from '@/components/SeoHead'

export default function EventsPage() {
  return (
    <>
      <SeoHead title="Sự kiện" description="Khám phá các sự kiện hấp dẫn" />
      <Suspense fallback={<PageSpinner />}>
        <EventsContent />
      </Suspense>
    </>
  )
}
