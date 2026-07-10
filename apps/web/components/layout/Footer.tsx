'use client'

import Link from 'next/link'
import { Ticket, Mail, Phone, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <footer className="border-t border-slate-200 bg-slate-50 mt-auto dark:border-gray-800 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-emerald-600 hover:text-emerald-700 transition-colors dark:text-emerald-400 dark:hover:text-emerald-300">
              <Ticket className="h-5 w-5" />
              {t('app.name')}
            </Link>
            <p className="mt-3 text-sm text-slate-500 leading-relaxed max-w-md dark:text-gray-400">
              {t('app.tagline')}
            </p>
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-400 dark:text-gray-500">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {t('footer.email')}
              </span>
              <span className="w-px h-4 bg-slate-300 dark:bg-gray-800" />
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {t('footer.phone')}
              </span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('footer.links')}</h3>
            <ul className="mt-3 space-y-2.5">
              <li>
                <Link href="/events" className="group inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 transition-colors dark:text-gray-300 dark:hover:text-emerald-400">
                  {t('nav.events')}
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all" />
                </Link>
              </li>
              <li>
                <Link href="/login" className="group inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 transition-colors dark:text-gray-300 dark:hover:text-emerald-400">
                  {t('nav.login')}
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all" />
                </Link>
              </li>
              <li>
                <Link href="/register" className="group inline-flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 transition-colors dark:text-gray-300 dark:hover:text-emerald-400">
                  {t('nav.register')}
                  <ArrowUpRight className="h-3 w-3 opacity-0 -translate-y-0.5 group-hover:opacity-100 transition-all" />
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('footer.support')}</h3>
            <ul className="mt-3 space-y-2.5">
              <li className="text-sm text-slate-500 dark:text-gray-400">{t('footer.email')}</li>
              <li className="text-sm text-slate-500 dark:text-gray-400">{t('footer.phone')}</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 dark:border-gray-800 pt-8 text-center">
          <p className="text-sm text-slate-400 dark:text-gray-500">{t('footer.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </div>
    </footer>
  )
}
