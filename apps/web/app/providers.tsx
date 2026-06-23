'use client'

import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth-store'

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  return (
    <>
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
    </>
  )
}
