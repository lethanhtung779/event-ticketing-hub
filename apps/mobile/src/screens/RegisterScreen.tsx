import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { authApi } from '../api/client'

export default function RegisterScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Lỗi', t('auth.enterAllFields'))
      return
    }
    if (password.length < 6) { Alert.alert('Lỗi', t('auth.passwordMin')); return }
    if (password !== confirm) { Alert.alert('Lỗi', t('auth.passwordConfirmMismatch')); return }
    setLoading(true)
    try {
      await authApi.register({ fullName: fullName.trim(), email: email.trim(), password })
      Alert.alert(t('common.success'), t('auth.registerSuccess'), [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ])
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message || t('auth.registerFailed')
      Alert.alert('Lỗi', Array.isArray(msg) ? msg[0] : msg)
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topSection}>
          <Text style={styles.badge}>🎫 TicketHub</Text>
          <Text style={styles.title}>{t('auth.register')}</Text>
          <Text style={styles.subtitle}>{t('auth.createAccount')}</Text>
        </View>

        <View style={styles.form}>
          <TextInput style={styles.input} placeholder={t('auth.fullNamePlaceholder')} placeholderTextColor="#9ca3af" value={fullName} onChangeText={setFullName} />
          <TextInput style={styles.input} placeholder={t('auth.emailPlaceholder')} placeholderTextColor="#9ca3af" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <View style={styles.pwRow}>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder={t('auth.passwordPlaceholder')} placeholderTextColor="#9ca3af" value={password} onChangeText={setPassword} secureTextEntry={!showPw} />
            <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
              <Text>{showPw ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.input} placeholder={t('auth.confirmPasswordPlaceholder')} placeholderTextColor="#9ca3af" value={confirm} onChangeText={setConfirm} secureTextEntry={!showPw} />

          <Text style={styles.legal}>{t('auth.terms')}</Text>

          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerBtnText}>{t('auth.register')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkRow}>
            <Text style={styles.linkText}>{t('auth.hasAccount')} <Text style={styles.linkHighlight}>{t('auth.login')}</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  topSection: { paddingTop: 80, alignItems: 'center', marginBottom: 32 },
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
  legal: { fontSize: 12, color: '#9ca3af', textAlign: 'center', lineHeight: 18, marginBottom: 20 },
  legalLink: { color: '#059669', fontWeight: '500' },
  registerBtn: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginBottom: 20 },
  registerBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkRow: { alignItems: 'center' },
  linkText: { fontSize: 14, color: '#6b7280' },
  linkHighlight: { color: '#059669', fontWeight: '600' },
})
