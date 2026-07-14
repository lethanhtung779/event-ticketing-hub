import { useState, useEffect } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { notificationApi } from '../api/client'
import { useTranslation } from 'react-i18next'
import {
  subscribe, getNotifications, setNotifications,
  getUnreadCount, markRead, markAllRead,
} from '../stores/notification'

const typeIcons: Record<string, string> = {
  ticket_purchased: '🎫',
  ticket_cancelled: '❌',
  ticket_transferred: '🔄',
  payment_success: '✅',
  payment_failed: '⚠️',
  event_updated: '📢',
  event_cancelled: '🚫',
  waiting_list_available: '🔔',
  review_replied: '💬',
  organizer_approved: '✅',
  organizer_rejected: '❌',
}

export default function NotificationsScreen({ navigation }: any) {
  const { t } = useTranslation()

  function fd(date: string) {
    const d = new Date(date)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return t('notification.justNow')
    if (diff < 3600000) return t('notification.minutesAgo', { count: Math.floor(diff / 60000) })
    if (diff < 86400000) return t('notification.hoursAgo', { count: Math.floor(diff / 3600000) })
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`
  }

  const [loading, setLoading] = useState(true)
  const list = getNotifications()
  const [, setRefresh] = useState(0)

  useEffect(() => {
    notificationApi.getMyNotifications().then(({ data }) => {
      const list = Array.isArray(data) ? data : data?.data ?? []
      setNotifications(list)
    }).catch(() => {}).finally(() => setLoading(false))

    const unsub = subscribe(() => setRefresh((v) => v + 1))
    return unsub
  }, [])

  const handleMarkRead = async (id: string) => {
    await markRead(id)
    setRefresh((v) => v + 1)
  }

  const handleMarkAllRead = async () => {
    await markAllRead()
    setRefresh((v) => v + 1)
  }

  const renderItem = ({ item }: { item: any }) => {
    const isRead = item.read
    return (
      <TouchableOpacity
        style={[styles.card, !isRead && styles.cardUnread]}
        onPress={() => {
          if (!isRead) handleMarkRead(item.id)
        }}
        activeOpacity={0.7}
      >
        <Text style={styles.cardIcon}>{typeIcons[item.type] || '📌'}</Text>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, !isRead && styles.cardTitleUnread]}>{item.title}</Text>
          {item.body && <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>}
          <Text style={styles.cardTime}>{fd(item.createdAt)}</Text>
        </View>
        {!isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>{t('notification.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notification.title')}</Text>
        {getUnreadCount() > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllBtn}>{t('notification.markAllRead')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(item: any) => item.id}
          renderItem={renderItem}
          contentContainerStyle={list.length === 0 ? styles.emptyContainer : { padding: 16, paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
              <Text style={styles.emptyText}>{t('notification.empty')}</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#059669', paddingTop: 52, paddingBottom: 16, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backBtn: { fontSize: 14, color: '#fff', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  markAllBtn: { fontSize: 13, color: '#bbf7d0', fontWeight: '600' },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6',
  },
  cardUnread: { backgroundColor: '#f0fdf4', borderColor: '#d1fae5' },
  cardIcon: { fontSize: 22, marginRight: 12, marginTop: 2 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '500', color: '#374151' },
  cardTitleUnread: { fontWeight: '700', color: '#111827' },
  cardBody: { fontSize: 13, color: '#6b7280', marginTop: 4, lineHeight: 18 },
  cardTime: { fontSize: 11, color: '#9ca3af', marginTop: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669', marginTop: 8, marginLeft: 8 },
  emptyContainer: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
})
