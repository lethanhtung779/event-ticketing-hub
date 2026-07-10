'use client'

import { useEffect, lazy, Suspense } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth-store'
import { I18nProvider } from './I18nProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

const SocketProvider = lazy(() =>
  import('@/components/socket/SocketProvider').then((m) => ({ default: m.SocketProvider }))
)

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <ThemeProvider>
      <I18nProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#1f2937',
              color: '#fff',
              fontSize: '14px',
            },
          }}
        />
        <Suspense fallback={children}>
          <SocketProvider>{children}</SocketProvider>
        </Suspense>
      </I18nProvider>
    </ThemeProvider>
  )
}
