import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, TextInput, Alert } from 'react-native'
import { eventApi, reviewApi, ticketApi, followApi, wishlistApi } from '../api/client'
import { useTranslation } from 'react-i18next'
import { getUser } from '../stores/auth'
import type { Event, Review } from '../types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

function bu(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

function fc(amount: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) }
function fd(date: string) { const d = new Date(date); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}` }
function ft(date: string) { const d = new Date(date); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` }

const statusColors: Record<string, string> = {
  DRAFT: '#6b7280', PENDING: '#f59e0b', PUBLISHED: '#059669',
  REJECTED: '#ef4444', CANCELLED: '#ef4444', COMPLETED: '#3b82f6',
}


export default function EventDetailScreen({ route, navigation }: any) {
  const { id } = route.params
  const [event, setEvent] = useState<Event | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [similarEvents, setSimilarEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [reviewModal, setReviewModal] = useState(false)
  const [wlModal, setWlModal] = useState(false)
  const [wlTicketTypeId, setWlTicketTypeId] = useState('')
  const [wlQty, setWlQty] = useState(1)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const user = getUser()
  const { t } = useTranslation()
  const statusLabels: Record<string, string> = {
    DRAFT: t('event.statusDraft'), PENDING: t('event.statusPending'), PUBLISHED: t('event.statusPublished'),
    REJECTED: t('event.statusRejected'), CANCELLED: t('event.statusCancelled'), COMPLETED: t('event.statusCompleted'),
  }

  const fetchData = () => {
    Promise.all([
      eventApi.getById(id),
      reviewApi.getByEvent(id),
    ]).then(async ([eventRes, reviewRes]) => {
      const ev = eventRes.data as Event
      setEvent(ev)
      const rlist = Array.isArray(reviewRes.data) ? reviewRes.data : reviewRes.data?.data ?? []
      setReviews(rlist)
      if (ev.categoryId) {
        try {
          const simRes = await eventApi.getAll({ categoryId: ev.categoryId, limit: '5' })
          const simList = Array.isArray(simRes.data) ? simRes.data : simRes.data?.data ?? []
          setSimilarEvents(simList.filter((e: Event) => e.id !== ev.id).slice(0, 5))
        } catch (e) { console.warn('[EventDetail] similar error:', e) }
      }
      if (user && ev.organizer) {
        try {
          const fRes = await followApi.check(ev.organizer.id)
          setFollowing((fRes.data as any)?.isFollowing ?? false)
        } catch (e) { console.warn('[EventDetail] follow check error:', e) }
        try {
          const wRes = await wishlistApi.check(ev.id)
          setSaved((wRes.data as any)?.isSaved ?? false)
        } catch (e) { console.warn('[EventDetail] wishlist check error:', e) }
      }
    }).catch((e) => { console.warn('[EventDetail] fetch error:', e) }).finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [id])

  const handleFollow = async () => {
    if (!event?.organizer || !user) { Alert.alert('Lỗi', t('auth.loginRequired')); return }
    setFollowLoading(true)
    try {
      if (following) { await followApi.unfollow(event.organizer.id); setFollowing(false) }
      else { await followApi.follow(event.organizer.id); setFollowing(true) }
      } catch { Alert.alert('Lỗi', t('event.followFailed')) }
    finally { setFollowLoading(false) }
  }

  const handleWishlist = async () => {
    if (!user) { Alert.alert('Lỗi', t('auth.loginRequired')); return }
    try {
      if (saved) { await wishlistApi.unsave(event!.id); setSaved(false) }
      else { await wishlistApi.save(event!.id); setSaved(true) }
      } catch { Alert.alert('Lỗi', t('event.wishlistFailed')) }
  }

  const handleReview = async () => {
    setSubmitting(true)
    try {
      await reviewApi.create(id, { rating: reviewRating, comment: reviewComment || undefined })
      setReviewModal(false)
      setReviewComment('')
      fetchData()
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || t('event.reviewFailed'))
    } finally { setSubmitting(false) }
  }

  const handleJoinWL = async () => {
    setSubmitting(true)
    try {
      await ticketApi.joinWaitingList({ eventId: id, ticketTypeId: wlTicketTypeId, quantity: wlQty })
      setWlModal(false)
      Alert.alert(t('common.success'), t('event.wlRegistered'))
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || t('event.wlFailed'))
    } finally { setSubmitting(false) }
  }

  if (loading) return <ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} />
  if (!event) return <View style={styles.center}><Text style={styles.errorText}>{t('event.notFound')}</Text></View>

  const avgRating = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0

  return (
    <ScrollView style={styles.container}>
      {event.bannerUrl ? <Image source={{ uri: bu(event.bannerUrl)! }} style={styles.banner} /> : <View style={styles.bannerPlaceholder} />}

      <TouchableOpacity onPress={handleWishlist} style={styles.wishlistBtn}>
        <Text style={{ fontSize: 22 }}>{saved ? '❤️' : '🤍'}</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: statusColors[event.status] || '#6b7280' }]}>
            <Text style={styles.statusBadgeText}>{statusLabels[event.status] || event.status}</Text>
          </View>
          {event.category && (
            <View style={styles.catBadge}>
              <Text style={styles.catBadgeText}>{event.category.name}</Text>
            </View>
          )}
        </View>

        <Text style={styles.title}>{event.title}</Text>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📅</Text>
            <Text style={styles.infoLabel}>{t('event.date')}</Text>
            <Text style={styles.infoValue}>{fd(event.startTime)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>🕐</Text>
            <Text style={styles.infoLabel}>{t('event.time')}</Text>
            <Text style={styles.infoValue}>{ft(event.startTime)} - {ft(event.endTime)}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoLabel}>{t('event.location')}</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{event.location}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{t('event.description')}</Text>
        <Text style={styles.description}>{event.description}</Text>

        {event.agenda && Array.isArray(event.agenda) && event.agenda.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('event.agenda')}</Text>
            {event.agenda.map((item: any, i: number) => (
              <View key={i} style={styles.agendaItem}>
                {item.time && <Text style={styles.agendaTime}>{item.time}</Text>}
                {item.title && <Text style={styles.agendaTitle}>{item.title}</Text>}
                {item.description && <Text style={styles.agendaDesc}>{item.description}</Text>}
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionTitle}>{t('event.reviews')} {avgRating > 0 && `⭐ ${avgRating} (${reviews.length})`}</Text>
        {user && (
          <TouchableOpacity style={styles.reviewBtn} onPress={() => setReviewModal(true)}>
            <Text style={styles.reviewBtnText}>✏️ {t('event.writeReview')}</Text>
          </TouchableOpacity>
        )}
        {reviews.length === 0 ? (
          <Text style={styles.emptyText}>{t('event.noReviews')}</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}><Text style={styles.reviewAvatarText}>{r.user?.fullName?.charAt(0) || '?'}</Text></View>
                <View>
                  <Text style={styles.reviewName}>{r.user?.fullName || t('event.anonymous')}</Text>
                  <Text style={styles.reviewStars}>{'⭐'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</Text>
                </View>
              </View>
              {r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}
              <Text style={styles.reviewDate}>{fd(r.createdAt)}</Text>
            </View>
          ))
        )}

        {similarEvents.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('event.similarEvents')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.similarScroll}>
              {similarEvents.map((se) => (
                <TouchableOpacity key={se.id} style={styles.similarCard} onPress={() => navigation.replace('EventDetail', { id: se.id })}>
                  {se.bannerUrl ? <Image source={{ uri: bu(se.bannerUrl)! }} style={styles.similarBanner} /> : <View style={styles.similarBannerPlaceholder} />}
                  <Text style={styles.similarTitle} numberOfLines={2}>{se.title}</Text>
                  <Text style={styles.similarDate}>{fd(se.startTime)}</Text>
                  <Text style={styles.similarPrice}>{fc(Math.min(...se.ticketTypes.map((t) => t.price)))}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {event.organizer && (
          <>
            <Text style={styles.sectionTitle}>{t('event.organizer')}</Text>
            <View style={styles.organizerCard}>
              <View style={styles.orgAvatar}><Text style={styles.orgAvatarText}>{event.organizer.name.charAt(0)}</Text></View>
              <View style={styles.orgInfo}>
                <Text style={styles.orgName}>{event.organizer.name}</Text>
                {event.organizer.description && <Text style={styles.orgDesc}>{event.organizer.description}</Text>}
              </View>
              {user && (
                <TouchableOpacity style={[styles.followBtn, following && styles.followBtnActive]} onPress={handleFollow} disabled={followLoading}>
                  <Text style={[styles.followBtnText, following && styles.followBtnTextActive]}>{following ? t('event.following') : t('event.follow')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>{t('event.ticketTypes')}</Text>
        {event.ticketTypes?.length > 0 ? (
          event.ticketTypes.map((tt) => {
            const available = tt.totalQuantity - tt.soldQuantity
            const soldOut = available <= 0
            return (
              <View key={tt.id} style={[styles.ttCard, soldOut && styles.ttSoldOut]}>
                <View style={styles.ttInfo}>
                  <Text style={styles.ttName}>{tt.name}</Text>
                  <Text style={styles.ttAvailable}>{soldOut ? t('event.soldOut') : t('event.ticketsLeft', { count: available })}</Text>
                </View>
                <Text style={styles.ttPrice}>{fc(tt.price)}</Text>
                {!soldOut && user && event.status === 'PUBLISHED' && (
                  <TouchableOpacity style={styles.buyBtn} onPress={() => navigation.navigate('Purchase', { eventId: event.id, ticketTypeId: tt.id })}>
                    <Text style={styles.buyBtnText}>{t('event.buy')}</Text>
                  </TouchableOpacity>
                )}
                {soldOut && user && event.status === 'PUBLISHED' && (
                  <TouchableOpacity style={styles.wlBtn} onPress={() => { setWlTicketTypeId(tt.id); setWlQty(tt.minPerOrder || 1); setWlModal(true) }}>
                    <Text style={styles.wlBtnText}>🔔 {t('event.waitingList')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          })
        ) : <Text style={styles.emptyText}>{t('event.noTickets')}</Text>}

        {!user && (
          <View style={styles.loginPrompt}>
            <Text style={styles.loginPromptText}>{t('event.loginToBuy')}</Text>
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginBtnText}>{t('auth.login')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal visible={reviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('event.reviewTitle')}</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((r) => (
                <TouchableOpacity key={r} onPress={() => setReviewRating(r)}>
                  <Text style={{ fontSize: 32 }}>{r <= reviewRating ? '⭐' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.modalInput} placeholder={t('event.reviewPlaceholder')} placeholderTextColor="#9ca3af" multiline value={reviewComment} onChangeText={setReviewComment} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setReviewModal(false)}><Text style={styles.modalCancelText}>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleReview} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>{t('event.reviewSubmit')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={wlModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t('event.joinWLModalTitle')}</Text>
            <Text style={styles.wlInfo}>{t('event.joinWLDesc')}</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity onPress={() => setWlQty(Math.max(1, wlQty - 1))} style={styles.qtyBtn}><Text>-</Text></TouchableOpacity>
              <Text style={styles.qtyText}>{wlQty}</Text>
              <TouchableOpacity onPress={() => setWlQty(wlQty + 1)} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setWlModal(false)}><Text style={styles.modalCancelText}>{t('common.cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleJoinWL} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>{t('event.joinWL')}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: '#9ca3af' },
  banner: { width: '100%', height: 220 },
  bannerPlaceholder: { width: '100%', height: 220, backgroundColor: '#e5e7eb' },
  wishlistBtn: { position: 'absolute', top: 180, right: 16, zIndex: 10, backgroundColor: '#fff', borderRadius: 20, padding: 8, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4 },
  content: { padding: 16 },
  badgeRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  statusBadge: { borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  statusBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  catBadge: { backgroundColor: '#e0e7ff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  catBadgeText: { color: '#4338ca', fontSize: 12, fontWeight: '600' },
  title: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 16 },
  infoGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  infoCard: { flex: 1, backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, alignItems: 'center' },
  infoIcon: { fontSize: 20, marginBottom: 4 },
  infoLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 2 },
  infoValue: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginTop: 20, marginBottom: 12 },
  description: { fontSize: 15, color: '#4b5563', lineHeight: 24 },
  agendaItem: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  agendaTime: { fontSize: 13, fontWeight: '700', color: '#059669', marginBottom: 4 },
  agendaTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  agendaDesc: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  reviewBtn: { backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10, alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: '#d1fae5' },
  reviewBtnText: { color: '#059669', fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#f3f4f6' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
  reviewAvatarText: { fontSize: 16, fontWeight: '700', color: '#059669' },
  reviewName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  reviewStars: { fontSize: 12, marginTop: 2 },
  reviewComment: { fontSize: 14, color: '#4b5563', marginBottom: 6 },
  reviewDate: { fontSize: 11, color: '#9ca3af' },
  organizerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', gap: 12 },
  orgAvatar: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
  orgAvatarText: { fontSize: 20, fontWeight: '700', color: '#059669' },
  orgInfo: { flex: 1 },
  orgName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  orgDesc: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  followBtn: { borderWidth: 1, borderColor: '#059669', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  followBtnActive: { backgroundColor: '#059669' },
  followBtnText: { color: '#059669', fontSize: 12, fontWeight: '600' },
  followBtnTextActive: { color: '#fff' },
  ttCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  ttSoldOut: { opacity: 0.6, backgroundColor: '#f9fafb' },
  ttInfo: { flex: 1 },
  ttName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  ttAvailable: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  ttPrice: { fontSize: 16, fontWeight: '700', color: '#059669' },
  similarScroll: { marginBottom: 8 },
  similarCard: { width: 160, marginRight: 12, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e5e7eb' },
  similarBanner: { width: '100%', height: 90 },
  similarBannerPlaceholder: { width: '100%', height: 90, backgroundColor: '#e5e7eb' },
  similarTitle: { fontSize: 13, fontWeight: '600', color: '#111827', paddingHorizontal: 8, paddingTop: 8, lineHeight: 18 },
  similarDate: { fontSize: 11, color: '#9ca3af', paddingHorizontal: 8, marginTop: 4 },
  similarPrice: { fontSize: 13, fontWeight: '700', color: '#059669', paddingHorizontal: 8, paddingVertical: 6 },
  buyBtn: { backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  buyBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  wlBtn: { borderWidth: 1, borderColor: '#f59e0b', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  wlBtnText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  loginPrompt: { backgroundColor: '#e0e7ff', borderRadius: 14, padding: 20, alignItems: 'center', marginTop: 16 },
  loginPromptText: { color: '#4338ca', fontSize: 14, marginBottom: 10 },
  loginBtn: { backgroundColor: '#4338ca', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 },
  loginBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '70%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 16, textAlign: 'center' },
  starRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 16 },
  modalInput: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  modalCancelText: { fontSize: 15, fontWeight: '500', color: '#6b7280' },
  modalSubmit: { flex: 1, backgroundColor: '#059669', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  wlInfo: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
  qtyBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  qtyText: { fontSize: 18, fontWeight: '700', color: '#111827', minWidth: 30, textAlign: 'center' },
})
