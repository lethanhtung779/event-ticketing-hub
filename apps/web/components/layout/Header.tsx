'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Ticket, Menu, X, User, LogOut, Settings } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'

const navLinks = [
  { href: '/', label: 'Trang chủ' },
  { href: '/events', label: 'Sự kiện' },
]

export default function Header() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuthStore()

  if (pathname.startsWith('/admin')) return null

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600">
          <Ticket className="h-6 w-6" />
          TicketHub
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-indigo-600',
                pathname === link.href ? 'text-indigo-600' : 'text-gray-600'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
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
                      href="/my-tickets"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Ticket className="h-4 w-4" />
                      Vé của tôi
                    </Link>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="h-4 w-4" />
                      Hồ sơ
                    </Link>
                    {(user?.role === 'ADMIN' || user?.role === 'STAFF') && (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Quản trị
                      </Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false) }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
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
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
              >
                Đăng ký
              </Link>
            </>
          )}
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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block text-sm font-medium',
                pathname === link.href ? 'text-indigo-600' : 'text-gray-600'
              )}
            >
              {link.label}
            </Link>
          ))}
          <hr className="border-gray-100" />
          {isAuthenticated ? (
            <>
              <Link href="/my-tickets" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600">
                Vé của tôi
              </Link>
              <button onClick={() => { logout(); setMobileOpen(false) }} className="block text-sm font-medium text-red-600">
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600">
                Đăng nhập
              </Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-indigo-600">
                Đăng ký
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  )
}
