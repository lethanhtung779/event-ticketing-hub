import { useState, useEffect, useCallback, useMemo } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { eventApi, categoryApi, wishlistApi } from '../api/client'
import EventCard from '../components/EventCard'
import BannerSlider from '../components/BannerSlider'
import { getUser } from '../stores/auth'
import type { Event, Category } from '../types'
import { isWeekend, isWithinInterval, startOfMonth, endOfMonth, parseISO } from 'date-fns'

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

const CATEGORY_ICONS: Record<string, string> = {
  'Nhạc sống': '🎵',
  'Sân khấu & Nghệ thuật': '🎭',
  'Thể Thao': '🏆',
  'Hội thảo & Workshop': '👥',
  'Tham quan & Trải nghiệm': '🧭',
  'Khác': '•••',
  'Vé bán lại': '🎫',
  'Blog': '📰',
}

export default function HomeScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState('')

  const loadInitial = useCallback(async () => {
    setLoading(true)
    try {
      const [catRes, eventRes] = await Promise.all([
        categoryApi.getAll(),
        eventApi.getAll({ page: '1', limit: '50' }),
      ])
      const cats = Array.isArray(catRes.data) ? catRes.data : catRes.data?.data ?? []
      setCategories(cats)
      const evts = Array.isArray(eventRes.data) ? eventRes.data : eventRes.data?.data ?? []
      setEvents(evts)
    } catch (e) { console.warn('[HomeScreen] loadInitial error:', e) } finally { setLoading(false) }
  }, [])

  useEffect(() => { loadInitial() }, [loadInitial])

  useEffect(() => {
    const u = getUser()
    if (!u) { setSavedIds(new Set()); return }
    wishlistApi.getMyWishlist().then((res: any) => {
      const list = Array.isArray(res.data) ? res.data : res.data?.data ?? []
      setSavedIds(new Set(list.map((e: any) => e.id)))
    }).catch(() => {})
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await loadInitial()
    setRefreshing(false)
  }

  const handleCategoryPress = (id: string) => {
    setSelectedCategory(selectedCategory === id ? '' : id)
  }

  const now = useMemo(() => new Date(), [])
  const monthStart = useMemo(() => startOfMonth(now), [now])
  const monthEnd = useMemo(() => endOfMonth(now), [now])

  const visibleEvents = selectedCategory
    ? events.filter((e) => e.categoryId === selectedCategory)
    : events

  const sections = useMemo(() => {
    if (selectedCategory) return null
    const featured = events.slice(0, 10)
    const trending = [...events].sort((a, b) => {
      const aSold = a.ticketTypes?.reduce((s, t) => s + t.soldQuantity, 0) || 0
      const bSold = b.ticketTypes?.reduce((s, t) => s + t.soldQuantity, 0) || 0
      return bSold - aSold
    }).slice(0, 10)
    const weekendEvts = events.filter((e) => {
      try { return isWeekend(parseISO(e.startTime)) } catch { return false }
    }).slice(0, 10)
    const monthEvts = events.filter((e) => {
      try {
        const d = parseISO(e.startTime)
        return isWithinInterval(d, { start: monthStart, end: monthEnd })
      } catch { return false }
    }).slice(0, 10)
    const byCategory: Record<string, Event[]> = {}
    categories.forEach((c) => {
      const evts = events.filter((e) => e.categoryId === c.id).slice(0, 10)
      if (evts.length > 0) byCategory[c.name] = evts
    })
    return { featured, trending, weekendEvts, monthEvts, byCategory }
  }, [events, categories, selectedCategory, monthStart, monthEnd])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.appName}>TicketHub</Text>
          <TouchableOpacity style={styles.filterToggle} onPress={() => navigation.navigate('Search')}>
            <Text style={styles.filterToggleText}>🔍</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryList}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={[styles.categoryChip, selectedCategory === cat.id && styles.categoryChipActive]} onPress={() => handleCategoryPress(cat.id)}>
              <Text style={styles.categoryIcon}>{CATEGORY_ICONS[cat.name] || '•'}</Text>
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={selectedCategory ? visibleEvents : []}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={selectedCategory ? styles.row : undefined}
        renderItem={({ item }) => (
          <View style={selectedCategory ? styles.col : undefined}>
            <EventCard event={item} onPress={() => navigation.navigate('EventDetail', { id: item.id })} compact={!!selectedCategory} isSaved={savedIds.has(item.id)} />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
        ListHeaderComponent={
          <>
            {!selectedCategory && <BannerSlider events={events} onPress={(id) => navigation.navigate('EventDetail', { id })} />}
            {!selectedCategory && sections && (
            <ScrollView horizontal={false} showsVerticalScrollIndicator={false}>
              {sections.featured.length > 0 && (
                <EventRowSection title={t('home.featured')} events={sections.featured} savedIds={savedIds} onPress={(id) => navigation.navigate('EventDetail', { id })} />
              )}
              {sections.trending.length > 0 && (
                <EventRowSection title={t('home.trending')} events={sections.trending} savedIds={savedIds} onPress={(id) => navigation.navigate('EventDetail', { id })} />
              )}
              {sections.weekendEvts.length > 0 && (
                <EventRowSection title={t('home.weekend')} events={sections.weekendEvts} savedIds={savedIds} onPress={(id) => navigation.navigate('EventDetail', { id })} />
              )}
              {sections.monthEvts.length > 0 && (
                <EventRowSection title={t('home.thisMonth')} events={sections.monthEvts} savedIds={savedIds} onPress={(id) => navigation.navigate('EventDetail', { id })} />
              )}
              {Object.entries(sections.byCategory).map(([name, evts]) => (
                <EventRowSection key={name} title={name} events={evts} savedIds={savedIds} onPress={(id) => navigation.navigate('EventDetail', { id })} />
              ))}
              <View style={{ height: 20 }} />
            </ScrollView>
            )}
          </>
        }
        ListFooterComponent={
          !loading && events.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>{t('home.noEvents')}</Text>
              <Text style={styles.debugText}>API: {API_URL}</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          selectedCategory && visibleEvents.length === 0 && !loading ? (
            <View style={styles.empty}><Text style={styles.emptyText}>{t('home.noEventsInCategory')}</Text></View>
          ) : null
        }
      />
      {loading && !refreshing && <ActivityIndicator size="large" color="#059669" style={styles.loader} />}
    </View>
  )
}

