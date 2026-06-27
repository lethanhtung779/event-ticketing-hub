'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, Music, Theater, Trophy, Users, Compass, MoreHorizontal, Ticket, Newspaper } from 'lucide-react'
import EventCard from '@/components/events/EventCard'
import { Pagination } from '@/components/ui/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { eventApi, categoryApi } from '@/lib/api'
import { unwrapList, unwrapMeta } from '@/lib/utils'
import type { Event, Category } from '@/types'

const CATEGORIES = [
  { label: 'Nhạc sống', icon: Music },
  { label: 'Sân khấu & Nghệ thuật', icon: Theater },
  { label: 'Thể Thao', icon: Trophy },
  { label: 'Hội thảo & Workshop', icon: Users },
  { label: 'Tham quan & Trải nghiệm', icon: Compass },
  { label: 'Khác', icon: MoreHorizontal },
  { label: 'Vé bán lại', icon: Ticket },
  { label: 'Blog', icon: Newspaper },
]

export default function HomePage() {
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
  const [activeCategory, setActiveCategory] = useState('')

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
    router.replace(qs ? `/?${qs}` : '/', { scroll: false })
  }, [search, categoryId, location, page, router])

  const handleCategoryClick = (label: string) => {
    if (activeCategory === label) {
      setActiveCategory('')
      setSearch('')
      setCategoryId('')
    } else {
      setActiveCategory(label)
      const match = categories.find((c) => c.name.toLowerCase() === label.toLowerCase())
      if (match) {
        setCategoryId(match.id)
        setSearch('')
      } else {
        setSearch(label)
        setCategoryId('')
      }
    }
    setPage(1)
  }

  const handleClear = () => {
    setSearch('')
    setCategoryId('')
    setLocation('')
    setActiveCategory('')
    setPage(1)
  }

  const hasFilters = search || categoryId || location

  return (
    <div>
      <div className="sticky top-16 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                onClick={() => handleCategoryClick(cat.label)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeCategory === cat.label
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeCategory || 'Tất cả sự kiện'}
            </h1>
            {total > 0 && (
              <p className="mt-1 text-sm text-gray-500">{total} sự kiện</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm mb-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sự kiện..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); setActiveCategory('') }}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); setActiveCategory('') }}
              className="block w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">Danh mục</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Địa điểm..."
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1) }}
                className="block w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <button onClick={handleClear} className="text-sm text-gray-500 hover:text-gray-700">
                Xoá bộ lọc
              </button>
            </div>
          )}
        </div>

        <div className="mt-6">
          {loading ? (
            <PageSpinner />
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <p className="text-lg font-medium">Không tìm thấy sự kiện nào</p>
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
    </div>
  )
}
