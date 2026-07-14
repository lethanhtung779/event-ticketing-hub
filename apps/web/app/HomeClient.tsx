'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { Search, MapPin, Calendar, Music, Theater, Trophy, Users, Compass, MoreHorizontal, Ticket, Newspaper } from 'lucide-react'
import EventCard from '@/components/events/EventCard'
import EventRow from '@/components/events/EventRow'
import BannerSlider from '@/components/events/BannerSlider'
import { Pagination } from '@/components/ui/Pagination'
import { PageSpinner } from '@/components/ui/Spinner'
import { eventApi, wishlistApi } from '@/lib/api'
import { unwrapList, unwrapMeta } from '@/lib/utils'
import type { Event, Category } from '@/types'
import { isWeekend, isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import SeoHead from '@/components/SeoHead'
import { useAuthStore } from '@/stores/auth-store'

const CATEGORIES = [
  { label: 'Nhạc sống', labelKey: 'home.catLiveMusic', icon: Music },
  { label: 'Sân khấu & Nghệ thuật', labelKey: 'home.catTheatre', icon: Theater },
  { label: 'Thể Thao', labelKey: 'home.catSports', icon: Trophy },
  { label: 'Hội thảo & Workshop', labelKey: 'home.catWorkshop', icon: Users },
  { label: 'Tham quan & Trải nghiệm', labelKey: 'home.catExperience', icon: Compass },
  { label: 'Khác', labelKey: 'home.catOther', icon: MoreHorizontal },
  { label: 'Vé bán lại', labelKey: 'home.catResale', icon: Ticket },
  { label: 'Blog', labelKey: 'home.catBlog', icon: Newspaper },
]

const CATEGORY_SECTIONS = [
  { title: 'Nhạc sống', titleKey: 'home.catLiveMusic', label: 'Nhạc sống', labelKey: 'home.catLiveMusic', icon: Music, link: '/events?category=Nhạc sống' },
  { title: 'Sân khấu & Nghệ thuật', titleKey: 'home.catTheatre', label: 'Sân khấu & Nghệ thuật', labelKey: 'home.catTheatre', icon: Theater, link: '/events?category=Sân khấu & Nghệ thuật' },
  { title: 'Hội thảo & Workshop', titleKey: 'home.catWorkshop', label: 'Hội thảo & Workshop', labelKey: 'home.catWorkshop', icon: Users, link: '/events?category=Hội thảo & Workshop' },
  { title: 'Tham quan & Trải nghiệm', titleKey: 'home.catExperience', label: 'Tham quan & Trải nghiệm', labelKey: 'home.catExperience', icon: Compass, link: '/events?category=Tham quan & Trải nghiệm' },
  { title: 'Thể thao & Thể loại khác', titleKey: 'home.catSports', label: 'Thể Thao', labelKey: 'home.catSports', icon: Trophy, link: '/events?category=Thể Thao' },
]

interface HomeClientProps {
  initialEvents: Event[]
  initialCategories: Category[]
}

export default function HomeClient({ initialEvents, initialCategories }: HomeClientProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [allEvents, setAllEvents] = useState<Event[]>(initialEvents)
  const [categories] = useState<Category[]>(initialCategories)
  const [loading, setLoading] = useState(initialEvents.length === 0)
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [categoryId, setCategoryId] = useState(searchParams.get('categoryId') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [activeCategory, setActiveCategory] = useState('')
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

      const res = await eventApi.getAll(params)
      const list = unwrapList<Event>(res)
      setAllEvents(list)
      const meta = unwrapMeta(res)
      if (meta) {
        setTotalPages(meta.totalPages)
        setTotal(meta.total)
      }
    } catch {
      setAllEvents([])
    } finally {
      setLoading(false)
    }
  }, [page, search, categoryId, location])

  const fetchAllPublished = useCallback(async () => {
    try {
      const res = await eventApi.getAll({ page: '1', limit: '50' })
      return unwrapList<Event>(res)
    } catch {
      return []
    }
  }, [])

  const [featuredEvents, setFeaturedEvents] = useState<Event[]>(initialEvents)

  const hasFilters = search || categoryId || location

  useEffect(() => {
    if (hasFilters) {
      fetchEvents()
    } else if (initialEvents.length === 0) {
      fetchAllPublished().then((events) => {
        setFeaturedEvents(events)
        setAllEvents(events)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [fetchEvents, fetchAllPublished, hasFilters, initialEvents.length])

  useEffect(() => {
    if (!search && !categoryId && !location) return
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

  const now = new Date()

  const { weekendEvents, monthEvents, sectionsByCategory } = useMemo(() => {
    const weekend: Event[] = []
    const month: Event[] = []
    const byCategory: Record<string, Event[]> = {}

    for (const event of featuredEvents) {
      const start = parseISO(event.startTime as string)

      if (isWeekend(start)) weekend.push(event)

      if (isWithinInterval(start, { start: startOfMonth(now), end: endOfMonth(now) })) {
        month.push(event)
      }

      const catName = event.category?.name
      if (catName) {
        if (!byCategory[catName]) byCategory[catName] = []
        byCategory[catName].push(event)
      }
    }

    return {
      weekendEvents: weekend.slice(0, 10),
      monthEvents: month.slice(0, 10),
      sectionsByCategory: byCategory,
    }
  }, [featuredEvents, now])

  const specialEvents = useMemo(() => featuredEvents.filter((e) => e.status === 'PUBLISHED').slice(0, 10), [featuredEvents])
  const trendingEvents = useMemo(() =>
    [...featuredEvents]
      .filter((e) => e.status === 'PUBLISHED')
      .sort((a, b) => {
        const aSold = (a.ticketTypes ?? []).reduce((sum, tt) => sum + (tt.soldQuantity ?? 0), 0)
        const bSold = (b.ticketTypes ?? []).reduce((sum, tt) => sum + (tt.soldQuantity ?? 0), 0)
        return bSold - aSold
      })
      .slice(0, 10),
  [featuredEvents])

  const shouldShowSections = !hasFilters

  return (
    <div>
      <SeoHead title={t('nav.home')} description={t('app.tagline')} />
      {/* Banner Slider */}
      {!hasFilters && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6">
          <BannerSlider events={featuredEvents} />
        </div>
      )}
      {/* Category Pills */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70 dark:border-gray-800 dark:bg-black/80 dark:supports-[backdrop-filter]:bg-black/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1.5 overflow-x-auto py-3 scrollbar-hide">
            {CATEGORIES.map((cat, index) => (
              <button
                key={cat.label}
                onClick={() => handleCategoryClick(cat.label)}
                style={{ animationDelay: `${index * 30}ms` }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 shrink-0 ${
                  activeCategory === cat.label
                    ? 'bg-emerald-600 text-white shadow-sm dark:bg-emerald-500'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }`}
              >
                <cat.icon className="h-4 w-4" />
                {t(cat.labelKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {shouldShowSections && (
          <>
            {loading ? (
              <PageSpinner />
            ) : (
              <>
                {specialEvents.length > 0 && (
                  <EventRow
                    title={t('home.sectionSpecial')}
                    events={specialEvents}
                    link="/events"
                  />
                )}

                {trendingEvents.length > 0 && (
                  <EventRow
                    title={t('home.sectionTrending')}
                    events={trendingEvents}
                    link="/events"
                  />
                )}

                {weekendEvents.length > 0 && (
                  <EventRow
                    title={t('home.sectionWeekend')}
                    events={weekendEvents}
                    link="/events"
                  />
                )}

                {monthEvents.length > 0 && (
                  <EventRow
                    title={t('home.sectionMonth')}
                    events={monthEvents}
                    link="/events"
                  />
                )}

                {CATEGORY_SECTIONS.map((section) => {
                  const catName = section.label
                  const catEvents = sectionsByCategory[catName]
                  if (!catEvents || catEvents.length === 0) return null
                  return (
                    <EventRow
                      key={section.title}
                      title={t(section.titleKey)}
                      events={catEvents.slice(0, 10)}
                      link={section.link}
                    />
                  )
                })}
              </>
            )}
          </>
        )}

        {/* Divider + heading */}
        <div className="mb-6 mt-16 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-gray-800" />
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-400 dark:text-gray-500">
            {shouldShowSections ? t('home.exploreMore') : t('events.title')}
          </h2>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 to-transparent dark:via-gray-800" />
        </div>

        {/* Filters */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_0_rgb(0_0_0_/_0.04),0_1px_2px_-1px_rgb(0_0_0_/_0.06)] mb-8 transition-shadow duration-200 dark:border-gray-800 dark:bg-neutral-900">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-400" />
              <input
                type="text"
                placeholder={t('events.searchPlaceholder')}
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); setActiveCategory('') }}
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
              />
            </div>
            <select
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setPage(1); setActiveCategory('') }}
              className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-neutral-900 dark:text-white dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
            >
              <option value="">{t('events.filterCategory')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-gray-400" />
              <input
                type="text"
                placeholder={t('events.filterLocation')}
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1) }}
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-all duration-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-gray-700 dark:bg-neutral-900 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/20"
              />
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleClear}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors dark:text-gray-400 dark:hover:text-gray-200"
              >
                {t('events.clearFilters')}
              </button>
            </div>
          )}
        </div>

        {/* Events Grid */}
        <div className="mt-6">
          {loading ? (
            <PageSpinner />
          ) : allEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 animate-fade-in dark:text-gray-500">
              <Calendar className="h-16 w-16 mb-4 text-slate-300 dark:text-gray-600" />
              <p className="text-lg font-medium text-slate-500 dark:text-gray-400">{t('events.noEvents')}</p>
              <p className="text-sm mt-1">{t('home.noResultsHint')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {allEvents.map((event) => (
                  <EventCard key={event.id} event={event} isSaved={savedIds.has(event.id)} />
                ))}
              </div>
              <div className="mt-10">
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
