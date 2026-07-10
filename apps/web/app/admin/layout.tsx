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
  ShoppingCart,
  Star,
  Bell,
  BarChart3,
  Building2,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Sự kiện', icon: Calendar },
  { href: '/admin/orders', label: 'Đơn hàng', icon: ShoppingCart },
  { href: '/admin/categories', label: 'Danh mục', icon: Tag },
  { href: '/admin/reviews', label: 'Đánh giá', icon: Star },
  { href: '/admin/check-in', label: 'Check-in', icon: Shield },
  { href: '/admin/promo-codes', label: 'Mã giảm giá', icon: Receipt },
  { href: '/admin/revenue', label: 'Doanh thu', icon: TrendingUp },
  { href: '/admin/organizers', label: 'Nhà tổ chức', icon: Building2 },
  { href: '/admin/users', label: 'Người dùng', icon: Users },
  { href: '/admin/audit-logs', label: 'Nhật ký', icon: Shield },
  { href: '/admin/analytics', label: 'Thống kê', icon: BarChart3 },
  { href: '/admin/notifications', label: 'Thông báo', icon: Bell },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-[80vh]">
      <aside className="hidden lg:flex lg:flex-col w-64 border-r border-slate-200 bg-white dark:border-gray-800 dark:bg-black">
        <div className="p-4 border-b border-slate-200 dark:border-gray-800">
          <Link href="/admin" className="flex items-center gap-2 font-bold text-lg text-emerald-600 hover:text-emerald-700 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Ticket className="h-4 w-4 text-white" />
            </div>
            Admin Panel
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {sidebarLinks.map((link) => {
            const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate dark:text-white">{user?.fullName || 'Admin'}</p>
              <p className="text-xs text-slate-500 capitalize dark:text-gray-400">{user?.role?.toLowerCase() || 'admin'}</p>
            </div>
          </div>
          <Link href="/" className="text-xs text-slate-400 hover:text-emerald-600 transition-colors dark:text-gray-500 dark:hover:text-emerald-400">
            &larr; Về trang chủ
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden border-b border-slate-200 bg-white/80 backdrop-blur-xl px-4 py-3 flex items-center justify-between dark:border-gray-800 dark:bg-black/80">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-white/10">
            <Menu className="h-6 w-6" />
          </button>
          <Link href="/admin" className="font-bold text-emerald-600 dark:text-emerald-400">Admin</Link>
          <div />
        </header>

        {sidebarOpen && (
          <>
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 lg:hidden dark:bg-black dark:border-gray-800">
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-gray-800">
                <span className="font-bold text-emerald-600 dark:text-emerald-400">Admin Panel</span>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors dark:text-gray-300 dark:hover:bg-white/10">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="p-3 space-y-0.5">
                {sidebarLinks.map((link) => {
                  const active = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                        active ? 'bg-emerald-50 text-emerald-700 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-white/10'
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

        <div className="flex-1 p-6 lg:p-8 bg-slate-50/50 dark:bg-black">{children}</div>
      </div>
    </div>
  )
}
