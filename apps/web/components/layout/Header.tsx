'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Search, Ticket, Menu, X, User, LogOut, Settings, Plus, Calendar } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/stores/auth-store'
import LanguageSwitcher from './LanguageSwitcher'

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
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
            <Ticket className="h-6 w-6" />
            TicketHub
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-2 lg:gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sự kiện..."
              className="w-40 lg:w-56 rounded-lg border border-gray-300 pl-8 pr-3 py-1.5 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </form>
          {isAuthenticated && (
            <>
              <Link href="/my-tickets" className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors">
                {t('nav.myTickets')}
              </Link>
              <Link href="/organizer/events/new" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5">
                <Plus className="h-4 w-4" /> Tạo sự kiện
              </Link>
            </>
          )}
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden lg:block">{user?.fullName}</span>
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      href="/organizer/events"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Calendar className="h-4 w-4" />
                      Sự kiện của tôi
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <Link
                      href="/my-tickets"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Ticket className="h-4 w-4" />
                      {t('nav.myTickets')}
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4" />
                      {t('nav.profile')}
                    </Link>
                    {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        {t('nav.admin')}
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
              >
                {t('nav.login')}
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                {t('nav.register')}
              </Link>
            </>
          )}
          <div className="hidden sm:block w-px h-6 bg-gray-200" />
          <LanguageSwitcher />
        </div>

        <button
          className="md:hidden p-2 text-gray-600"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <LanguageSwitcher />
            <button onClick={() => setMobileOpen(false)} className="p-1 text-gray-600">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sự kiện..."
              className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </form>
          <hr className="border-gray-100" />
          {isAuthenticated ? (
            <>
              <Link href="/organizer/events" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600">
                Sự kiện của tôi
              </Link>
              <Link href="/organizer/reports" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600">
                Quản lý báo cáo
              </Link>
              <Link href="/organizer/terms" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600">
                Điều khoản BTC
              </Link>
              <hr className="border-gray-100" />
              <Link href="/my-tickets" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600">
                {t('nav.myTickets')}
              </Link>
              <button onClick={() => { logout(); setMobileOpen(false) }} className="block text-sm font-medium text-red-600">
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600">
                {t('nav.login')}
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-indigo-600">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
