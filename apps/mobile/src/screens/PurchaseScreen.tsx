import { useState, useEffect } from 'react'
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native'
import { eventApi, ticketApi, paymentApi } from '../api/client'
import type { Event, TicketType } from '../types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

function bu(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

function fc(amount: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) }
function fd(date: string) { const d = new Date(date); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}` }
function ft(date: string) { const d = new Date(date); return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` }

export default function PurchaseScreen({ route, navigation }: any) {
  const { eventId, ticketTypeId: preselectedId } = route.params
  const [event, setEvent] = useState<Event | null>(null)
  const [selectedTT, setSelectedTT] = useState<TicketType | null>(null)
  const [qty, setQty] = useState(1)
  const [promoCode, setPromoCode] = useState('')
  const [promoResult, setPromoResult] = useState<{ discount: number; finalPrice: number } | null>(null)
  const [promoLoading, setPromoLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'later'>('vnpay')

  useEffect(() => {
    eventApi.getById(eventId).then(({ data }) => {
      const ev = data as Event
      setEvent(ev)
      const tt = ev.ticketTypes?.find((t) => t.id === preselectedId)
      if (tt) setSelectedTT(tt)
    }).catch(() => navigation.goBack()).finally(() => setLoading(false))
  }, [eventId])

  const selectedTTid = selectedTT?.id || preselectedId
  const currentTT = selectedTT
  const price = currentTT?.price || 0
  const subtotal = price * qty
  const discount = promoResult?.discount || 0
  const total = discount > 0 ? (promoResult?.finalPrice ?? subtotal) : subtotal

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    try {
      const { data } = await ticketApi.validatePromo({ code: promoCode.trim(), totalPrice: subtotal })
      setPromoResult(data as any)
    } catch (err: any) {
      setPromoResult(null)
      Alert.alert('Lỗi', err?.response?.data?.message || 'Mã khuyến mãi không hợp lệ')
    } finally { setPromoLoading(false) }
  }

  const handlePurchase = async () => {
    if (!currentTT) return
    setPurchasing(true)
    try {
      const { data: purchaseRes } = await ticketApi.purchase({
        ticketTypeId: currentTT.id,
        quantity: qty,
        promoCode: promoCode.trim() || undefined,
      })
      const orderId = (purchaseRes as any).orderId

      if (paymentMethod === 'later') {
        Alert.alert('Đặt vé thành công', 'Bạn có thể thanh toán sau trong mục Vé của tôi.', [
          { text: 'OK', onPress: () => navigation.navigate('Main', { screen: 'Vé của tôi' }) },
        ])
        return
      }

      const { data: payRes } = await paymentApi.createVnpay({ orderId })
      const payUrl = (payRes as any).payUrl
      if (!payUrl) {
        Alert.alert('Lỗi', 'Không tạo được đường dẫn thanh toán. Vui lòng thử lại sau.')
        return
      }
      navigation.navigate('VnpayWebView', { payUrl, orderId, eventTitle: event?.title })
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Mua vé thất bại')
    } finally { setPurchasing(false) }
  }

  if (loading) return <ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} />
  if (!event) return <View style={styles.center}><Text style={styles.emptyText}>Không tìm thấy sự kiện</Text></View>

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mua vé</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.eventCard}>
          {event.bannerUrl ? (
            <Image source={{ uri: bu(event.bannerUrl)! }} style={styles.eventBanner} />
          ) : (
            <View style={styles.eventBannerPlaceholder} />
          )}
          <View style={styles.eventInfo}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventMeta}>📅 {fd(event.startTime)} • {ft(event.startTime)}</Text>
            <Text style={styles.eventMeta}>📍 {event.location}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Loại vé</Text>
        {event.ticketTypes?.map((tt) => {
          const available = tt.totalQuantity - tt.soldQuantity
          const active = tt.id === selectedTTid
          return (
            <TouchableOpacity
              key={tt.id}
              style={[styles.ttCard, active && styles.ttCardActive]}
              onPress={() => { setSelectedTT(tt); setQty(tt.minPerOrder || 1); setPromoResult(null) }}
              disabled={available <= 0}
            >
              <View style={styles.ttLeft}>
                <Text style={[styles.ttName, active && styles.ttNameActive]}>{tt.name}</Text>
                {available > 0 ? (
                  <Text style={styles.ttAvail}>{available} vé còn lại</Text>
                ) : (
                  <Text style={styles.ttSoldOut}>Hết vé</Text>
                )}
              </View>
              <Text style={[styles.ttPrice, active && styles.ttPriceActive]}>{fc(tt.price)}</Text>
              {active && <Text style={styles.ttCheck}>✓</Text>}
            </TouchableOpacity>
          )
        })}

        {currentTT && (
          <>
            <View style={styles.qtySection}>
              <Text style={styles.sectionTitle}>Số lượng</Text>
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(Math.max(currentTT.minPerOrder || 1, qty - 1))}
                  disabled={qty <= (currentTT.minPerOrder || 1)}
                >
                  <Text style={[styles.qtyBtnText, qty <= (currentTT.minPerOrder || 1) && styles.qtyBtnDisabled]}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(Math.min(currentTT.maxPerOrder || 99, qty + 1))}
                  disabled={qty >= (currentTT.maxPerOrder || 99)}
                >
                  <Text style={[styles.qtyBtnText, qty >= (currentTT.maxPerOrder || 99) && styles.qtyBtnDisabled]}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Mã khuyến mãi</Text>
            <View style={styles.promoRow}>
              <TextInput
                style={styles.promoInput}
                placeholder="Nhập mã giảm giá"
                placeholderTextColor="#9ca3af"
                value={promoCode}
                onChangeText={(t) => { setPromoCode(t); setPromoResult(null) }}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={styles.promoBtn}
                onPress={handleApplyPromo}
                disabled={promoLoading || !promoCode.trim()}
              >
                {promoLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.promoBtnText}>Áp dụng</Text>}
              </TouchableOpacity>
            </View>
            {promoResult && (
              <Text style={styles.promoSuccess}>Đã áp dụng mã giảm giá</Text>
            )}

            <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
            <View style={styles.pmRow}>
              <TouchableOpacity
                style={[styles.pmCard, paymentMethod === 'vnpay' && styles.pmCardActive]}
                onPress={() => setPaymentMethod('vnpay')}
              >
                <Text style={[styles.pmIcon]}>💳</Text>
                <Text style={[styles.pmLabel, paymentMethod === 'vnpay' && styles.pmLabelActive]}>Thanh toán ngay</Text>
                <Text style={styles.pmDesc}>Chuyển đến cổng thanh toán VNPay</Text>
                {paymentMethod === 'vnpay' && <Text style={styles.pmCheck}>✓</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.pmCard, paymentMethod === 'later' && styles.pmCardActive]}
                onPress={() => setPaymentMethod('later')}
              >
                <Text style={[styles.pmIcon]}>⏳</Text>
                <Text style={[styles.pmLabel, paymentMethod === 'later' && styles.pmLabelActive]}>Thanh toán sau</Text>
                <Text style={styles.pmDesc}>Thanh toán trong mục Vé của tôi</Text>
                {paymentMethod === 'later' && <Text style={styles.pmCheck}>✓</Text>}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      {currentTT && (
        <View style={styles.footer}>
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tạm tính</Text>
              <Text style={styles.summaryValue}>{fc(subtotal)}</Text>
            </View>
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm giá</Text>
                <Text style={[styles.summaryValue, styles.discountText]}>−{fc(discount)}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Tổng cộng</Text>
              <Text style={styles.totalValue}>{fc(total)}</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.buyBtn, paymentMethod === 'later' && { backgroundColor: '#f59e0b' }]} onPress={handlePurchase} disabled={purchasing}>
            {purchasing ? <ActivityIndicator color="#fff" /> : <Text style={styles.buyBtnText}>{paymentMethod === 'later' ? 'Đặt vé (thanh toán sau)' : 'Thanh toán ngay'}</Text>}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#9ca3af' },
  header: { backgroundColor: '#fff', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { fontSize: 14, color: '#059669', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { flex: 1, padding: 16 },
  eventCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  eventBanner: { width: '100%', height: 140 },
  eventBannerPlaceholder: { width: '100%', height: 140, backgroundColor: '#e5e7eb' },
  eventInfo: { padding: 14 },
  eventTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 6 },
  eventMeta: { fontSize: 13, color: '#6b7280', marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 10 },
  ttCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  ttCardActive: { borderColor: '#059669', backgroundColor: '#f0fdf4' },
  ttLeft: { flex: 1 },
  ttName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  ttNameActive: { color: '#059669' },
  ttAvail: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  ttSoldOut: { fontSize: 12, color: '#ef4444', marginTop: 2 },
  ttPrice: { fontSize: 15, fontWeight: '700', color: '#374151', marginRight: 8 },
  ttPriceActive: { color: '#059669' },
  ttCheck: { fontSize: 16, color: '#059669', fontWeight: '700' },
  qtySection: { marginBottom: 20 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: '#fff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  qtyBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  qtyBtnText: { fontSize: 22, fontWeight: '600', color: '#111827' },
  qtyBtnDisabled: { color: '#d1d5db' },
  qtyValue: { fontSize: 24, fontWeight: '700', color: '#111827', minWidth: 40, textAlign: 'center' },
  promoRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  promoInput: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb' },
  promoBtn: { backgroundColor: '#059669', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  promoBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  promoSuccess: { fontSize: 13, color: '#059669', fontWeight: '500', marginBottom: 10 },
  pmRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  pmCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#e5e7eb', alignItems: 'center' },
  pmCardActive: { borderColor: '#059669', backgroundColor: '#f0fdf4' },
  pmIcon: { fontSize: 24, marginBottom: 6 },
  pmLabel: { fontSize: 14, fontWeight: '700', color: '#374151', marginBottom: 4 },
  pmLabelActive: { color: '#059669' },
  pmDesc: { fontSize: 11, color: '#9ca3af', textAlign: 'center' },
  pmCheck: { position: 'absolute', top: 6, right: 10, fontSize: 16, color: '#059669', fontWeight: '700' },
  footer: { backgroundColor: '#fff', padding: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  summary: { marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 14, color: '#6b7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  discountText: { color: '#ef4444' },
  totalRow: { paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' },
  totalLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#059669' },
  buyBtn: { backgroundColor: '#059669', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  buyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
