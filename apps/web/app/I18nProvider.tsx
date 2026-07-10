'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { I18nextProvider } from 'react-i18next'
import i18n, { loadLocale } from '@/lib/i18n'

export function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const init = async () => {
      if (!i18n.isInitialized) {
        await new Promise<void>((resolve) => {
          i18n.on('initialized', () => resolve())
        })
      }
      await loadLocale(i18n.language || 'vi')
      setReady(true)
    }
    init()
  }, [])

  if (!ready) return <>{children}</>

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
