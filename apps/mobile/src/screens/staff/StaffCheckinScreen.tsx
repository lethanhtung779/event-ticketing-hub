import { useState, useEffect, useCallback, useRef } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, FlatList, Alert, Vibration, Animated, Platform, Modal } from 'react-native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useFocusEffect } from '@react-navigation/native'
import { ticketApi } from '../../api/client'
import AsyncStorage from '@react-native-async-storage/async-storage'

const OFFLINE_QUEUE_KEY = 'offline_checkin_queue'

type ScanState = 'idle' | 'success' | 'already_used' | 'invalid' | 'error'
type ResultData = {
  state: ScanState
  message: string
  ticket?: {
    id: string
    fullName?: string
    ticketType?: string
    seat?: string | null
    checkedInAt?: string
    checkedInBy?: string
  }
}

function fd(date: string) {
  const d = new Date(date)
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

function hr(date: string) {
  const d = new Date(date)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

export default function StaffCheckinScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [scanResult, setScanResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState(true)
  const [torch, setTorch] = useState(false)
  const [scannerActive, setScannerActive] = useState(true)
  const [mode, setMode] = useState<'scan' | 'manual'>('scan')
  const [manualQuery, setManualQuery] = useState('')
  const [manualResults, setManualResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [offlineCount, setOfflineCount] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)

  const scanningRef = useRef(false)
  const resultTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashAnim = useRef(new Animated.Value(0)).current

  const syncOfflineQueue = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
      if (!raw) return
      const queue = JSON.parse(raw)
      if (queue.length === 0) return
      setSyncing(true)
      const remaining: any[] = []
      for (const item of queue) {
        try {
          await ticketApi.checkIn(item.qrCodeToken)
        } catch {
          remaining.push(item)
        }
      }
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining))
      setOfflineCount(remaining.length)
    } catch {} finally { setSyncing(false) }
  }, [])

  useFocusEffect(useCallback(() => {
    setScannerActive(true)
    syncOfflineQueue()
    return () => { setScannerActive(false) }
  }, [syncOfflineQueue]))

  const showFlash = (color: string) => {
    flashAnim.setValue(1)
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }

  const playVibration = (pattern: 'success' | 'warning' | 'error') => {
    if (pattern === 'success') {
      Vibration.vibrate(100)
    } else if (pattern === 'warning') {
      Vibration.vibrate([0, 200, 100, 300])
    } else {
      Vibration.vibrate([0, 150, 80, 150, 80, 300])
    }
  }

  const handleResult = (result: ResultData) => {
    setScanResult(result)
    setScanned(true)
    setShowResultModal(true)

    if (result.state === 'success') {
      showFlash('#059669')
      playVibration('success')
    } else if (result.state === 'already_used') {
      showFlash('#dc2626')
      playVibration('warning')
    } else {
      showFlash('#dc2626')
      playVibration('error')
    }
  }

  const dismissResult = () => {
    setShowResultModal(false)
    setScanResult(null)
    setScanned(false)
    scanningRef.current = false
  }

  const offlineCheckIn = async (qrCodeToken: string) => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY)
      const queue = raw ? JSON.parse(raw) : []
      queue.push({ qrCodeToken, scannedAt: new Date().toISOString() })
      await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue))
      setOfflineCount(queue.length)
      handleResult({
        state: 'success',
        message: 'Đã lưu vào hàng chờ (offline). Sẽ đồng bộ khi có mạng.',
      })
    } catch {
      handleResult({
        state: 'error',
        message: 'Lỗi lưu offline. Vui lòng thử lại.',
      })
    }
  }

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanningRef.current || !scannerActive || !data) return
    scanningRef.current = true

    try {
      const res = await ticketApi.checkIn(data)
      const ticket = (res.data as any)?.ticket
      handleResult({
        state: 'success',
        message: 'Check-in thành công!',
        ticket: {
          id: ticket?.id,
          fullName: ticket?.user?.fullName || ticket?.fullName,
          ticketType: ticket?.ticketType?.name,
          seat: ticket?.seat || ticket?.seatNumber,
        },
      })
    } catch (err: any) {
      const status = err?.response?.status
      const msg = err?.response?.data?.message || ''
      const errMsg = err?.message || ''

      if (status === 409 || msg?.includes('đã check-in') || msg?.includes('already')) {
        const ticket = err?.response?.data?.ticket
        handleResult({
          state: 'already_used',
          message: 'Vé đã được sử dụng!',
          ticket: {
            id: ticket?.id,
            fullName: ticket?.fullName,
            ticketType: ticket?.ticketType?.name,
            checkedInAt: ticket?.checkedInAt,
            checkedInBy: ticket?.checkedInBy,
          },
        })
      } else if (status === 404 || msg?.includes('không tồn tại') || msg?.includes('invalid')) {
        handleResult({
          state: 'invalid',
          message: 'Vé không hợp lệ!',
        })
      } else if (msg?.includes('mạng') || msg?.includes('network') || msg?.includes('ENOTFOUND') || msg?.includes('timeout') || errMsg?.includes('Network Error') || errMsg?.includes('network') || err.code === 'ERR_NETWORK' || err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
        await offlineCheckIn(data)
      } else {
        handleResult({
          state: 'error',
          message: msg || errMsg || 'Lỗi không xác định',
        })
      }
    }
  }

  useEffect(() => {
    return () => { if (resultTimer.current) clearTimeout(resultTimer.current) }
  }, [])

  const handleManualSearch = async () => {
    if (!manualQuery.trim()) { Alert.alert('Lỗi', 'Nhập email, tên, hoặc mã đơn'); return }
    setSearching(true)
    try {
      const res = await ticketApi.searchTicket(manualQuery.trim())
      const results = Array.isArray(res.data) ? res.data : res.data?.data ?? []
      setManualResults(results)
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Tìm kiếm thất bại')
    } finally { setSearching(false) }
  }

  const handleManualCheckIn = async (ticketId: string) => {
    try {
      await ticketApi.checkInManual(ticketId)
      setManualResults((prev) => prev.filter((t: any) => t.id !== ticketId))
      setManualQuery('')
      Alert.alert('Thành công', 'Check-in thủ công thành công!')
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Check-in thất bại')
    }
  }

  const getResultBg = () => {
    if (!scanResult) return 'transparent'
    switch (scanResult.state) {
      case 'success': return '#059669'
      case 'already_used': return '#dc2626'
      case 'invalid': return '#d97706'
      case 'error': return '#dc2626'
      default: return '#374151'
    }
  }

  const renderTicketItem = ({ item }: { item: any }) => (
    <View style={styles.ticketCard}>
      <View style={[styles.ticketDot, { backgroundColor: item.status === 'CHECKED_IN' ? '#059669' : '#9ca3af' }]} />
      <View style={styles.ticketInfo}>
        <Text style={styles.ticketTicketType}>{item.ticketType?.name || 'Vé'}</Text>
        <Text style={styles.ticketOwner}>{item.user?.fullName || `#${item.id.slice(0, 8)}`}</Text>
        {item.ticketType?.event?.title && (
          <Text style={styles.ticketEvent}>{item.ticketType.event.title}</Text>
        )}
        {item.checkedInAt && <Text style={styles.ticketTime}>Check-in: {fd(item.checkedInAt)}</Text>}
      </View>
    </View>
  )

  if (!permission) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} /></View>
  }

  return (
    <View style={styles.container}>
      <Animated.View pointerEvents="none" style={[styles.flashOverlay, { opacity: flashAnim, backgroundColor: getResultBg() }]} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Quay lại</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Quét vé check-in</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('CheckInHistory')} style={styles.historyBtn}>
            <Text style={styles.historyBtnText}>📋</Text>
          </TouchableOpacity>
          {offlineCount > 0 && (
            <TouchableOpacity style={styles.syncBtn} onPress={syncOfflineQueue} disabled={syncing}>
              <Text style={styles.syncBtnText}>{syncing ? '⏳' : `📤${offlineCount}`}</Text>
            </TouchableOpacity>
          )}
          {mode === 'scan' && (
            <TouchableOpacity onPress={() => setTorch(!torch)}>
              <Text style={styles.torchBtn}>{torch ? '🔦' : '💡'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {mode === 'scan' ? (
        <>
          <View style={styles.scannerSection}>
            {!permission.granted ? (
              <View style={styles.cameraPlaceholder}>
                <Text style={styles.cameraPlaceholderText}>Cần quyền camera để quét mã</Text>
                <TouchableOpacity style={styles.permitBtn} onPress={requestPermission}>
                  <Text style={styles.permitBtnText}>Cấp quyền</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <CameraView
                style={styles.camera}
                facing="back"
                enableTorch={torch}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              >
                <View style={styles.scanOverlay}>
                  <View style={styles.scanFrame}>
                    <View style={[styles.scanCorner, styles.cornerTL]} />
                    <View style={[styles.scanCorner, styles.cornerTR]} />
                    <View style={[styles.scanCorner, styles.cornerBL]} />
                    <View style={[styles.scanCorner, styles.cornerBR]} />
                  </View>
                  <Text style={styles.scanHint}>Đưa mã QR vào khung</Text>
                </View>
              </CameraView>
            )}
          </View>

          <View style={styles.resultSection}>
            {!scanResult && (
              <View style={styles.resultPlaceholder}>
                <Text style={styles.resultPlaceholderText}>Chờ quét mã QR...</Text>
              </View>
            )}
          </View>

          <Modal visible={showResultModal} transparent animationType="fade" onRequestClose={dismissResult}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalIcon}>
                  {scanResult?.state === 'success' ? '✅' : scanResult?.state === 'already_used' ? '⚠️' : '❌'}
                </Text>
                <Text style={[styles.modalMessage, { color: getResultBg() }]}>{scanResult?.message}</Text>
                {scanResult?.ticket?.fullName && (
                  <Text style={styles.modalName}>{scanResult.ticket.fullName}</Text>
                )}
                {scanResult?.ticket?.ticketType && (
                  <Text style={styles.modalDetail}>🎟️ {scanResult.ticket.ticketType}</Text>
                )}
                {scanResult?.state === 'already_used' && scanResult?.ticket?.checkedInAt && (
                  <Text style={styles.modalDetail}>🕐 Đã check-in lúc {hr(scanResult.ticket.checkedInAt)}{scanResult.ticket.checkedInBy ? ` bởi ${scanResult.ticket.checkedInBy}` : ''}</Text>
                )}
                <TouchableOpacity style={[styles.modalOkBtn, { backgroundColor: getResultBg() }]} onPress={dismissResult}>
                  <Text style={styles.modalOkBtnText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <TouchableOpacity style={styles.modeSwitch} onPress={() => setMode('manual')}>
            <Text style={styles.modeSwitchText}>🔍 Không quét được? Tra cứu thủ công</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.manualSection}>
          <View style={styles.manualHeader}>
            <Text style={styles.manualTitle}>Tra cứu thủ công</Text>
            <TouchableOpacity onPress={() => { setMode('scan'); setManualResults([]); setManualQuery('') }}>
              <Text style={styles.manualBack}>← Quét QR</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.manualSearchRow}>
            <TextInput
              style={styles.manualInput}
              placeholder="Email, tên hoặc mã đơn..."
              placeholderTextColor="#9ca3af"
              value={manualQuery}
              onChangeText={setManualQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.manualSearchBtn} onPress={handleManualSearch} disabled={searching}>
              {searching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.manualSearchBtnText}>Tìm</Text>}
            </TouchableOpacity>
          </View>

          {manualResults.length > 0 && (
            <View style={styles.manualResults}>
              <Text style={styles.manualResultsTitle}>Kết quả ({manualResults.length})</Text>
              {manualResults.map((ticket: any) => {
                const alreadyChecked = ticket.status === 'CHECKED_IN'
                return (
                  <View key={ticket.id} style={[styles.manualCard, alreadyChecked && styles.manualCardDone]}>
                    <View style={styles.manualCardInfo}>
                      <Text style={styles.manualCardName}>{ticket.user?.fullName || 'Không tên'}</Text>
                      <Text style={styles.manualCardType}>🎟️ {ticket.ticketType?.name || 'Vé'}</Text>
                      {ticket.ticketType?.event?.title && (
                        <Text style={styles.manualCardEvent}>📅 {ticket.ticketType.event.title}</Text>
                      )}
                      <Text style={[styles.manualCardStatus, { color: alreadyChecked ? '#dc2626' : '#059669' }]}>
                        {alreadyChecked ? '✅ Đã check-in' : '⏳ Chưa sử dụng'}
                      </Text>
                    </View>
                    {!alreadyChecked && (
                      <TouchableOpacity style={styles.manualCheckinBtn} onPress={() => handleManualCheckIn(ticket.id)}>
                        <Text style={styles.manualCheckinBtnText}>Check-in</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )
              })}
            </View>
          )}

          {manualQuery && manualResults.length === 0 && !searching && (
            <View style={styles.manualEmpty}>
              <Text style={styles.manualEmptyText}>Không tìm thấy kết quả</Text>
            </View>
          )}
        </View>
      )}
    </View>
  )
}

