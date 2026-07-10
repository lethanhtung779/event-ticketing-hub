'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { authApi } from '@/lib/api'
import SeoHead from '@/components/SeoHead'

function VerifyEmailContent() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Token xác thực không hợp lệ')
      return
    }
    authApi
      .verifyEmail(token)
      .then(({ data }) => {
        setStatus('success')
        setMessage((data as { message: string }).message || 'Email đã được xác thực thành công!')
      })
      .catch(() => {
        setStatus('error')
        setMessage('Token xác thực không hợp lệ hoặc đã hết hạn')
      })
  }, [searchParams])

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <Card className="p-10">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            <p className="text-gray-600 dark:text-gray-300">Đang xác thực...</p>
          </div>
        )}
        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{message}</h1>
            <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Đăng nhập ngay
            </Link>
          </div>
        )}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <XCircle className="h-12 w-12 text-red-500" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{message}</h1>
            <Link href="/" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              Về trang chủ
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <>
      <SeoHead title="Xác thực email" />
      <Suspense fallback={null}>
        <VerifyEmailContent />
      </Suspense>
    </>
  )
}
