import { useState, useEffect, useCallback } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { wishlistApi } from '../api/client'
import { getUser } from '../stores/auth'
import EventCard from '../components/EventCard'
import type { Event } from '../types'

export default function WishlistScreen({ navigation }: any) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const user = getUser()

  const fetchWishlist = useCallback(async () => {
    try {
      const { data } = await wishlistApi.getMyWishlist()
      const list = Array.isArray(data) ? data : data.data ?? []
      const evts = list.map((item: any) => item.event ?? item).filter(Boolean)
      setEvents(evts)
    } catch (e) { console.warn('[Wishlist] fetch error:', e) }
  }, [])

  useEffect(() => {
    if (user) fetchWishlist().finally(() => setLoading(false))
    else setLoading(false)
  }, [user, fetchWishlist])

  const onRefresh = async () => { setRefreshing(true); await fetchWishlist(); setRefreshing(false) }

  if (!user) {
    return (
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.headerTitle}>Yêu thích</Text></View>
        <View style={styles.prompt}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>❤️</Text>
          <Text style={styles.promptTitle}>Vui lòng đăng nhập</Text>
          <Text style={styles.promptDesc}>Đăng nhập để lưu sự kiện yêu thích</Text>
          <TouchableOpacity style={styles.promptBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.promptBtnText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Yêu thích</Text>
        <Text style={styles.headerSub}>{events.length} sự kiện</Text>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { id: item.id })} isSaved />}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
          contentContainerStyle={{ paddingTop: 16, paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>❤️</Text>
              <Text style={styles.emptyText}>Chưa có sự kiện yêu thích</Text>
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
  prompt: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  promptTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  promptDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  promptBtn: { backgroundColor: '#059669', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14 },
  promptBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#9ca3af', marginBottom: 12 },
  exploreLink: { color: '#059669', fontSize: 14, fontWeight: '600' },
})
