import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { WebView } from 'react-native-webview'
import { paymentApi } from '../api/client'

export default function VnpayWebViewScreen({ route, navigation }: any) {
  const { payUrl, orderId, eventTitle } = route.params
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)
  const [webError, setWebError] = useState<string | null>(null)
  const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const webViewRef = useRef<WebView>(null)

  const done = useCallback((success: boolean) => {
    if (finished) return
    setFinished(true)
    if (success) {
      Alert.alert('Thanh toán thành công', 'Vé của bạn đã được kích hoạt!', [
        { text: 'Xem vé của tôi', onPress: () => navigation.navigate('Main', { screen: 'Vé của tôi' }) },
      ])
    } else {
      Alert.alert('Thanh toán thất bại', 'Vui lòng thử lại hoặc kiểm tra tài khoản.', [
        { text: 'Quay lại', onPress: () => navigation.goBack() },
      ])
    }
  }, [finished, navigation])

  useEffect(() => {
    if (!orderId || finished) return
    let attempts = 0
    const iv = setInterval(async () => {
      attempts++
      try {
        const { data } = await paymentApi.verifyVnpay(orderId)
        if ((data as any).paid) {
          clearInterval(iv)
          done(true)
        }
      } catch {}
      if (attempts >= 60) clearInterval(iv)
    }, 3000)
    return () => clearInterval(iv)
  }, [orderId, finished, done])

  const handleNavigationChange = async (navState: any) => {
    const { url } = navState
    if (finished) return

    if (url.includes('vnp_ResponseCode')) {
      setFinished(true)
      try {
        const params = Object.fromEntries(new URL(url).searchParams)
        const { data } = await paymentApi.mobileReturn(params)
        done((data as any).success)
      } catch {
        done(false)
      }
      return
    }

    if (url.includes('payment=success') || url.includes('payment=failure')) {
      const success = url.includes('payment=success')
      setFinished(true)
      done(success)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Đóng</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{eventTitle || 'Thanh toán VNPay'}</Text>
        <View style={{ width: 50 }} />
      </View>

      {loading && !webError && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Đang kết nối cổng thanh toán...</Text>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ uri: payUrl }}
        style={styles.webview}
        onLoadEnd={() => {
          setLoading(false)
          if (errorTimer.current) clearTimeout(errorTimer.current)
          setWebError(null)
        }}
        onNavigationStateChange={handleNavigationChange}
        onError={(e) => {
          if (!errorTimer.current) {
            errorTimer.current = setTimeout(() => {
              setWebError(e.nativeEvent.description)
            }, 5000)
          }
        }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
      />

      {webError && !finished && (
        <View style={styles.errorOverlay}>
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Không thể tải cổng thanh toán</Text>
            <Text style={styles.errorDesc}>{webError}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setWebError(null); setLoading(true); errorTimer.current = null; webViewRef.current?.reload() }}>
              <Text style={styles.retryBtnText}>Thử lại</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.retryBtn, { backgroundColor: '#6b7280', marginTop: 8 }]} onPress={() => navigation.goBack()}>
              <Text style={styles.retryBtnText}>Quay lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { backgroundColor: '#fff', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { fontSize: 14, color: '#059669', fontWeight: '500' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  webview: { flex: 1 },
  loadingOverlay: { position: 'absolute', top: 52, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', zIndex: 10 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6b7280' },
  errorOverlay: { position: 'absolute', top: 52, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.95)', zIndex: 20, padding: 24 },
  errorCard: { backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: '#ef4444', marginBottom: 8 },
  errorDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, width: '100%', alignItems: 'center' },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  pollInfo: { position: 'absolute', bottom: 20, left: 20, right: 20, alignItems: 'center' },
  pollText: { fontSize: 12, color: '#9ca3af' },
})
