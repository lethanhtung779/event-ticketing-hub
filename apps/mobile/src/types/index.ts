export type Role = 'USER' | 'STAFF' | 'ADMIN'

export type EventStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED'

export type OrderStatus = 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED'

export type TicketStatus = 'PENDING' | 'VALID' | 'CHECKED_IN' | 'CANCELLED' | 'TRANSFERRED'

export interface User {
  id: string
  email: string
  fullName: string
  role: Role
  isVerified: boolean
  avatar: string | null
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
  organizer: {
    id: string
    name: string
    description: string | null
    logo: string | null
    email: string | null
    phone: string | null
    website: string | null
    _count?: { follows: number }
  } | null
  venueName: string | null
  province: string | null
  district: string | null
  streetAddress: string | null
  createdAt: string
  updatedAt: string
  ticketTypes: TicketType[]
  avgRating: number | null
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
  amount: number
  currency: string
  method: string
  status: string
  payUrl: string | null
  createdAt: string
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
