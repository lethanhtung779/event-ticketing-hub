import { io, Socket } from 'socket.io-client'
import { notificationApi } from '../api/client'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

let socket: Socket | null = null
let notifications: any[] = []
let unreadCount = 0
let listeners: Array<() => void> = []

export function subscribe(fn: () => void) {
  listeners.push(fn)
  return () => { listeners = listeners.filter((l) => l !== fn) }
}

function notify() {
  listeners.forEach((fn) => fn())
}

export function connectSocket(token: string) {
  if (socket?.connected) return
  socket = io(API_URL, {
    auth: { token },
    transports: ['websocket'],
  })

  socket.on('connect', () => console.log('[Socket] Connected'))
  socket.on('notification', (data: any) => {
    notifications.unshift(data)
    if (!data.read) unreadCount++
    notify()
  })
  socket.on('disconnect', () => console.log('[Socket] Disconnected'))
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}

export function setNotifications(list: any[]) {
  notifications = list
  unreadCount = list.filter((n: any) => !n.read).length
  notify()
}

export function getNotifications() {
  return notifications
}

export function getUnreadCount() {
  return unreadCount
}

export async function markRead(id: string) {
  await notificationApi.markRead(id)
  const n = notifications.find((n: any) => n.id === id)
  if (n && !n.read) {
    n.read = true
    unreadCount = Math.max(0, unreadCount - 1)
    notify()
  }
}

export async function markAllRead() {
  await notificationApi.markAllRead()
  notifications.forEach((n: any) => n.read = true)
  unreadCount = 0
  notify()
}
