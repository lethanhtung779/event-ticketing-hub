export type Role = 'USER' | 'STAFF' | 'ADMIN'

export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED'

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED'

export type TicketStatus = 'PENDING' | 'VALID' | 'CHECKED_IN' | 'CANCELLED' | 'TRANSFERRED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  user: User
}

export interface Category {
  id: string
  name: string
  _count?: { events: number }
}

export interface TicketType {
  id: string
  eventId: string
  name: string
  price: number
  totalQuantity: number
  soldQuantity: number
  minPerOrder: number
  maxPerOrder: number | null
  saleStartTime: string | null
  saleEndTime: string | null
}

export interface Event {
  id: string
  title: string
  description: string
  location: string
  bannerUrl: string | null
  categoryId: string | null
  category: Category | null
  status: EventStatus
  startTime: string
  endTime: string
  isOnline: boolean
  googleMapsLink: string | null
  agenda: Record<string, any> | null
  eventType: string | null
  organizerId: string | null
  organizerName: string | null
  organizerInfo: string | null
  organizerLogo: string | null
  venueName: string | null
  province: string | null
  district: string | null
  streetAddress: string | null
  bankName: string | null
  bankAccountNumber: string | null
  bankAccountHolder: string | null
  paymentInfo: string | null
  createdAt: string
  updatedAt: string
  ticketTypes: TicketType[]
  reviews?: Review[]
  _count?: { reviews: number; ticketTypes: number }
}

export interface Review {
  id: string
  eventId: string
  userId: string
  user: { fullName: string }
  rating: number
  comment: string | null
  createdAt: string
}

export interface Ticket {
  id: string
  orderId: string | null
  ticketTypeId: string
  ticketType: TicketType & { event: Event }
  userId: string
  status: TicketStatus
  qrCodeToken: string
  checkedInAt: string | null
  transferredFromId: string | null
  transferredToId: string | null
  createdAt: string
  order?: { id: string; status: OrderStatus; finalAmount: number }
}

export interface Order {
  id: string
  userId: string
  totalAmount: number
  discount: number
  finalAmount: number
  promoCode: string | null
  status: OrderStatus
  paidAt: string | null
  createdAt: string
  updatedAt: string
  tickets: Ticket[]
  payments: Payment[]
}

export interface Payment {
  id: string
  orderId: string
  userId: string
  amount: number
  currency: string
  method: string
  status: PaymentStatus
  transactionNo: string | null
  bankCode: string | null
  payUrl: string | null
  refundAmount: number | null
  refundReason: string | null
  paidAt: string | null
  createdAt: string
}

export interface PromoCode {
  id: string
  code: string
  discountPct: number
  maxUses: number
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
}

export interface AuditLog {
  id: string
  userId: string
  user: { fullName: string; email: string } | null
  action: string
  entity: string
  entityId: string | null
  detail: string | null
  createdAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface AdminStats {
  totalUsers: number
  totalEvents: number
  totalOrders: number
  revenue: number
  totalTickets: number
  checkedInTickets: number
  totalCategories: number
  recentUsers: Array<{ id: string; fullName: string; email: string; role: string; createdAt: string }>
  recentOrders: Array<Record<string, unknown>>
}

export interface RevenueReport {
  date: string
  revenue: number
  orders: number
}
