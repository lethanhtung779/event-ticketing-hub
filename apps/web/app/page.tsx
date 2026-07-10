import { Suspense } from 'react'
import { PageSpinner } from '@/components/ui/Spinner'
import { eventApi, categoryApi } from '@/lib/api'
import { unwrapList } from '@/lib/utils'
import type { Event, Category } from '@/types'
import HomeClient from './HomeClient'

export default async function HomePage() {
  let initialEvents: Event[] = []
  let initialCategories: Category[] = []

  try {
    const [eventsRes, categoriesRes] = await Promise.all([
      eventApi.getAll({ page: '1', limit: '50' }),
      categoryApi.getAll(),
    ])
    initialEvents = unwrapList<Event>(eventsRes)
    initialCategories = unwrapList<Category>(categoriesRes)
  } catch {}

  return (
    <Suspense fallback={<PageSpinner />}>
      <HomeClient
        initialEvents={initialEvents}
        initialCategories={initialCategories}
      />
    </Suspense>
  )
}
