'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Calendar,
  Users,
  Tag,
  Receipt,
  Shield,
  Ticket,
  X,
  Menu,
  TrendingUp,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Sự kiện', icon: Calendar },
  { href: '/admin/categories', label: 'Danh mục', icon: Tag },
  { href: '/admin/check-in', label: 'Check-in', icon: Shield },
  { href: '/admin/promo-codes', label: 'Mã giảm giá', icon: Receipt },
  { href: '/admin/revenue', label: 'Doanh thu', icon: TrendingUp },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/audit-logs', label: 'Nhật ký', icon: Shield },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-[80vh]">
      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-lg text-indigo-600">
            <Ticket className="h-5 w-5" />
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sidebarLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">
            &larr; Về trang chủ
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden border-b border-gray-200 bg-white px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-1 text-gray-600">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/admin" className="font-bold text-indigo-600">Admin</Link>
          <div />
        </header>

        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 lg:hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <span className="font-bold text-indigo-600">Admin Panel</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1 text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="p-3 space-y-1">
                {sidebarLinks.map((link) => {
                  const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                      )}
                    >
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </aside>
          </>
        )}

        <div className="flex-1 p-6 lg:p-8">{children}</div>
      </div>
    </div>
  )
}
