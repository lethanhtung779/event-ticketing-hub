'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { loadLocale } from '@/lib/i18n'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadLocale(i18n.language || 'vi').then(() => setReady(true))
  }, [])

  if (!ready) return null

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
