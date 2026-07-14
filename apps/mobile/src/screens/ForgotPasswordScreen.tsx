import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/client'

export default function ForgotPasswordScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSend = async () => {
    if (!email.trim()) { Alert.alert('Lỗi', t('auth.enterEmailAndPassword')); return }
    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || 'Gửi yêu cầu thất bại'
      Alert.alert('Lỗi', Array.isArray(msg) ? msg[0] : msg)
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.content}>
        <Text style={styles.badge}>🎫 TicketHub</Text>
        <Text style={styles.title}>{t('auth.forgotPassword')}</Text>
        <Text style={styles.subtitle}>{t('auth.forgotPwDesc')}</Text>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>✅</Text>
            <Text style={styles.successTitle}>{t('auth.forgotPwSent')}</Text>
            <Text style={styles.successText}>{t('auth.forgotPwSentDesc')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ResetPassword')}>
              <Text style={styles.linkText}>{t('auth.haveToken')}</Text>
            </TouchableOpacity>
            <View style={{ height: 8 }} />
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TextInput style={styles.input} placeholder={t('auth.emailPlaceholder')} placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TouchableOpacity style={styles.btn} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('auth.sendRequest')}</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={styles.linkText}>{t('auth.backToLogin')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  badge: { fontSize: 14, color: '#059669', fontWeight: '600', textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginTop: 4, marginBottom: 32 },
  input: {
    backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', marginBottom: 16,
  },
  btn: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  successBox: { alignItems: 'center', backgroundColor: '#f0fdf4', borderRadius: 16, padding: 24 },
  successIcon: { fontSize: 40, marginBottom: 12 },
  successTitle: { fontSize: 18, fontWeight: '700', color: '#059669', marginBottom: 8 },
  successText: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 16 },
  linkText: { color: '#059669', fontSize: 14, fontWeight: '500', textAlign: 'center' },
})
