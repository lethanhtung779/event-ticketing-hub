'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { ArrowLeft, Ticket, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatCurrency, getErrorMessage } from '@/lib/utils'
import { paymentApi } from '@/lib/api'

export default function PaymentPage(props: { params: Promise<{ orderId: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payUrl, setPayUrl] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [params.orderId])

  const handleVnpay = async () => {
    setCreating(true)
    try {
      const { data } = await paymentApi.createVnpay({ orderId: params.orderId })
      const { payUrl: url } = data as { payUrl: string }
      if (url) {
        window.location.href = url
      } else {
        toast.error('Không nhận được link thanh toán')
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Tạo thanh toán thất bại'))
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link href="/my-tickets" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-6">
        <ArrowLeft className="h-4 w-4" /> Quay lại vé của tôi
      </Link>

      <Card className="text-center">
        <div className="mb-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <Ticket className="h-8 w-8" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Thanh toán đơn hàng</h1>
        <p className="text-sm text-gray-500 mb-6">Mã đơn hàng: <span className="font-mono font-medium">{params.orderId.slice(0, 8)}</span></p>

        <div className="space-y-3">
          <Button className="w-full" size="lg" loading={creating} onClick={handleVnpay}>
            {creating ? 'Đang tạo...' : 'Thanh toán qua VNPay'}
          </Button>
          <Button variant="outline" className="w-full" onClick={() => router.push('/my-tickets')}>
            Thanh toán sau
          </Button>
        </div>
      </Card>
    </div>
  )
}
