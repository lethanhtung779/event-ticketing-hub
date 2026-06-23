import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          originalRequest.headers.Authorization = `Bearer ${data.access_token}`
          return api(originalRequest)
        }
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data: { email: string; password: string; fullName: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/auth/change-password', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; newPassword: string }) =>
    api.post('/auth/reset-password', data),
  sendVerification: () =>
    api.post('/auth/send-verification'),
  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`),
}

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: { fullName?: string }) =>
    api.patch('/users/me', data),
  getMyTickets: () => api.get('/users/me/tickets'),
}

export const eventApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/events', { params }),
  getById: (id: string) =>
    api.get(`/events/${id}`),
  create: (data: FormData | Record<string, unknown>) =>
    api.post('/events', data, data instanceof FormData ? {
      headers: { 'Content-Type': 'multipart/form-data' },
    } : undefined),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/events/${id}`, data),
  delete: (id: string) =>
    api.delete(`/events/${id}`),
  publish: (id: string) =>
    api.post(`/events/${id}/publish`),
  cancel: (id: string) =>
    api.post(`/events/${id}/cancel`),
  uploadBanner: (id: string, formData: FormData) =>
    api.post(`/events/${id}/banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  createTicketType: (eventId: string, data: Record<string, unknown>) =>
    api.post(`/events/${eventId}/ticket-types`, data),
  updateTicketType: (eventId: string, ticketTypeId: string, data: Record<string, unknown>) =>
    api.patch(`/events/${eventId}/ticket-types/${ticketTypeId}`, data),
}

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (name: string) => api.post('/categories', { name }),
  delete: (id: string) => api.delete(`/categories/${id}`),
}

export const ticketApi = {
  getMyTickets: () => api.get('/tickets'),
  getById: (id: string) => api.get(`/tickets/${id}`),
  purchase: (data: { ticketTypeId: string; quantity: number; promoCode?: string }) =>
    api.post('/tickets/purchase', data),
  joinWaitingList: (data: { eventId: string; ticketTypeId: string; quantity: number }) =>
    api.post('/tickets/waiting-list', data),
  validatePromo: (data: { code: string; totalPrice: number }) =>
    api.post('/tickets/validate-promo', data),
  checkIn: (qrCodeToken: string) =>
    api.post('/tickets/check-in', { qrCodeToken }),
  cancelTicket: (id: string) =>
    api.post(`/tickets/${id}/cancel`),
  transfer: (id: string, targetEmail: string) =>
    api.post(`/tickets/${id}/transfer`, { targetEmail }),
}

export const reviewApi = {
  getByEvent: (eventId: string) =>
    api.get(`/events/${eventId}/reviews`),
  create: (eventId: string, data: { rating: number; comment?: string }) =>
    api.post(`/events/${eventId}/reviews`, data),
}

export const paymentApi = {
  createVnpay: (data: { orderId: string }) =>
    api.post('/payments/vnpay/create', data),
  refund: (data: { paymentId: string; amount: number; reason: string }) =>
    api.post('/payments/vnpay/refund', data),
}

export const adminApi = {
  getStats: (params?: { fromDate?: string; toDate?: string }) =>
    api.get('/admin/stats', { params }),
  getRevenueReport: (params?: { fromDate?: string; toDate?: string }) =>
    api.get('/admin/revenue-report', { params }),
  getAttendees: (eventId: string, params?: { format?: string }) =>
    api.get(`/admin/events/${eventId}/attendees`, { params }),
  getAuditLogs: (params?: Record<string, string>) =>
    api.get('/admin/audit-logs', { params }),
  getUsers: (params?: Record<string, string>) =>
    api.get('/admin/users', { params }),
  getUser: (id: string) =>
    api.get(`/admin/users/${id}`),
  updateUserRole: (id: string, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),
  getPromoCodes: (params?: Record<string, string>) =>
    api.get('/admin/promo-codes', { params }),
  createPromoCode: (data: Record<string, unknown>) =>
    api.post('/admin/promo-codes', data),
  updatePromoCode: (id: string, data: Record<string, unknown>) =>
    api.patch(`/admin/promo-codes/${id}`, data),
  deletePromoCode: (id: string) =>
    api.delete(`/admin/promo-codes/${id}`),
}
