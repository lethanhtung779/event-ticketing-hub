import { useState, useEffect } from 'react'
import Link from 'next/link'
import { MapPin, Calendar, Clock, Heart } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel, bannerUrl as bu, getErrorMessage } from '@/lib/utils'
import { wishlistApi } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import type { Event } from '@/types'
import toast from 'react-hot-toast'

interface EventCardProps {
  event: Event
  isSaved?: boolean
}

const savedCache = new Map<string, boolean>()

export default function EventCard({ event, isSaved: initialSaved }: EventCardProps) {
  const { user } = useAuthStore()
  const [saved, setSaved] = useState(initialSaved ?? savedCache.get(event.id) ?? false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialSaved !== undefined) {
      setSaved(initialSaved)
      savedCache.set(event.id, initialSaved)
      return
    }
    if (user && !savedCache.has(event.id)) {
      wishlistApi.check(event.id).then(res => {
        const val = res.data?.isSaved ?? false
        savedCache.set(event.id, val)
        setSaved(val)
      }).catch(() => {})
    }
  }, [event.id, user, initialSaved])

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu sự kiện')
      return
    }
    setSaving(true)
    try {
      if (saved) {
        await wishlistApi.unsave(event.id)
        setSaved(false)
        toast.success('Đã bỏ lưu sự kiện')
      } else {
        await wishlistApi.save(event.id)
        setSaved(true)
        toast.success('Đã lưu sự kiện')
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Thao tác thất bại'))
    } finally {
      setSaving(false)
    }
  }

  const minPrice = event.ticketTypes?.length
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : 0

  return (
    <div className="group relative animate-fade-in-up">
      <Link href={`/events/${event.id}`} className="block h-full">
        <Card className="overflow-hidden h-full flex flex-col p-0">
          <div className="relative aspect-[7/3] overflow-hidden bg-slate-100 dark:bg-gray-800">
            {event.bannerUrl ? (
              <img
                src={bu(event.bannerUrl)!}
                alt={event.title}
                className="h-full w-full object-cover transition-all duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-300 dark:text-gray-500">
                <Calendar className="h-12 w-12" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <button
              onClick={toggleWishlist}
              disabled={saving}
              className={`absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200 ${
                saved
                  ? 'bg-red-500 text-white shadow-md'
                  : 'bg-white/80 text-slate-600 opacity-0 group-hover:opacity-100 dark:bg-neutral-900/80 dark:text-gray-300'
              }`}
            >
              <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
            </button>
            <div className="absolute top-2 left-2">
              <Badge className={getStatusColor(event.status)}>
                {getStatusLabel(event.status)}
              </Badge>
            </div>
            {event.category && (
              <div className="absolute top-2 left-2 mt-8">
                <Badge className="bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm dark:bg-neutral-900/90 dark:text-gray-100">
                  {event.category.name}
                </Badge>
              </div>
            )}
          </div>

        <div className="flex flex-col flex-1 p-3 min-w-0">
          <div className="min-h-[2.5rem]">
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors duration-200 line-clamp-2 dark:text-white dark:group-hover:text-emerald-400">
              {event.title}
            </h3>
          </div>

          <div className="mt-2 space-y-1 text-xs text-slate-500 flex-1 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-gray-400" />
              <span>{formatDate(event.startTime, 'EEEE, dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-gray-400" />
              <span>
                {formatDate(event.startTime, 'HH:mm')} - {formatDate(event.endTime, 'HH:mm')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-gray-400" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-gray-800">
            {minPrice > 0 ? (
              <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                {formatCurrency(minPrice)} 
                {event.ticketTypes.length > 1 && <span className="text-sm font-normal text-slate-400 dark:text-gray-500">+</span>}
              </span>
            ) : (
              <span className="text-sm text-slate-400 dark:text-gray-500">Liên hệ</span>
            )}
          </div>
        </div>
      </Card>
      </Link>
    </div>
  )
}
