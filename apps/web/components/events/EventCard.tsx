import Link from 'next/link'
import { MapPin, Calendar, Clock } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, formatCurrency, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { Event } from '@/types'

interface EventCardProps {
  event: Event
}

export default function EventCard({ event }: EventCardProps) {
  const minPrice = event.ticketTypes?.length
    ? Math.min(...event.ticketTypes.map((t) => t.price))
    : 0

  return (
    <Link href={`/events/${event.id}`}>
      <Card className="group overflow-hidden transition-shadow hover:shadow-md cursor-pointer h-full flex flex-col">
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          {event.bannerUrl ? (
            <img
              src={event.bannerUrl}
              alt={event.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <Calendar className="h-12 w-12" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className={getStatusColor(event.status)}>
              {getStatusLabel(event.status)}
            </Badge>
          </div>
          {event.category && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-white/90 text-gray-800 backdrop-blur-sm">
                {event.category.name}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex flex-col flex-1 p-4">
          <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2">
            {event.title}
          </h3>

          <div className="mt-2 space-y-1.5 text-sm text-gray-500 flex-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{formatDate(event.startTime, 'EEEE, dd/MM/yyyy')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 shrink-0" />
              <span>
                {formatDate(event.startTime, 'HH:mm')} - {formatDate(event.endTime, 'HH:mm')}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{event.location}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            {minPrice > 0 ? (
              <span className="font-bold text-lg text-indigo-600">
                {formatCurrency(minPrice)} 
                {event.ticketTypes.length > 1 && <span className="text-sm font-normal text-gray-500">+</span>}
              </span>
            ) : (
              <span className="text-sm text-gray-500">Liên hệ</span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}
