import { format, formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

export function formatDate(date: string | Date, fmt: string = 'dd/MM/yyyy HH:mm') {
  return format(new Date(date), fmt, { locale: vi })
}

export function formatRelative(date: string | Date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi })
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    COMPLETED: 'bg-blue-100 text-blue-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    REFUNDED: 'bg-purple-100 text-purple-800',
    VALID: 'bg-green-100 text-green-800',
    CHECKED_IN: 'bg-blue-100 text-blue-800',
    TRANSFERRED: 'bg-orange-100 text-orange-800',
    FAILED: 'bg-red-100 text-red-800',
    USER: 'bg-gray-100 text-gray-800',
    STAFF: 'bg-blue-100 text-blue-800',
    ADMIN: 'bg-purple-100 text-purple-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Nháp',
    PUBLISHED: 'Đã xuất bản',
    CANCELLED: 'Đã huỷ',
    COMPLETED: 'Hoàn thành',
    PENDING: 'Chờ xử lý',
    PAID: 'Đã thanh toán',
    REFUNDED: 'Đã hoàn tiền',
    VALID: 'Hợp lệ',
    CHECKED_IN: 'Đã check-in',
    TRANSFERRED: 'Đã chuyển',
    FAILED: 'Thất bại',
    USER: 'Người dùng',
    STAFF: 'Nhân viên',
    ADMIN: 'Quản trị viên',
  }
  return labels[status] || status
}

export function unwrapList<T>(response: { data: unknown }): T[] {
  const body = response.data as any
  if (Array.isArray(body)) return body
  if (body?.data && Array.isArray(body.data)) return body.data
  return []
}

export function unwrapMeta(response: { data: unknown }): { page: number; totalPages: number; total: number; limit: number } | null {
  const body = response.data as any
  return body?.meta ?? null
}

export function getErrorMessage(err: unknown, fallback = 'Có lỗi xảy ra'): string {
  const error = err as { response?: { data?: Record<string, unknown> }; message?: string; status?: number }

  if (error.response?.data) {
    const msg = error.response.data.message
    if (Array.isArray(msg)) return String(msg[0])
    if (typeof msg === 'string') return msg
  }

  if (error.message) return error.message

  return fallback
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export function bannerUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}
