import { useState, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { ticketApi } from '../../api/client'

function fd(date: string) {
  const d = new Date(date)
  return `${d.getDate().toString().padStart(2, '0')}/(${(d.getMonth() + 1).toString().padStart(2, '0')})/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function CheckInHistoryScreen({ navigation }: any) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useFocusEffect(useCallback(() => {
    setLoading(true)
    ticketApi.getCheckInHistory().then((res) => {
      setHistory(Array.isArray(res.data) ? res.data : [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, []))

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.checkIcon}>✅</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.userName}>{item.user?.fullName || 'Không tên'}</Text>
        <Text style={styles.userEmail}>{item.user?.email}</Text>
        <Text style={styles.ticketType}>🎟️ {item.ticketType?.name || 'Vé'}</Text>
        {item.ticketType?.event?.title && (
          <Text style={styles.eventTitle}>📅 {item.ticketType.event.title}</Text>
        )}
        <Text style={styles.time}>🕐 {item.checkedInAt ? fd(item.checkedInAt) : ''}</Text>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử check-in</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} />
      ) : history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Chưa có check-in nào</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    backgroundColor: '#059669', paddingTop: Platform.OS === 'ios' ? 52 : 36, paddingBottom: 12,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { fontSize: 14, color: '#fff', fontWeight: '500', marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb',
  },
  cardLeft: { marginRight: 12, justifyContent: 'center' },
  checkIcon: { fontSize: 24 },
  cardContent: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  ticketType: { fontSize: 13, color: '#374151', marginTop: 4 },
  eventTitle: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  time: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#9ca3af' },
})
