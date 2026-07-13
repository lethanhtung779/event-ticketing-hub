import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { eventApi, ticketApi } from '../../api/client'
import type { Event } from '../../types'

function fd(date: string) {
  const d = new Date(date)
  const today = new Date()
  const diff = d.toDateString() === today.toDateString() ? 'Hôm nay' : `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
  return diff
}
function ft(date: string) {
  const d = new Date(date)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function StaffHomeScreen({ navigation }: any) {
  const [events, setEvents] = useState<(Event & { checkedIn?: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const fetchEvents = useCallback(async () => {
    try {
      const { data } = await eventApi.getAll({ status: 'PUBLISHED', limit: '100' })
      const list = Array.isArray(data) ? data : data?.data ?? []
      const withStats = await Promise.all(
        list.map(async (ev: Event) => {
          try {
            const tRes = await ticketApi.getEventTickets(ev.id)
            const tickets = Array.isArray(tRes.data) ? tRes.data : tRes.data?.data ?? []
            return { ...ev, checkedIn: tickets.filter((t: any) => t.status === 'CHECKED_IN').length, _ticketCount: tickets.length }
          } catch {
            return { ...ev, checkedIn: 0, _ticketCount: 0 }
          }
        })
      )
      withStats.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      setEvents(withStats)
    } catch (e) { console.warn('[StaffHome] fetch error:', e) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useFocusEffect(useCallback(() => { fetchEvents() }, [fetchEvents]))

  const onRefresh = () => { setRefreshing(true); fetchEvents() }

  const filtered = useMemo(() => {
    if (!search.trim()) return events
    const q = search.toLowerCase().trim()
    return events.filter((ev) =>
      ev.title.toLowerCase().includes(q) ||
      ev.location?.toLowerCase().includes(q) ||
      ev.organizer?.name?.toLowerCase().includes(q)
    )
  }, [events, search])

  const today = new Date().toDateString()
  const todayEvents = filtered.filter((ev) => new Date(ev.startTime).toDateString() === today)
  const upcomingEvents = filtered.filter((ev) => new Date(ev.startTime).toDateString() !== today)

  const renderItem = ({ item }: { item: Event & { checkedIn?: number } }) => {
    const total = (item as any)._ticketCount ?? 0
    const checkedIn = item.checkedIn ?? 0
    const progress = total > 0 ? Math.round((checkedIn / total) * 100) : 0
    const isToday = new Date(item.startTime).toDateString() === today
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('StaffCheckin', { eventId: item.id, eventTitle: item.title })} activeOpacity={0.7}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {isToday && <View style={styles.todayBadge}><Text style={styles.todayBadgeText}>Hôm nay</Text></View>}
            <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          </View>
          <Text style={styles.cardArrow}>›</Text>
        </View>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>📅 {fd(item.startTime)}</Text>
          <Text style={styles.cardMetaText}>🕐 {ft(item.startTime)}</Text>
        </View>
        <Text style={styles.cardLocation} numberOfLines={1}>📍 {item.location}</Text>
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Đã check-in: <Text style={styles.progressCount}>{checkedIn}</Text> / {total}</Text>
            <Text style={styles.progressPct}>{progress}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const renderSection = (title: string, data: any[]) => {
    if (data.length === 0) return null
    return (
      <View>
        <Text style={styles.sectionTitle}>{title}</Text>
        {data.map((item) => (
          <View key={item.id}>{renderItem({ item })}</View>
        ))}
      </View>
    )
  }

  if (loading) return <ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} />

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Quay lại</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Check-in vé</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm sự kiện..."
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={[1]}
        keyExtractor={() => 'main'}
        renderItem={() => null}
        ListHeaderComponent={
          <View>
            {todayEvents.length > 0 && renderSection('Hôm nay', todayEvents)}
            {upcomingEvents.length > 0 && renderSection('Sự kiện sắp tới', upcomingEvents)}
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : { padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
            <Text style={styles.emptyText}>{search ? 'Không tìm thấy sự kiện' : 'Không có sự kiện nào'}</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#059669', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { fontSize: 14, color: '#fff', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff', textAlign: 'center', flex: 1 },
  searchBar: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#111827' },
  clearBtn: { padding: 4 },
  clearBtnText: { fontSize: 16, color: '#9ca3af' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginTop: 16, marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flexShrink: 1 },
  cardArrow: { fontSize: 20, color: '#9ca3af', marginLeft: 8 },
  todayBadge: { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  todayBadgeText: { fontSize: 11, fontWeight: '700', color: '#d97706' },
  cardMeta: { flexDirection: 'row', gap: 16, marginBottom: 4 },
  cardMetaText: { fontSize: 13, color: '#6b7280' },
  cardLocation: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  progressSection: { backgroundColor: '#f9fafb', borderRadius: 10, padding: 12 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#6b7280' },
  progressCount: { fontWeight: '700', color: '#059669' },
  progressPct: { fontSize: 12, fontWeight: '600', color: '#059669' },
  progressBar: { height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#059669', borderRadius: 3 },
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
})
