import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import { useTranslation } from 'react-i18next'
import { organizerApi } from '../../api/client'

function fc(amount: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) }

export default function OrganizerReportsScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => { fetchData() }, [])

  const fetchData = async () => {
    try {
      const { data } = await organizerApi.getStats()
      setStats(data)
    } catch (e) { console.warn('[OrgReports] error:', e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  if (loading) return <ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} />

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData() }} colors={['#059669']} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← {t('common.back')}</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('organizer.reports')}</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('organizer.stats')}</Text>
          <Text style={styles.statNumber}>{stats?.events ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('organizer.ticketsSold')}</Text>
          <Text style={styles.statNumber}>{stats?.ticketsSold ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>{t('organizer.revenue')}</Text>
          <Text style={styles.statNumber}>{stats?.revenue ? fc(stats.revenue) : '0'}</Text>
        </View>
      </View>

      {stats?.eventsByEvent?.map((item: any, i: number) => (
        <View key={i} style={styles.eventRow}>
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{item.title}</Text>
            <Text style={styles.eventMeta}>{item.ticketsSold} / {item.totalTickets} {t('ticket.ticketCount')}</Text>
          </View>
          <Text style={styles.eventRevenue}>{fc(item.revenue || 0)}</Text>
        </View>
      ))}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { fontSize: 14, color: '#059669', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  statsGrid: { flexDirection: 'row', gap: 10, margin: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#059669', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  eventRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8, borderRadius: 12, padding: 14 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 4 },
  eventMeta: { fontSize: 12, color: '#9ca3af' },
  eventRevenue: { fontSize: 16, fontWeight: '700', color: '#059669' },
})
