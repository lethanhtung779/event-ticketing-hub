'use client'

import { Suspense } from 'react'
import { PageSpinner } from '@/components/ui/Spinner'
import EventsContent from './content'

export default function EventsPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <EventsContent />
    </Suspense>
  )
}
