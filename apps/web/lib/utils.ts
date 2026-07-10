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
    DRAFT: 'bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-200',
    PUBLISHED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    CANCELLED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    COMPLETED: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PENDING: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    PAID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    REFUNDED: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    VALID: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    CHECKED_IN: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    TRANSFERRED: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    FAILED: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    USER: 'bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-200',
    STAFF: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    ADMIN: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return colors[status] || 'bg-slate-100 text-slate-700 dark:bg-gray-800 dark:text-gray-200'
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Nháp',
    PENDING: 'Chờ duyệt',
    PUBLISHED: 'Đã xuất bản',
    REJECTED: 'Bị từ chối',
    CANCELLED: 'Đã huỷ',
    COMPLETED: 'Hoàn thành',
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
