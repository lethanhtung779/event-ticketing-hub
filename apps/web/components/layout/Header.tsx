'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Ticket, Menu, X, User, LogOut, Settings, Plus, Calendar, ChevronDown, Heart, Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/components/theme/ThemeProvider'
import { useAuthStore } from '@/stores/auth-store'
import { useNotificationStore, type Notification } from '@/stores/notification-store'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from '@/components/theme/ThemeToggle'
import Avatar from '@/components/ui/Avatar'
import { formatRelative } from '@/lib/utils'

export default function Header() {
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { user, isAuthenticated, logout } = useAuthStore()

  if (pathname.startsWith('/admin') || pathname.startsWith('/organizer')) return null

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/events?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/15 bg-emerald-600 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white hover:text-emerald-100 transition-colors">
            <Ticket className="h-6 w-6" />
            <span className="hidden sm:inline">TicketHub</span>
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          <form onSubmit={handleSearch} className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60 transition-colors group-focus-within:text-white" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('events.searchPlaceholder')}
              className="w-40 lg:w-56 rounded-lg border border-white/20 bg-white/15 pl-9 pr-3 py-1.5 text-sm text-white placeholder:text-white/50 transition-all duration-200 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </form>
          {isAuthenticated && (
            <>
              <Link href="/my-tickets" className="text-sm font-medium text-white/85 hover:text-white transition-colors">
                {t('nav.myTickets')}
              </Link>
              <Link href="/organizer/events/new" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97] flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> {t('nav.createEvent')}
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/85 hover:bg-white/10 transition-all duration-200"
              >
                <Avatar src={user?.avatar} name={user?.fullName} size="sm" />
                <span className="hidden lg:block">{user?.fullName}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-white/60 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-2xl border border-slate-200 bg-white py-2 shadow-[0_4px_16px_-4px_rgb(0_0_0_/_0.1),0_2px_4px_-4px_rgb(0_0_0_/_0.04)] animate-scale-in origin-top-right dark:border-gray-800 dark:bg-neutral-900">
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-gray-800">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.fullName}</p>
                      <p className="text-xs text-slate-500 mt-0.5 dark:text-gray-400">{user?.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href="/organizer/events"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-gray-200 dark:hover:bg-white/5"
                      >
                        <Calendar className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                        {t('nav.myEvents')}
                      </Link>
                      <hr className="my-1 border-slate-100 dark:border-gray-800" />
                      <Link
                        href="/wishlist"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-gray-200 dark:hover:bg-white/5"
                      >
                        <Heart className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                        {t('nav.wishlist')}
                      </Link>
                      <Link
                        href="/my-tickets"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-gray-200 dark:hover:bg-white/5"
                      >
                        <Ticket className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                        {t('nav.myTickets')}
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-gray-200 dark:hover:bg-white/5"
                      >
                        <User className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                        {t('nav.profile')}
                      </Link>
                      {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors dark:text-gray-200 dark:hover:bg-white/5"
                        >
                          <Settings className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                          {t('nav.admin')}
                        </Link>
                      )}
                    </div>
                    <div className="border-t border-slate-100 dark:border-gray-800 pt-1">
                      <button
                        onClick={() => { logout(); setUserMenuOpen(false) }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <LogOut className="h-4 w-4" />
                        {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-sm font-medium text-white/85 hover:text-white transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.97]"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
          {isAuthenticated && <NotificationBell />}
          <div className="hidden sm:block w-px h-6 bg-white/20" />
          <ThemeToggle />
          <LanguageSwitcher />
        </div>

        <button
          className="md:hidden p-2 text-white/85 hover:text-white transition-colors"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/15 bg-emerald-700 px-4 py-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between gap-2">
            <ThemeToggle />
            <LanguageSwitcher />
            <button onClick={() => setMobileOpen(false)} className="p-1 text-white/85 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('events.searchPlaceholder')}
              className="w-full rounded-lg border border-white/20 bg-white/15 pl-10 pr-3 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
            />
          </form>
          <hr className="border-white/15" />
          {isAuthenticated ? (
            <>
              <Link href="/organizer/events" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-1 py-1.5 text-sm font-medium text-white/85 hover:text-white transition-colors">
                <Calendar className="h-4 w-4 text-white/60" />
                {t('nav.myEvents')}
              </Link>
              <Link href="/my-tickets" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-1 py-1.5 text-sm font-medium text-white/85 hover:text-white transition-colors">
                <Ticket className="h-4 w-4 text-white/60" />
                {t('nav.myTickets')}
              </Link>
              <Link href="/profile" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-1 py-1.5 text-sm font-medium text-white/85 hover:text-white transition-colors">
                <User className="h-4 w-4 text-white/60" />
                {t('nav.profile')}
              </Link>
              {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2.5 px-1 py-1.5 text-sm font-medium text-white/85 hover:text-white transition-colors">
                  <Settings className="h-4 w-4 text-white/60" />
                  {t('nav.admin')}
                </Link>
              )}
              <hr className="border-white/15" />
              <button onClick={() => { logout(); setMobileOpen(false) }} className="flex items-center gap-2.5 px-1 py-1.5 text-sm font-medium text-red-300 hover:text-red-200 transition-colors">
                <LogOut className="h-4 w-4" />
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block rounded-lg px-4 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 transition-colors text-center">
                {t('nav.login')}
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="block rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors text-center">
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

function NotificationBell() {
  const { t } = useTranslation()
  const { notifications, unreadCount, markRead, markAllRead } = useNotificationStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleMarkRead = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    markRead(id)
  }

  const typeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'ticket_available': return '🎫'
      case 'payment_confirmed': return '✅'
      case 'ticket_cancelled': return '❌'
      case 'event_update': return '📢'
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white/85 hover:bg-white/10 hover:text-white transition-all duration-200"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-emerald-600">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-[0_4px_16px_-4px_rgb(0_0_0_/_0.1),0_2px_4px_-4px_rgb(0_0_0_/_0.04)] animate-scale-in origin-top-right dark:border-gray-800 dark:bg-neutral-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('notification.title')}</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                <CheckCheck className="h-3.5 w-3.5" /> {t('notification.markAllRead')}
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-8 w-8 text-slate-300 dark:text-gray-600 mb-2" />
                <p className="text-sm text-slate-500 dark:text-gray-400">{t('notification.empty')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 dark:border-gray-800/50 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 ${n.read ? '' : 'bg-indigo-50/50 dark:bg-emerald-900/10'}`}
                >
                  <span className="mt-0.5 text-base">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${n.read ? 'text-slate-600 dark:text-gray-300' : 'font-semibold text-slate-900 dark:text-white'}`}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 mt-1">{formatRelative(n.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {!n.read && (
                      <button onClick={(e) => handleMarkRead(e, n.id)} className="text-[10px] text-indigo-600 hover:text-indigo-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                        {t('notification.read')}
                      </button>
                    )}
                    {n.link && (
                      <Link href={n.link} onClick={() => setOpen(false)} className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-gray-300">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
