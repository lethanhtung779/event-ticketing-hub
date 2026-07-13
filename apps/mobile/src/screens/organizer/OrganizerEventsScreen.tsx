import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { useTranslation } from 'react-i18next'
import { eventApi } from '../../api/client'
import type { Event } from '../../types'

const statusColors: Record<string, string> = {
  DRAFT: '#6b7280', PENDING: '#f59e0b', PUBLISHED: '#059669',
  REJECTED: '#ef4444', CANCELLED: '#ef4444', COMPLETED: '#3b82f6',
}

export default function OrganizerEventsScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>('')

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await eventApi.getAll({ organizer: 'mine', limit: '100' })
      setEvents(Array.isArray(data) ? data : data.data ?? [])
    } catch (e) { console.warn('[OrgEvents] error:', e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])
  useEffect(() => { navigation.addListener('focus', () => fetchEvents()); return () => {} }, [navigation])

  const filtered = filter ? events.filter((e) => e.status === filter) : events

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← {t('common.back')}</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('organizer.myEvents')}</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.filterRow}>
        {['', 'DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'CANCELLED', 'COMPLETED'].map((s) => (
          <TouchableOpacity key={s} style={[styles.filterChip, filter === s && styles.filterChipActive]} onPress={() => setFilter(s)}>
            <Text style={[styles.filterText, filter === s && styles.filterTextActive]}>{s ? (t('organizer.' + s.toLowerCase()) || s) : t('home.clearFilters')}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEvents() }} colors={['#059669']} />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardDate}>{new Date(item.startTime).toLocaleDateString('vi-VN')}</Text>
                <Text style={styles.cardTickets}>{item.ticketTypes?.reduce((s, t) => s + t.soldQuantity, 0) || 0} / {item.ticketTypes?.reduce((s, t) => s + t.totalQuantity, 0) || 0} vé</Text>
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.statusBadge, { backgroundColor: (statusColors[item.status] || '#6b7280') + '20' }]}>
                  <Text style={[styles.statusText, { color: statusColors[item.status] || '#6b7280' }]}>{t('organizer.' + item.status.toLowerCase()) || item.status}</Text>
                </View>
                <Text style={styles.cardRevenue}>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.ticketTypes?.reduce((s, t) => s + t.soldQuantity * t.price, 0) || 0)}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={filtered.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : { padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('organizer.noEvents')}</Text>}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { fontSize: 14, color: '#059669', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 12, paddingBottom: 4 },
  filterChip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#059669' },
  filterText: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  card: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#6b7280', marginBottom: 2 },
  cardTickets: { fontSize: 12, color: '#9ca3af' },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardRevenue: { fontSize: 13, fontWeight: '700', color: '#059669' },
  emptyText: { fontSize: 15, color: '#9ca3af' },
})
