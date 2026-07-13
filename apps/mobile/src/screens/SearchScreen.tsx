import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, ScrollView, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { eventApi, categoryApi, wishlistApi } from '../api/client'
import EventCard from '../components/EventCard'
import type { Event, Category } from '../types'

const SORT_OPTIONS = [
  { value: 'startTime_asc', label: 'Thời gian (sớm → muộn)' },
  { value: 'startTime_desc', label: 'Thời gian (muộn → sớm)' },
  { value: 'price_asc', label: 'Giá (thấp → cao)' },
  { value: 'price_desc', label: 'Giá (cao → thấp)' },
  { value: 'title_asc', label: 'Tên (A → Z)' },
  { value: 'title_desc', label: 'Tên (Z → A)' },
]

export default function SearchScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [events, setEvents] = useState<Event[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [location, setLocation] = useState('')
  const [sortBy, setSortBy] = useState('startTime_asc')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    categoryApi.getAll().then(({ data }) => {
      setCategories(Array.isArray(data) ? data : data.data ?? [])
    }).catch(() => {})
    wishlistApi.getMyWishlist().then(({ data }) => {
      const list = Array.isArray(data) ? data : data.data ?? []
      setSavedIds(new Set(list.map((e: any) => e.id ?? e.eventId)))
    }).catch(() => {})
  }, [])

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = { limit: '20', page: '1' }
      if (search) params.search = search
      if (categoryId) params.categoryId = categoryId
      if (location) params.location = location
      if (sortBy) params.sortBy = sortBy
      if (minPrice) params.minPrice = minPrice
      if (maxPrice) params.maxPrice = maxPrice
      if (fromDate) params.fromDate = fromDate
      if (toDate) params.toDate = toDate

      const { data } = await eventApi.getAll(params)
      setEvents(Array.isArray(data) ? data : data.data ?? [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, location, sortBy, minPrice, maxPrice, fromDate, toDate])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← {t('common.back')}</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('search.title') || 'Tìm kiếm'}</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <Text style={styles.filterToggle}>{showFilters ? '✕' : '⚙️'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('search.placeholder') || 'Tìm sự kiện...'}
          placeholderTextColor="#9ca3af"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={fetchEvents}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <ScrollView style={styles.filterPanel} horizontal={false} showsVerticalScrollIndicator={false}>
          <Text style={styles.filterLabel}>{t('event.category') || 'Danh mục'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            <TouchableOpacity style={[styles.chip, !categoryId && styles.chipActive]} onPress={() => setCategoryId('')}>
              <Text style={[styles.chipText, !categoryId && styles.chipTextActive]}>{t('home.all') || 'Tất cả'}</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity key={cat.id} style={[styles.chip, categoryId === cat.id && styles.chipActive]} onPress={() => setCategoryId(categoryId === cat.id ? '' : cat.id)}>
                <Text style={[styles.chipText, categoryId === cat.id && styles.chipTextActive]}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.filterLabel}>{t('event.location') || 'Địa điểm'}</Text>
          <TextInput
            style={styles.filterInput}
            placeholder="Hà Nội, TP.HCM..."
            placeholderTextColor="#9ca3af"
            value={location}
            onChangeText={setLocation}
          />

          <View style={styles.filterRow2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>{t('event.minPrice') || 'Giá từ'}</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="0"
                placeholderTextColor="#9ca3af"
                value={minPrice}
                onChangeText={setMinPrice}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.filterSep}>→</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>{t('event.maxPrice') || 'Giá đến'}</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="999999"
                placeholderTextColor="#9ca3af"
                value={maxPrice}
                onChangeText={setMaxPrice}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.filterRow2}>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>{t('event.fromDate') || 'Từ ngày'}</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={fromDate}
                onChangeText={setFromDate}
                autoCapitalize="none"
              />
            </View>
            <Text style={styles.filterSep}>→</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.filterLabel}>{t('event.toDate') || 'Đến ngày'}</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={toDate}
                onChangeText={setToDate}
                autoCapitalize="none"
              />
            </View>
          </View>

          <Text style={styles.filterLabel}>{t('search.sortBy') || 'Sắp xếp'}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
            {SORT_OPTIONS.map((opt) => (
              <TouchableOpacity key={opt.value} style={[styles.chip, sortBy === opt.value && styles.chipActive]} onPress={() => setSortBy(opt.value)}>
                <Text style={[styles.chipText, sortBy === opt.value && styles.chipTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.applyBtn} onPress={() => { setShowFilters(false); fetchEvents() }}>
            <Text style={styles.applyBtnText}>{t('common.apply') || 'Áp dụng'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EventCard
              event={item}
              onPress={() => navigation.navigate('EventDetail', { id: item.id })}
              isSaved={savedIds.has(item.id)}
            />
          )}
          contentContainerStyle={events.length === 0 ? { flex: 1, justifyContent: 'center', alignItems: 'center' } : { paddingVertical: 12 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40, marginBottom: 8 }}>🔍</Text>
              <Text style={styles.emptyText}>{t('search.noResults') || 'Không tìm thấy sự kiện'}</Text>
              <Text style={styles.emptyHint}>{t('search.tryAdjust') || 'Thử thay đổi bộ lọc hoặc từ khóa'}</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#059669', paddingTop: Platform.OS === 'ios' ? 52 : 36, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { fontSize: 14, color: '#fff', fontWeight: '500', marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: '#fff' },
  filterToggle: { fontSize: 20, padding: 4 },
  searchRow: { flexDirection: 'row', margin: 12, gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 15, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb',
  },
  searchBtn: { backgroundColor: '#059669', borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  searchBtnText: { fontSize: 18 },
  filterPanel: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 14, padding: 14, marginBottom: 8, maxHeight: 360, borderWidth: 1, borderColor: '#e5e7eb' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginTop: 12, marginBottom: 6 },
  chipRow: { flexDirection: 'row', marginBottom: 4 },
  chip: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#f3f4f6', marginRight: 6, marginBottom: 4 },
  chipActive: { backgroundColor: '#059669' },
  chipText: { fontSize: 13, color: '#6b7280' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  filterInput: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, color: '#111827' },
  filterRow2: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterSep: { fontSize: 16, color: '#9ca3af', marginTop: 24 },
  applyBtn: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 10, alignItems: 'center', marginTop: 14 },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingHorizontal: 24 },
  emptyText: { fontSize: 16, color: '#6b7280', marginBottom: 4 },
  emptyHint: { fontSize: 13, color: '#9ca3af', textAlign: 'center' },
})
