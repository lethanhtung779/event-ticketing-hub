'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Heart, ArrowLeft } from 'lucide-react'
import EventCard from '@/components/events/EventCard'
import { PageSpinner } from '@/components/ui/Spinner'
import { useAuthStore } from '@/stores/auth-store'
import { wishlistApi } from '@/lib/api'
import { unwrapList } from '@/lib/utils'
import type { Event } from '@/types'
import SeoHead from '@/components/SeoHead'

export default function WishlistPage() {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    wishlistApi.getMyWishlist()
      .then(res => {
        const list = unwrapList<any>(res)
        const evts = list.map((item: any) => item.event ?? item).filter(Boolean)
        setEvents(evts as Event[])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user])

  if (!user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <Heart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('wishlist.loginTitle')}</h1>
        <p className="text-gray-500 mb-4">{t('wishlist.loginRequired')}</p>
        <Link href="/login" className="inline-block rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700">{t('auth.loginBtn')}</Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SeoHead title={t('wishlist.title')} />
      <div className="flex items-center gap-4 mb-8">
        <Link href="/profile" className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('wishlist.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('wishlist.subtitle')}</p>
        </div>
      </div>

      {loading ? (
        <PageSpinner />
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-500 dark:text-gray-400">
          <Heart className="h-16 w-16 mb-4 text-gray-300 dark:text-gray-600" />
          <p className="text-lg font-medium">{t('wishlist.empty')}</p>
          <p className="text-sm mt-1">{t('wishlist.emptyDesc')}</p>
          <Link href="/events" className="mt-4 rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors">
            {t('wishlist.exploreEvents')}
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
