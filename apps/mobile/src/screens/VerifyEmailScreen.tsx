import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native'
import axios from 'axios'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

export default function VerifyEmailScreen({ navigation }: any) {
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleVerify = async () => {
    if (!token.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập token xác thực từ email'); return }
    setLoading(true)
    try {
      await axios.get(`${API_BASE_URL}/auth/verify-email`, { params: { token: token.trim() } })
      setDone(true)
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Token không hợp lệ hoặc đã hết hạn')
    } finally { setLoading(false) }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← Quay lại</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Xác thực email</Text>
      </View>

      {done ? (
        <View style={styles.center}>
          <Text style={styles.icon}>✅</Text>
          <Text style={styles.successTitle}>Xác thực thành công!</Text>
          <Text style={styles.successDesc}>Email của bạn đã được xác thực.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
            <Text style={styles.btnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.icon}>📧</Text>
          <Text style={styles.title}>Xác thực email</Text>
          <Text style={styles.desc}>
            Mở email xác thực từ ứng dụng, sao chép mã xác thực (token) và dán vào bên dưới.
          </Text>

          <Text style={styles.label}>Mã xác thực (token)</Text>
          <TextInput
            style={styles.input}
            placeholder="Dán token từ email..."
            placeholderTextColor="#9ca3af"
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
          />

          <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Xác thực</Text>}
          </TouchableOpacity>

          <Text style={styles.hint}>
            Token là đoạn mã dài trong link xác thực được gửi đến email của bạn.
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#059669', paddingTop: Platform.OS === 'ios' ? 52 : 36, paddingBottom: 12, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  backBtn: { fontSize: 14, color: '#fff', fontWeight: '500', marginRight: 12 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  content: { padding: 24, alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', marginBottom: 8 },
  desc: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', alignSelf: 'flex-start', marginBottom: 6 },
  input: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', minHeight: 80, textAlignVertical: 'top' },
  btn: { backgroundColor: '#059669', borderRadius: 12, paddingHorizontal: 32, paddingVertical: 14, marginTop: 16, minWidth: 160, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  successTitle: { fontSize: 20, fontWeight: '700', color: '#059669', marginBottom: 8 },
  successDesc: { fontSize: 14, color: '#6b7280', marginBottom: 24 },
  hint: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 20, lineHeight: 18 },
})