const SCAN_SIZE = 220

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },

  flashOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 50 },

  header: {
    backgroundColor: '#059669', paddingTop: Platform.OS === 'ios' ? 52 : 36, paddingBottom: 12, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', zIndex: 60,
  },
  backBtn: { fontSize: 14, color: '#fff', fontWeight: '500', marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  torchBtn: { fontSize: 20, padding: 4 },
  historyBtn: { padding: 4, marginRight: 4 },
  historyBtnText: { fontSize: 18 },
  syncBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  syncBtnText: { fontSize: 13, color: '#fff', fontWeight: '600' },

  scannerSection: { height: 280, overflow: 'hidden' },
  camera: { flex: 1 },
  cameraPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1f2937' },
  cameraPlaceholderText: { fontSize: 15, color: '#9ca3af', marginBottom: 12 },
  permitBtn: { backgroundColor: '#059669', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  permitBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  scanFrame: { width: SCAN_SIZE, height: SCAN_SIZE, position: 'relative' },
  scanCorner: { position: 'absolute', width: 28, height: 28, borderColor: '#fff' },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 4 },
  scanHint: { color: '#fff', fontSize: 13, marginTop: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },

  resultSection: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1f2937', minHeight: 80 },
  resultPlaceholder: { alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  resultPlaceholderText: { fontSize: 14, color: '#6b7280' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 28, alignItems: 'center', width: '100%', maxWidth: 320 },
  modalIcon: { fontSize: 56, marginBottom: 12 },
  modalMessage: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  modalName: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 8, textAlign: 'center' },
  modalDetail: { fontSize: 14, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  modalOkBtn: { borderRadius: 10, paddingHorizontal: 40, paddingVertical: 12, marginTop: 20, minWidth: 120, alignItems: 'center' },
  modalOkBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  modeSwitch: { backgroundColor: '#374151', paddingVertical: 10, alignItems: 'center' },
  modeSwitchText: { color: '#60a5fa', fontSize: 14, fontWeight: '500' },

  manualSection: { backgroundColor: '#fff', padding: 16, flex: 1 },
  manualHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  manualTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  manualBack: { fontSize: 14, color: '#059669', fontWeight: '500' },
  manualSearchRow: { flexDirection: 'row', gap: 8 },
  manualInput: { flex: 1, backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827' },
  manualSearchBtn: { backgroundColor: '#059669', borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  manualSearchBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  manualResults: { marginTop: 12 },
  manualResultsTitle: { fontSize: 13, fontWeight: '600', color: '#6b7280', marginBottom: 8 },
  manualCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 6, borderWidth: 1, borderColor: '#e5e7eb' },
  manualCardDone: { opacity: 0.6 },
  manualCardInfo: { flex: 1 },
  manualCardName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  manualCardType: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  manualCardEvent: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  manualCardStatus: { fontSize: 12, fontWeight: '500', marginTop: 2 },
  manualCheckinBtn: { backgroundColor: '#059669', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  manualCheckinBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  manualEmpty: { alignItems: 'center', marginTop: 20 },
  manualEmptyText: { fontSize: 14, color: '#9ca3af' },
  ticketCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 10, marginBottom: 6, borderWidth: 1, borderColor: '#f3f4f6' },
  ticketDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  ticketInfo: { flex: 1 },
  ticketTicketType: { fontSize: 13, fontWeight: '600', color: '#111827' },
  ticketOwner: { fontSize: 12, color: '#6b7280', marginTop: 1 },
  ticketEvent: { fontSize: 11, color: '#9ca3af', marginTop: 1 },
  ticketTime: { fontSize: 11, color: '#059669', marginTop: 1 },
})
