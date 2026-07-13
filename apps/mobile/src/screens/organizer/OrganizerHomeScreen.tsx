import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, RefreshControl } from 'react-native'
import { useTranslation } from 'react-i18next'
import { organizerApi } from '../../api/client'

export default function OrganizerHomeScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [pRes, sRes] = await Promise.allSettled([
        organizerApi.getProfile(),
        organizerApi.getStats(),
      ])
      if (pRes.status === 'fulfilled') setProfile(pRes.value.data)
      if (sRes.status === 'fulfilled') setStats(sRes.value.data)
    } catch (e) { console.warn('[OrganizerHome] error:', e) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchData() }, [])

  const onRefresh = () => { setRefreshing(true); fetchData() }

  if (loading) return <ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} />

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← {t('common.back')}</Text></TouchableOpacity>
          <Text style={styles.headerTitle}>{t('organizer.title')}</Text>
        </View>
        <View style={styles.center}>
          <Text style={styles.setupIcon}>📋</Text>
          <Text style={styles.setupTitle}>{t('organizer.setup')}</Text>
          <Text style={styles.setupDesc}>{t('organizer.setupDesc')}</Text>
          <TouchableOpacity style={styles.setupBtn} onPress={() => navigation.navigate('OrganizerSetup')}>
            <Text style={styles.setupBtnText}>{t('organizer.saveProfile')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← {t('common.back')}</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('organizer.dashboard')}</Text>
        <Text style={styles.orgName}>{profile.name}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.events ?? 0}</Text>
          <Text style={styles.statLabel}>{t('event.ticketTypes')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.ticketsSold ?? 0}</Text>
          <Text style={styles.statLabel}>{t('organizer.ticketsSold')}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.revenue ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenue) : '0'}</Text>
          <Text style={styles.statLabel}>{t('organizer.revenue')}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrganizerEvents')}>
          <Text style={styles.menuIcon}>📅</Text>
          <Text style={styles.menuText}>{t('organizer.events')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrganizerSetup')}>
          <Text style={styles.menuIcon}>✏️</Text>
          <Text style={styles.menuText}>{t('organizer.profile')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrganizerReports')}>
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>{t('organizer.reports')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrganizerTerms')}>
          <Text style={styles.menuIcon}>📄</Text>
          <Text style={styles.menuText}>{t('organizer.terms')}</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#059669', paddingTop: 52, paddingBottom: 20, paddingHorizontal: 16 },
  backBtn: { fontSize: 14, color: '#fff', fontWeight: '500', marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  orgName: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  setupIcon: { fontSize: 48, marginBottom: 16 },
  setupTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  setupDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  setupBtn: { backgroundColor: '#059669', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14 },
  setupBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', gap: 10, margin: 16, marginTop: -10 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  statNumber: { fontSize: 16, fontWeight: '700', color: '#059669', textAlign: 'center' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  menu: { marginHorizontal: 16, marginBottom: 40 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  menuIcon: { fontSize: 16, marginRight: 12 },
  menuText: { fontSize: 15, color: '#374151', fontWeight: '500', flex: 1 },
  menuArrow: { fontSize: 18, color: '#9ca3af' },
})
