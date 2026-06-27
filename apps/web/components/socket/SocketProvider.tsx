'use client'

import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/stores/auth-store'
import { useNotificationStore } from '@/stores/notification-store'
import { connectSocket, disconnectSocket } from '@/lib/socket'
import { Socket } from 'socket.io-client'

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore()
  const addNotification = useNotificationStore((s) => s.addNotification)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      if (socketRef.current) {
        disconnectSocket()
        socketRef.current = null
      }
      return
    }

    const socket = connectSocket(user.id)
    socketRef.current = socket

    function onTicketAvailable(data: { eventId: string; ticketTypeId: string; message: string }) {
      addNotification({ type: 'ticket_available', title: 'Vé đã có sẵn', message: data.message, link: `/events/${data.eventId}` })
      toast.success(data.message, { duration: 5000 })
    }

    function onPaymentConfirmed(data: { bookingId: string; message: string }) {
      addNotification({ type: 'payment_confirmed', title: 'Thanh toán thành công', message: data.message, link: `/my-tickets` })
      toast.success(data.message, { duration: 5000 })
    }

    function onTicketCancelled(data: { ticketId: string; message: string }) {
      addNotification({ type: 'ticket_cancelled', title: 'Vé đã bị hủy', message: data.message })
      toast.error(data.message, { duration: 5000 })
    }

    function onEventUpdate(data: { eventId: string; message?: string }) {
      addNotification({ type: 'event_update', title: 'Cập nhật sự kiện', message: data.message || 'Sự kiện có thay đổi mới', link: `/events/${data.eventId}` })
      toast(data.message || 'Sự kiện có thay đổi mới', { icon: '📢', duration: 5000 })
    }

    socket.on('ticket_available', onTicketAvailable)
    socket.on('payment_confirmed', onPaymentConfirmed)
    socket.on('ticket_cancelled', onTicketCancelled)
    socket.on('event_update', onEventUpdate)

    return () => {
      socket.off('ticket_available', onTicketAvailable)
      socket.off('payment_confirmed', onPaymentConfirmed)
      socket.off('ticket_cancelled', onTicketCancelled)
      socket.off('event_update', onEventUpdate)
    }
  }, [isAuthenticated, user?.id, addNotification])

  return <>{children}</>
}
