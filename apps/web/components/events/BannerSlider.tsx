'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Event } from '@/types'
import { bannerUrl as bu } from '@/lib/utils'

interface BannerSliderProps {
  events: Event[]
}

export default function BannerSlider({ events }: BannerSliderProps) {
  const [current, setCurrent] = useState(0)
  const items = events.filter((e) => e.bannerUrl).slice(0, 5)
  const len = items.length

  const next = useCallback(() => setCurrent((p) => (p + 1) % len), [len])
  const prev = useCallback(() => setCurrent((p) => (p - 1 + len) % len), [len])

  useEffect(() => {
    if (len <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [len, next])

  if (len === 0) return null

  return (
    <div className="relative w-full max-h-[260px] overflow-hidden rounded-2xl bg-slate-100 dark:bg-gray-900" style={{ aspectRatio: '18 / 5' }}>
      {items.map((event, i) => (
        <Link
          key={event.id}
          href={`/events/${event.id}`}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <img
            src={bu(event.bannerUrl)!}
            alt={event.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
            <h2 className="text-xl sm:text-3xl font-bold text-white drop-shadow-lg">{event.title}</h2>
            <p className="mt-1 text-sm sm:text-base text-white/80">{event.location}</p>
          </div>
        </Link>
      ))}

      {len > 1 && (
        <>
          <button onClick={prev} className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md backdrop-blur-sm hover:bg-white transition-all">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-slate-700 shadow-md backdrop-blur-sm hover:bg-white transition-all">
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
