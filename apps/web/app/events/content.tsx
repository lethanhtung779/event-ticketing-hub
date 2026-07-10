'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import EventCard from '@/components/events/EventCard'
import EventFilters from '@/components/events/EventFilters'
import { Pagination } from '@/components/ui/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { eventApi, categoryApi, wishlistApi } from '@/lib/api'
import { unwrapList, unwrapMeta } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
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
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'startTime_asc')
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [fromDate, setFromDate] = useState(searchParams.get('fromDate') || '')
  const [toDate, setToDate] = useState(searchParams.get('toDate') || '')
  const [organizerId, setOrganizerId] = useState(searchParams.get('organizerId') || '')
  const [organizerName, setOrganizerName] = useState('')
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const { user } = useAuthStore()
  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return }
    wishlistApi.getMyWishlist().then((res) => {
      const list = unwrapList<{ id: string }>(res)
      setSavedIds(new Set(list.map((e: any) => e.id)))
    }).catch(() => {})
  }, [user])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { page: String(page), limit: '12' }
      if (search) params.search = search
      if (categoryId) params.categoryId = categoryId
      if (location) params.location = location
      if (organizerId) params.organizerId = organizerId
      if (sortBy && sortBy !== 'startTime_asc') params.sortBy = sortBy
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate

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
  }, [page, search, categoryId, location, sortBy, organizerId])

  useEffect(() => {
    categoryApi.getAll().then((res) => setCategories(unwrapList<Category>(res))).catch(() => {})
  }, [])

  useEffect(() => {
    if (organizerId && events.length > 0 && !organizerName) {
      const org = events[0]?.organizer
      if (org) setOrganizerName(org.name)
    }
  }, [organizerId, events, organizerName])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  useEffect(() => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (categoryId) params.set('categoryId', categoryId)
    if (location) params.set('location', location)
    if (organizerId) params.set('organizerId', organizerId)
    if (sortBy && sortBy !== 'startTime_asc') params.set('sortBy', sortBy)
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (fromDate) params.set('fromDate', fromDate)
    if (toDate) params.set('toDate', toDate)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    router.replace(qs ? `/events?${qs}` : '/events', { scroll: false })
  }, [search, categoryId, location, sortBy, minPrice, maxPrice, fromDate, toDate, page, organizerId, router])

  const handleClear = () => {
    setSearch('')
    setCategoryId('')
    setLocation('')
    setSortBy('startTime_asc')
    setMinPrice('')
    setMaxPrice('')
    setFromDate('')
    setToDate('')
    setOrganizerId('')
    setOrganizerName('')
    setPage(1)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {organizerName ? organizerName : t('events.title')}
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          {organizerName ? 'Sự kiện của nhà tổ chức này' : (total > 0 ? `${total} ${t('events.title').toLowerCase()}` : '')}
        </p>
      </div>

      <EventFilters
        search={search}
        categoryId={categoryId}
        location={location}
        sortBy={sortBy}
        minPrice={minPrice}
        maxPrice={maxPrice}
        fromDate={fromDate}
        toDate={toDate}
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setCategoryId}
        onLocationChange={setLocation}
        onSortChange={setSortBy}
        onMinPriceChange={setMinPrice}
        onMaxPriceChange={setMaxPrice}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        onClear={handleClear}
      />

      <div className="mt-6">
        {loading ? (
          <PageSpinner />
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">{t('events.noEvents')}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} isSaved={savedIds.has(event.id)} />
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
