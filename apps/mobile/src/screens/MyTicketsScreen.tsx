import { useState, useCallback } from 'react'
import { View, Text, SectionList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { ticketApi, paymentApi } from '../api/client'
import type { Ticket } from '../types'

function fc(amount: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) }
function fd(date: string) { const d = new Date(date); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}` }

const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: '#f59e0b', icon: '💳' },
  VALID: { label: 'Hợp lệ', color: '#059669', icon: '🎫' },
  CHECKED_IN: { label: 'Đã check-in', color: '#3b82f6', icon: '✅' },
  CANCELLED: { label: 'Đã huỷ', color: '#ef4444', icon: '❌' },
  TRANSFERRED: { label: 'Đã chuyển', color: '#f97316', icon: '🔄' },
}

const sections_order = ['PENDING', 'VALID', 'CHECKED_IN', 'CANCELLED', 'TRANSFERRED']
const sectionLabels: Record<string, { label: string; icon: string }> = {
  PENDING: { label: 'Chưa thanh toán', icon: '💳' },
  VALID: { label: 'Vé hợp lệ', icon: '🎫' },
  CHECKED_IN: { label: 'Đã sử dụng', icon: '✅' },
  CANCELLED: { label: 'Đã huỷ / Chuyển', icon: '❌' },
  TRANSFERRED: { label: 'Đã huỷ / Chuyển', icon: '❌' },
}

export default function MyTicketsScreen({ navigation }: any) {
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTickets = useCallback(async () => {
    try {
      const { data } = await ticketApi.getMyTickets()
      setAllTickets(Array.isArray(data) ? data : data.data ?? [])
    } catch (e) { console.warn('[MyTickets] fetch error:', e) }
  }, [])

  useFocusEffect(useCallback(() => { fetchTickets().finally(() => setLoading(false)) }, [fetchTickets]))

  const onRefresh = async () => { setRefreshing(true); await fetchTickets(); setRefreshing(false) }

  const handlePay = async (ticket: Ticket) => {
    const orderId = ticket.order?.id || ticket.orderId
    if (!orderId) { Alert.alert('Lỗi', 'Không tìm thấy đơn hàng'); return }
    try {
      const { data } = await paymentApi.createVnpay({ orderId })
      navigation.navigate('VnpayWebView', {
        payUrl: (data as any).payUrl,
        orderId,
        eventTitle: ticket.ticketType?.event?.title || '',
      })
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể tạo thanh toán')
    }
  }

  const sections = sections_order.map((key) => ({
    key,
    title: sectionLabels[key]?.label || key,
    icon: sectionLabels[key]?.icon || '',
    data: allTickets.filter((t) => t.status === key),
  })).filter((s) => s.data.length > 0)

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vé của tôi</Text>
        <Text style={styles.headerSub}>{allTickets.length} vé</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionCount}><Text style={styles.sectionCountText}>{section.data.length}</Text></View>
            </View>
          )}
          renderItem={({ item }) => {
            const cfg = statusConfig[item.status] || { label: item.status, color: '#6b7280', icon: '🎫' }
            return (
              <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('TicketDetail', { id: item.id })} activeOpacity={0.8}>
                <View style={styles.cardLeft}>
                  <Text style={styles.cardEvent}>{item.ticketType?.event?.title}</Text>
                  <Text style={styles.cardType}>{item.ticketType?.name}</Text>
                  <Text style={styles.cardDate}>{fd(item.createdAt)}</Text>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusDot, { backgroundColor: cfg.color }]} />
                  <Text style={[styles.statusLabel, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.cardPrice}>{fc(item.ticketType?.price || 0)}</Text>
                  {item.status === 'PENDING' && (
                    <TouchableOpacity style={styles.payBtn} onPress={() => handlePay(item)}>
                      <Text style={styles.payBtnText}>Thanh toán</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            )
          }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
          contentContainerStyle={sections.length === 0 ? styles.emptyContainer : { paddingHorizontal: 16, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🎫</Text>
              <Text style={styles.emptyText}>Chưa có vé nào</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Trang chủ')}>
                <Text style={styles.exploreLink}>Khám phá sự kiện</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#059669', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12, paddingTop: 20 },
  sectionIcon: { fontSize: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', flex: 1 },
  sectionCount: { backgroundColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  sectionCountText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  cardLeft: { flex: 1 },
  cardEvent: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardType: { fontSize: 12, color: '#6b7280', marginBottom: 4 },
  cardDate: { fontSize: 11, color: '#9ca3af' },
  cardRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 4 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 11, fontWeight: '600' },
  cardPrice: { fontSize: 14, fontWeight: '700', color: '#059669' },
  payBtn: { backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4 },
  payBtnText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#9ca3af', marginBottom: 12 },
  exploreLink: { color: '#059669', fontSize: 14, fontWeight: '600' },
})
