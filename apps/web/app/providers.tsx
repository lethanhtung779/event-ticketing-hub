'use client'

import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { useAuthStore } from '@/stores/auth-store'
import { I18nProvider } from './I18nProvider'
import { SocketProvider } from '@/components/socket/SocketProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
      <ThemeProvider>
        <I18nProvider>
          <SocketProvider>
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
            {children}
          </SocketProvider>
        </I18nProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  )
}
