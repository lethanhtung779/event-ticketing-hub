'use client'

import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import EventCard from './EventCard'
import type { Event } from '@/types'

interface EventRowProps {
  title: string
  events: Event[]
  link?: string
}

export default function EventRow({ title, events, link }: EventRowProps) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const state = useRef({
    isDragging: false,
    startX: 0, scrollLeft: 0,
    prevX: 0, velocity: 0, raf: 0,
    moved: false,
  })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const onMouseDown = (e: MouseEvent) => {
      const s = state.current
      cancelAnimationFrame(s.raf)
      s.isDragging = true
      s.startX = e.pageX - el.offsetLeft
      s.scrollLeft = el.scrollLeft
      s.prevX = s.startX
      s.velocity = 0
      s.moved = false
      el.style.cursor = 'grabbing'
      el.style.scrollSnapType = 'none'
    }

    const onMouseMove = (e: MouseEvent) => {
      const s = state.current
      if (!s.isDragging) return
      e.preventDefault()
      const x = e.pageX - el.offsetLeft
      const delta = x - s.prevX
      if (Math.abs(delta) > 3) s.moved = true
      el.scrollLeft -= delta
      s.prevX = x
    }

    const onMouseUp = () => {
      const s = state.current
      s.isDragging = false
      el.style.cursor = 'grab'
      el.style.scrollSnapType = ''
    }

    const onDragStart = (e: DragEvent) => {
      e.preventDefault()
    }

    const onClick = (e: MouseEvent) => {
      if (state.current.moved) {
        e.preventDefault()
        e.stopPropagation()
        state.current.moved = false
      }
    }

    el.addEventListener('mousedown', onMouseDown)
    el.addEventListener('dragstart', onDragStart)
    el.addEventListener('click', onClick, true)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      el.removeEventListener('mousedown', onMouseDown)
      el.removeEventListener('dragstart', onDragStart)
      el.removeEventListener('click', onClick, true)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      cancelAnimationFrame(state.current.raf)
    }
  }, [])

  if (events.length === 0) return null

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
        {link && (
          <Link
            href={link}
            className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
          >
            {t('home.viewAll')} <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory cursor-grab select-none"
      >
        {events.map((event) => (
          <div key={event.id} className="w-[220px] sm:w-[240px] flex-none snap-start">
            <EventCard event={event} />
          </div>
        ))}
      </div>
    </section>
  )
}