function EventRowSection({ title, events, savedIds, onPress }: { title: string; events: Event[]; savedIds: Set<string>; onPress: (id: string) => void }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionScroll}>
        {events.map((event) => (
          <View key={event.id} style={styles.sectionCard}>
            <EventCard event={event} onPress={() => onPress(event.id)} compact isSaved={savedIds.has(event.id)} />
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#059669', paddingTop: 52, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  appName: { fontSize: 24, fontWeight: '700', color: '#fff' },
  filterToggle: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  filterToggleText: { fontSize: 16 },
  categoryScroll: { paddingLeft: 16 },
  categoryList: { gap: 8, paddingRight: 16 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6, gap: 4,
  },
  categoryChipActive: { backgroundColor: '#fff' },
  categoryIcon: { fontSize: 14 },
  categoryText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  categoryTextActive: { color: '#059669' },
  section: { marginBottom: 8, paddingTop: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  sectionScroll: { paddingLeft: 16, gap: 12, paddingRight: 16 },
  sectionCard: { width: 200 },
  row: { paddingHorizontal: 16, gap: 12 },
  col: { flex: 1 },
  loader: { position: 'absolute', top: '50%', left: '50%', marginLeft: -20, marginTop: -20 },
  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 16 },
  emptyText: { fontSize: 15, color: '#9ca3af' },
  debugText: { fontSize: 11, color: '#d1d5db', marginTop: 4 },
})
