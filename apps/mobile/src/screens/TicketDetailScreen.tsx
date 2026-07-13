import { useState, useEffect, useRef } from 'react'
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal, TextInput, Share, Platform } from 'react-native'
import { ticketApi, paymentApi } from '../api/client'
import QRCode from 'react-native-qrcode-svg'
import { Paths, File } from 'expo-file-system'
import { Asset, requestPermissionsAsync } from 'expo-media-library'
import ViewShot from 'react-native-view-shot'
import type { Ticket } from '../types'

function fc(amount: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) }
function fd(date: string) { const d = new Date(date); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}` }

const statusLabels: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ thanh toán', color: '#f59e0b' },
  VALID: { label: 'Hợp lệ', color: '#059669' },
  CHECKED_IN: { label: 'Đã check-in', color: '#3b82f6' },
  CANCELLED: { label: 'Đã huỷ', color: '#ef4444' },
  TRANSFERRED: { label: 'Đã chuyển', color: '#f97316' },
}

export default function TicketDetailScreen({ route, navigation }: any) {
  const { id } = route.params
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [transferOpen, setTransferOpen] = useState(false)
  const [targetEmail, setTargetEmail] = useState('')
  const [transferring, setTransferring] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const qrRef = useRef<any>(null)
  const viewShotRef = useRef<ViewShot>(null)

  const handleDownloadQR = async () => {
    try {
      const { status } = await requestPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Cần quyền', 'Vui lòng cấp quyền truy cập thư viện ảnh để lưu mã QR.')
        return
      }
      const uri = await viewShotRef.current?.capture?.()
      if (!uri) {
        Alert.alert('Lỗi', 'Không thể tạo ảnh vé.')
        return
      }
      const tmpFile = new File(uri)
      const destFile = new File(Paths.cache, `ticket-${ticket?.id || Date.now()}.png`)
      await tmpFile.move(destFile, { overwrite: true })
      await Asset.create(destFile.uri)
      Alert.alert('Đã lưu', 'Ảnh vé đã được lưu vào thư viện ảnh.')
    } catch (err: any) {
      Alert.alert('Lỗi', err?.message || 'Không thể lưu ảnh vé')
    }
  }

  useEffect(() => {
    ticketApi.getById(id).then(({ data }) => setTicket(data)).catch(() => navigation.goBack())
      .finally(() => setLoading(false))
  }, [id])

  const handleCopy = () => {
    if (ticket?.qrCodeToken) {
      Share.share({ message: ticket.qrCodeToken })
    }
  }

  const handleTransfer = async () => {
    if (!targetEmail.trim()) return
    setTransferring(true)
    try {
      await ticketApi.transfer(id, targetEmail.trim())
      Alert.alert('Thành công', 'Chuyển vé thành công!')
      setTransferOpen(false)
      setTargetEmail('')
      const { data } = await ticketApi.getById(id)
      setTicket(data)
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Chuyển vé thất bại')
    } finally { setTransferring(false) }
  }

  const handlePay = async () => {
    const orderId = ticket?.order?.id || ticket?.orderId
    if (!orderId) { Alert.alert('Lỗi', 'Không tìm thấy đơn hàng'); return }
    try {
      const { data } = await paymentApi.createVnpay({ orderId })
      navigation.navigate('VnpayWebView', {
        payUrl: (data as any).payUrl,
        orderId,
        eventTitle: ticket?.ticketType?.event?.title || '',
      })
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Không thể tạo thanh toán')
    }
  }

  const handleCancel = () => {
    Alert.alert('Huỷ vé', 'Bạn có chắc muốn huỷ vé này?', [
      { text: 'Không', style: 'cancel' },
      { text: 'Huỷ vé', style: 'destructive', onPress: async () => {
        setCancelling(true)
        try {
          await ticketApi.cancel(id)
          Alert.alert('Thành công', 'Đã huỷ vé')
          const { data } = await ticketApi.getById(id)
          setTicket(data)
        } catch (err: any) {
          Alert.alert('Lỗi', err?.response?.data?.message || 'Huỷ vé thất bại')
        } finally { setCancelling(false) }
      }},
    ])
  }

  if (loading) return <ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} />
  if (!ticket) return null

  const cfg = statusLabels[ticket.status] || { label: ticket.status, color: '#6b7280' }
  const canTransfer = ticket.status === 'VALID' || ticket.status === 'PENDING'
  const canCancel = ticket.status === 'PENDING' || ticket.status === 'VALID'

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chi tiết vé</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Quay lại</Text></TouchableOpacity>
      </View>

      <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1 }} style={styles.captureView}>
        <View style={styles.content}>
          <View style={styles.qrSection}>
            <View style={[styles.statusBadge, { backgroundColor: cfg.color + '20' }]}>
              <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
            <View style={styles.qrBox}>
              {ticket.qrCodeToken ? (
                <QRCode
                  value={ticket.qrCodeToken}
                  size={180}
                  backgroundColor="#fff"
                  color="#1e1e2e"
                  getRef={(ref) => { qrRef.current = ref }}
                />
              ) : (
                <View style={styles.qrPlaceholder}><Text style={styles.qrPlaceholderText}>Đang tạo...</Text></View>
              )}
            </View>
            <View style={styles.qrActions}>
              <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                <Text style={styles.copyBtnText}>📋 Chia sẻ</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.copyBtn} onPress={handleDownloadQR}>
                <Text style={styles.copyBtnText}>💾 Lưu ảnh</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.eventTitle}>{ticket.ticketType?.event?.title}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Loại vé</Text>
              <Text style={styles.infoValue}>{ticket.ticketType?.name}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Giá vé</Text>
              <Text style={styles.infoValue}>{fc(ticket.ticketType?.price || 0)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Địa điểm</Text>
              <Text style={styles.infoValue}>{ticket.ticketType?.event?.location}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Thời gian</Text>
              <Text style={styles.infoValue}>{ticket.ticketType?.event?.startTime ? fd(ticket.ticketType.event.startTime) : '---'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ngày mua</Text>
              <Text style={styles.infoValue}>{fd(ticket.createdAt)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Trạng thái</Text>
              <Text style={[styles.infoValue, { color: cfg.color }]}>{cfg.label}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            {ticket.status === 'PENDING' && (
              <TouchableOpacity style={[styles.actionBtn, { borderColor: '#059669' }]} onPress={handlePay}>
                <Text style={[styles.actionBtnText, { color: '#059669' }]}>💳 Thanh toán</Text>
              </TouchableOpacity>
            )}
            {canTransfer && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => setTransferOpen(true)}>
                <Text style={styles.actionBtnText}>📤 Chuyển vé</Text>
              </TouchableOpacity>
            )}
            {canCancel && (
              <TouchableOpacity style={[styles.actionBtn, styles.actionDanger]} onPress={handleCancel} disabled={cancelling}>
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>{cancelling ? 'Đang huỷ...' : '🗑️ Huỷ vé'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ViewShot>

      <Modal visible={transferOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Chuyển vé</Text>
            <Text style={styles.modalDesc}>Nhập email người nhận</Text>
            <TextInput style={styles.modalInput} placeholder="Email người nhận" placeholderTextColor="#9ca3af" value={targetEmail} onChangeText={setTargetEmail} autoCapitalize="none" keyboardType="email-address" />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setTransferOpen(false)}><Text style={styles.modalCancelText}>Huỷ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleTransfer} disabled={transferring}>
                {transferring ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Chuyển vé</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  backBtn: { fontSize: 14, color: '#059669', fontWeight: '500' },
  content: { padding: 16, backgroundColor: '#f9fafb' },
  captureView: { backgroundColor: '#f9fafb' },
  qrSection: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, padding: 24, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3 },
  statusBadge: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, marginBottom: 16 },
  statusText: { fontSize: 13, fontWeight: '700' },
  qrBox: { marginBottom: 16 },
  qrPlaceholder: { width: 180, height: 180, backgroundColor: '#f3f4f6', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  qrPlaceholderText: { color: '#9ca3af' },
  qrActions: { flexDirection: 'row', gap: 12 },
  copyBtn: { backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  copyBtnText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  eventTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 20 },
  infoGrid: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  infoLabel: { fontSize: 14, color: '#6b7280' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111827', textAlign: 'right', flex: 1, marginLeft: 16 },
  actions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  actionDanger: { borderColor: '#fecaca' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 8 },
  modalDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  modalInput: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 16 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  modalCancelText: { fontSize: 15, fontWeight: '500', color: '#6b7280' },
  modalSubmit: { flex: 1, backgroundColor: '#059669', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
