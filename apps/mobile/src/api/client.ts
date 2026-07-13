import axios from 'axios'
import { SecureStore } from '../stores/auth'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
})

api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('access_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  } catch {}
  return config
})

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const rt = await SecureStore.getItemAsync('refresh_token')
        if (rt) {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: rt })
          await SecureStore.setItemAsync('access_token', data.access_token)
          await SecureStore.setItemAsync('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        }
      } catch {
        await SecureStore.deleteItemAsync('access_token')
        await SecureStore.deleteItemAsync('refresh_token')
        await SecureStore.deleteItemAsync('user')
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  googleLogin: (idToken: string) => api.post('/auth/google', { idToken }),
  register: (data: { email: string; password: string; fullName: string }) => api.post('/auth/register', data),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: { token: string; newPassword: string }) => api.post('/auth/reset-password', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.post('/auth/change-password', data),
  sendVerification: () => api.post('/auth/send-verification'),
}

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: { fullName?: string }) => api.patch('/users/me', data),
  updateAvatar: (uri: string) => {
    const form = new FormData()
    form.append('avatar', { uri, type: 'image/jpeg', name: 'avatar.jpg' } as any)
    return api.patch('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getMyTickets: () => api.get('/users/me/tickets'),
  getMyOrders: () => api.get('/users/me/orders'),
}

export const eventApi = {
  getAll: (params?: Record<string, string>) => api.get('/events', { params }),
  getById: (id: string) => api.get(`/events/${id}`),
  create: (data: any) => api.post('/events', data),
  update: (id: string, data: any) => api.patch(`/events/${id}`, data),
  delete: (id: string) => api.delete(`/events/${id}`),
  publish: (id: string) => api.post(`/events/${id}/publish`),
  approve: (id: string) => api.post(`/events/${id}/approve`),
  reject: (id: string) => api.post(`/events/${id}/reject`),
  cancel: (id: string) => api.post(`/events/${id}/cancel`),
  createTicketType: (eventId: string, data: any) => api.post(`/events/${eventId}/ticket-types`, data),
  updateTicketType: (eventId: string, ttId: string, data: any) => api.patch(`/events/${eventId}/ticket-types/${ttId}`, data),
  deleteTicketType: (eventId: string, ttId: string) => api.delete(`/events/${eventId}/ticket-types/${ttId}`),
}

export const categoryApi = {
  getAll: () => api.get('/categories'),
}

export const ticketApi = {
  getMyTickets: () => api.get('/tickets'),
  getById: (id: string) => api.get(`/tickets/${id}`),
  purchase: (data: { ticketTypeId: string; quantity: number; promoCode?: string }) => api.post('/tickets/purchase', data),
  cancel: (id: string) => api.post(`/tickets/${id}/cancel`),
  transfer: (id: string, targetEmail: string) => api.post(`/tickets/${id}/transfer`, { targetEmail }),
  joinWaitingList: (data: { eventId: string; ticketTypeId: string; quantity: number }) => api.post('/tickets/waiting-list', data),
  validatePromo: (data: { code: string; totalPrice: number }) => api.post('/tickets/validate-promo', data),
  checkIn: (qrCodeToken: string) => api.post('/tickets/check-in', { qrCodeToken }),
  checkInManual: (query: string) => api.post('/tickets/check-in/manual', { query }),
  getEventTickets: (eventId: string) => api.get(`/tickets/event/${eventId}`),
  searchTicket: (query: string) => api.get('/tickets/search', { params: { q: query } }),
  getCheckInHistory: () => api.get('/tickets/check-in/history'),
}

export const wishlistApi = {
  getMyWishlist: () => api.get('/wishlist'),
  save: (eventId: string) => api.post(`/wishlist/${eventId}`),
  unsave: (eventId: string) => api.delete(`/wishlist/${eventId}`),
  check: (eventId: string) => api.get(`/wishlist/check/${eventId}`),
}

export const reviewApi = {
  getByEvent: (eventId: string) => api.get(`/events/${eventId}/reviews`),
  create: (eventId: string, data: { rating: number; comment?: string }) => api.post(`/events/${eventId}/reviews`, data),
}

export const followApi = {
  follow: (organizerId: string) => api.post(`/follow/${organizerId}`),
  unfollow: (organizerId: string) => api.delete(`/follow/${organizerId}`),
  getMyFollows: () => api.get('/follow'),
  check: (organizerId: string) => api.get(`/follow/check/${organizerId}`),
}

export const organizerApi = {
  create: (data: { name: string; description?: string; email?: string; phone?: string; website?: string }) => api.post('/organizer', data),
  getProfile: () => api.get('/organizer/profile'),
  updateProfile: (data: any) => api.patch('/organizer/profile', data),
  getStats: () => api.get('/organizer/stats'),
}

export const notificationApi = {
  getMyNotifications: () => api.get('/notifications'),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
}

export const paymentApi = {
  createVnpay: (data: { orderId: string }) => api.post('/payments/vnpay/create', data),
  verifyVnpay: (orderId: string) => api.post(`/payments/vnpay/verify`, { orderId }),
  mobileReturn: (params: Record<string, string>) => api.post('/payments/vnpay/mobile-return', params),
}