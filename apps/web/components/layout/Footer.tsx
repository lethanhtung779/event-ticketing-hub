'use client'

import Link from 'next/link'
import { Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-600">
              <Ticket className="h-5 w-5" />
              {t('app.name')}
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              {t('app.tagline')}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('footer.links')}</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/events" className="text-sm text-gray-500 hover:text-indigo-600">{t('nav.events')}</Link></li>
              <li><Link href="/login" className="text-sm text-gray-500 hover:text-indigo-600">{t('nav.login')}</Link></li>
              <li><Link href="/register" className="text-sm text-gray-500 hover:text-indigo-600">{t('nav.register')}</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">{t('footer.support')}</h3>
            <ul className="mt-3 space-y-2">
              <li><span className="text-sm text-gray-500">{t('footer.email')}</span></li>
              <li><span className="text-sm text-gray-500">{t('footer.phone')}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-400">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  )
}
