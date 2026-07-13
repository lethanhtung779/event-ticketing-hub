import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import type { Event } from '../types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'
const { width: SCREEN_WIDTH } = Dimensions.get('window')

function bannerUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)
}

function formatDate(date: string) {
  const d = new Date(date)
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  return `${days[d.getDay()]}, ${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
}

function formatTime(date: string) {
  const d = new Date(date)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const statusColors: Record<string, string> = {
  DRAFT: '#6b7280', PENDING: '#f59e0b', PUBLISHED: '#059669',
  REJECTED: '#ef4444', CANCELLED: '#ef4444', COMPLETED: '#3b82f6',
}

const statusLabels: Record<string, string> = {
  DRAFT: 'Nháp', PENDING: 'Chờ duyệt', PUBLISHED: 'Đã xuất bản',
  REJECTED: 'Bị từ chối', CANCELLED: 'Đã huỷ', COMPLETED: 'Hoàn thành',
}

interface EventCardProps {
  event: Event
  onPress: () => void
  compact?: boolean
  isSaved?: boolean
}

export default function EventCard({ event, onPress, compact, isSaved }: EventCardProps) {
  const minPrice = event.ticketTypes?.length ? Math.min(...event.ticketTypes.map((t) => t.price)) : 0
  const cardWidth = compact ? undefined : SCREEN_WIDTH - 32

  return (
    <TouchableOpacity style={[styles.card, compact && styles.cardCompact]} onPress={onPress} activeOpacity={0.9}>
      <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
        {event.bannerUrl ? (
          <Image source={{ uri: bannerUrl(event.bannerUrl)! }} style={styles.image} />
        ) : (
          <View style={styles.placeholder} />
        )}
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[event.status] || '#6b7280' }]}>
            <Text style={styles.statusText}>{statusLabels[event.status] || event.status}</Text>
          </View>
          {event.category && compact && (
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>{event.category.name}</Text>
            </View>
          )}
        </View>
        {isSaved && <Text style={styles.heart}>❤️</Text>}
      </View>
      <View style={[styles.info, compact && styles.infoCompact]}>
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>{event.title}</Text>
        {!compact && (
          <>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📅</Text>
              <Text style={styles.metaText}>{formatDate(event.startTime)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>🕐</Text>
              <Text style={styles.metaText}>{formatTime(event.startTime)} - {formatTime(event.endTime)}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText} numberOfLines={1}>{event.location}</Text>
            </View>
            {event.category && (
              <View style={styles.metaRow}>
                <Text style={styles.metaIcon}>🏷️</Text>
                <Text style={styles.metaText}>{event.category.name}</Text>
              </View>
            )}
          </>
        )}
        <View style={styles.priceRow}>
          {minPrice > 0 ? (
            <Text style={styles.price}>{formatCurrency(minPrice)}{event.ticketTypes?.length > 1 ? '+' : ''}</Text>
          ) : (
            <Text style={styles.priceFree}>Liên hệ</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff', borderRadius: 16, marginHorizontal: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
    overflow: 'hidden',
  },
  cardCompact: { marginHorizontal: 0, marginBottom: 0, width: 200 },
  imageContainer: { height: 160, position: 'relative' },
  imageContainerCompact: { height: 110 },
  image: { width: '100%', height: '100%' },
  placeholder: { width: '100%', height: '100%', backgroundColor: '#e5e7eb' },
  badgeRow: { position: 'absolute', top: 8, left: 8, flexDirection: 'row', gap: 4 },
  statusBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  catBadge: { backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  catBadgeText: { color: '#374151', fontSize: 10, fontWeight: '600' },
  heart: { position: 'absolute', top: 8, right: 8, fontSize: 18 },
  info: { padding: 14 },
  infoCompact: { padding: 10 },
  title: { fontSize: 15, fontWeight: '700', color: '#111827', lineHeight: 20, marginBottom: 8 },
  titleCompact: { fontSize: 13, lineHeight: 17, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 },
  metaIcon: { fontSize: 12 },
  metaText: { fontSize: 13, color: '#6b7280', flex: 1 },
  priceRow: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  price: { fontSize: 15, fontWeight: '700', color: '#059669' },
  priceFree: { fontSize: 13, color: '#9ca3af' },
})
