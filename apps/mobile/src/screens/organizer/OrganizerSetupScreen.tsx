import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'
import { organizerApi } from '../../api/client'

export default function OrganizerSetupScreen({ navigation }: any) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)

  useEffect(() => {
    organizerApi.getProfile().then(({ data }) => {
      if (data) {
        setName(data.name || '')
        setDescription(data.description || '')
        setPhone(data.phone || '')
        setWebsite(data.website || '')
        setExistingId(data.id)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert(t('common.error'), t('organizer.name') + ' ' + t('common.noData')); return }
    setSaving(true)
    try {
      if (existingId) {
        await organizerApi.updateProfile({ name: name.trim(), description: description.trim(), phone: phone.trim(), website: website.trim() })
      } else {
        await organizerApi.create({ name: name.trim(), description: description.trim(), phone: phone.trim(), website: website.trim() })
      }
      Alert.alert(t('common.success'), t('organizer.saveProfile'))
      navigation.goBack()
    } catch (err: any) {
      Alert.alert(t('common.error'), err?.response?.data?.message || t('common.error'))
    } finally { setSaving(false) }
  }

  if (loading) return <ActivityIndicator size="large" color="#059669" style={{ marginTop: 60 }} />

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← {t('common.back')}</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{existingId ? t('organizer.profile') : t('organizer.setup')}</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.form}>
        <TextInput style={styles.input} placeholder={t('organizer.name')} placeholderTextColor="#9ca3af" value={name} onChangeText={setName} />
        <TextInput style={[styles.input, styles.textArea]} placeholder={t('organizer.description')} placeholderTextColor="#9ca3af" value={description} onChangeText={setDescription} multiline />
        <TextInput style={styles.input} placeholder={t('organizer.phone')} placeholderTextColor="#9ca3af" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={styles.input} placeholder={t('organizer.website')} placeholderTextColor="#9ca3af" value={website} onChangeText={setWebsite} autoCapitalize="none" keyboardType="url" />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t('organizer.saveProfile')}</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { fontSize: 14, color: '#059669', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  form: { padding: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 14 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
