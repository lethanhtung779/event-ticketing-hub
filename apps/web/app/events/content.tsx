'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import EventCard from '@/components/events/EventCard'
import EventFilters from '@/components/events/EventFilters'
import { Pagination } from '@/components/ui/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { eventApi, categoryApi } from '@/lib/api'
import { unwrapList, unwrapMeta } from '@/lib/utils'
import type { Event, Category } from '@/types'

export default function EventsContent() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: '12' }
      if (search) params.search = search
      if (categoryId) params.categoryId = categoryId
      if (location) params.location = location

      const res = await eventApi.getAll(params)
      const list = unwrapList<Event>(res)
      setEvents(list)
      const meta = unwrapMeta(res)
      if (meta) {
        setTotalPages(meta.totalPages)
        setTotal(meta.total)
      }
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId, location])

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(unwrapList<Category>(res))).catch(() => {})
  }, [])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryId) params.set('categoryId', categoryId)
    if (location) params.set('location', location)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `/events?${qs}` : '/events', { scroll: false })
  }, [search, categoryId, location, page, router])

  const handleClear = () => {
    setSearch('')
    setCategoryId('')
    setLocation('')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{t('events.title')}</h1>
        <p className="mt-2 text-gray-600">
          {total > 0 ? `${total} ${t('events.title').toLowerCase()}` : ''}
        </p>
      </div>

      <EventFilters
        search={search}
        categoryId={categoryId}
        location={location}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryId}
        onLocationChange={setLocation}
        onClear={handleClear}
      />

      <div className="mt-6">
        {loading ? (
          <PageSpinner />
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <p className="text-lg font-medium">{t('events.noEvents')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
            <div className="mt-8">
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
