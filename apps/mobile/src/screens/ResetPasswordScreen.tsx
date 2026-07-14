import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { authApi } from '../api/client'
import { useTranslation } from 'react-i18next'

export default function ResetPasswordScreen({ navigation }: any) {
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()

  const handleReset = async () => {
    if (!token.trim() || !newPassword.trim()) { Alert.alert('Lỗi', t('auth.enterAllFields')); return }
    if (newPassword.length < 6) { Alert.alert('Lỗi', t('auth.passwordMin')); return }
    setLoading(true)
    try {
      await authApi.resetPassword({ token: token.trim(), newPassword })
      Alert.alert(t('common.success'), t('auth.resetPwSuccess'), [
        { text: t('auth.login'), onPress: () => navigation.navigate('Login') },
      ])
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || t('common.error'))
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.topSection}>
          <Text style={styles.badge}>🎫 TicketHub</Text>
          <Text style={styles.title}>{t('auth.resetPassword')}</Text>
          <Text style={styles.subtitle}>{t('auth.resetPwDesc')}</Text>
        </View>

        <TextInput style={styles.input} placeholder={t('auth.tokenPlaceholder')} placeholderTextColor="#9ca3af" value={token} onChangeText={setToken} autoCapitalize="none" />
        <TextInput style={styles.input} placeholder={t('auth.newPasswordPlaceholder')} placeholderTextColor="#9ca3af" value={newPassword} onChangeText={setNewPassword} secureTextEntry />

        <TouchableOpacity style={styles.resetBtn} onPress={handleReset} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.resetBtnText}>{t('auth.resetPassword')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkRow}>
          <Text style={styles.linkText}>{t('auth.backToLogin')}</Text>
        </TouchableOpacity>
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
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4, textAlign: 'center' },
  input: { backgroundColor: '#f9fafb', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#111827', marginBottom: 14 },
  resetBtn: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 10 },
  resetBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkRow: { alignItems: 'center', marginTop: 20 },
  linkText: { fontSize: 14, color: '#059669', fontWeight: '500' },
})
