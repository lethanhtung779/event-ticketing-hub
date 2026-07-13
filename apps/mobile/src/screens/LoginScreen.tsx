import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { authApi, userApi } from '../api/client'
import { setAuth, SecureStore } from '../stores/auth'

WebBrowser.maybeCompleteAuthSession()

const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '1019091092463-qo4fa6upu1sfpbrlrhj5eqc3e3t4ed6v.apps.googleusercontent.com'

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const [request, response, googlePrompt] = Google.useIdTokenAuthRequest(
    {
      androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    },
    {
      native: 'com.googleusercontent.apps.1019091092463-qo4fa6upu1sfpbrlrhj5eqc3e3t4ed6v:/oauth2redirect',
    }
  )

  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null)

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params
      if (!id_token) {
        console.warn('[Google] Missing id_token in success response')
        Alert.alert('Lỗi', 'Không nhận được token từ Google')
        return
      }
      try {
        const payload = JSON.parse(atob(id_token.split('.')[1]))
        if (payload.picture) {
          setGoogleAvatar(payload.picture)
          SecureStore.setItemAsync('google_avatar', payload.picture)
        }
      } catch {}
      authApi.googleLogin(id_token).then(async (res) => {
        const tokens = res.data as { access_token: string; refresh_token: string }
        await SecureStore.setItemAsync('access_token', tokens.access_token)
        await SecureStore.setItemAsync('refresh_token', tokens.refresh_token)
        const profileRes = await userApi.getProfile()
        await setAuth({ user: profileRes.data, ...tokens })
      }).catch((err: any) => {
        const msg = err?.response?.data?.message || err.message || 'Đăng nhập Google thất bại'
        console.warn('[Google] API error:', msg)
        Alert.alert('Lỗi', Array.isArray(msg) ? msg[0] : msg)
      })
    } else if (response?.type === 'error') {
      console.warn('[Google] OAuth error:', response.params?.error_description)
      console.warn('[Google] Error details:', JSON.stringify(response))
      Alert.alert('Lỗi', response.error?.description || response.params?.error_description || 'Đăng nhập Google thất bại')
    } else if (response?.type === 'cancel') {
      console.log('[Google] User cancelled Google login')
    } else if (response) {
      console.log('[Google] Unhandled response type:', response.type)
    }
  }, [response])

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu'); return }
    setLoading(true)
    try {
      const loginRes = await authApi.login(email.trim(), password)
      const tokens = loginRes.data as { access_token: string; refresh_token: string }
      await SecureStore.setItemAsync('access_token', tokens.access_token)
      await SecureStore.setItemAsync('refresh_token', tokens.refresh_token)
      const profileRes = await userApi.getProfile()
      await setAuth({ user: profileRes.data, ...tokens })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Đăng nhập thất bại'
      Alert.alert('Lỗi', Array.isArray(msg) ? msg[0] : msg)
    } finally { setLoading(false) }
  }

  const handleGoogle = async () => {
    await googlePrompt()
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topSection}>
          <Text style={styles.badge}>🎫 TicketHub</Text>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng bạn trở lại!</Text>
        </View>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <View style={styles.pwRow}>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Mật khẩu" placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Text>{showPw ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
            <Text style={styles.forgotText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Đăng nhập</Text>}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>HOẶC</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleBtn} onPress={handleGoogle}>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleBtnText}>Đăng nhập với Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.linkRow}>
            <Text style={styles.linkText}>Chưa có tài khoản? <Text style={styles.linkHighlight}>Đăng ký</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  topSection: { paddingTop: 80, alignItems: 'center', marginBottom: 40 },
  badge: { fontSize: 14, color: '#059669', fontWeight: '600', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  form: { flex: 1 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', marginBottom: 14,
  },
  pwRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  eyeBtn: { position: 'absolute', right: 14, padding: 4 },
  forgotRow: { alignItems: 'flex-end', marginBottom: 20 },
  forgotText: { color: '#059669', fontSize: 14, fontWeight: '500' },
  loginBtn: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 24 },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { marginHorizontal: 12, fontSize: 12, color: '#9ca3af', fontWeight: '500' },
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingVertical: 14, marginBottom: 24,
  },
  googleIcon: { fontSize: 20, fontWeight: '700', color: '#ea4335', marginRight: 10 },
  googleBtnText: { fontSize: 15, fontWeight: '500', color: '#374151' },
  linkRow: { alignItems: 'center' },
  linkText: { fontSize: 14, color: '#6b7280' },
  linkHighlight: { color: '#059669', fontWeight: '600' },
})
