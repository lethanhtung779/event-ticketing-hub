'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Shield, Zap } from 'lucide-react'
import EventCard from '@/components/events/EventCard'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { eventApi } from '@/lib/api'
import { unwrapList } from '@/lib/utils'
import type { Event } from '@/types'

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eventApi
      .getAll({ page: '1', limit: '6' })
      .then((res) => setFeaturedEvents(unwrapList<Event>(res)))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 relative">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Đặt vé sự kiện dễ dàng hơn bao giờ hết
            </h1>
            <p className="mt-6 text-lg leading-8 text-indigo-100">
              TicketHub giúp bạn tìm kiếm, đặt vé và tham gia các sự kiện yêu thích một cách nhanh chóng và an toàn.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/events">
                <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50">
                  Khám phá sự kiện
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Đăng ký ngay
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { icon: Zap, title: 'Đặt vé nhanh chóng', desc: 'Quy trình đặt vé chỉ với vài cú click chuột, thanh toán an toàn.' },
              { icon: Shield, title: 'Bảo mật tuyệt đối', desc: 'Thông tin cá nhân và giao dịch được bảo vệ với công nghệ mã hoá cao cấp.' },
              { icon: Sparkles, title: 'Đa dạng sự kiện', desc: 'Hàng ngàn sự kiện từ âm nhạc, thể thao đến hội nghị công nghệ.' },
            ].map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sự kiện nổi bật</h2>
            <p className="mt-1 text-gray-600">Những sự kiện đang được quan tâm nhất</p>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <PageSpinner />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link href="/events">
            <Button variant="outline">
              Xem tất cả sự kiện <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  )
}
