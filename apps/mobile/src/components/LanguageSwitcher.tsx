import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { changeLanguage } from '../i18n'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language
  const isVI = current === 'vi'

  return (
    <View style={styles.row}>
      <TouchableOpacity style={[styles.option, isVI && styles.optionActive]} onPress={() => changeLanguage('vi')}>
        <Text style={[styles.flag, isVI && styles.flagActive]}>🇻🇳</Text>
        <Text style={[styles.label, isVI && styles.labelActive]}>Tiếng Việt</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.option, !isVI && styles.optionActive]} onPress={() => changeLanguage('en')}>
        <Text style={[styles.flag, !isVI && styles.flagActive]}>🇬🇧</Text>
        <Text style={[styles.label, !isVI && styles.labelActive]}>English</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  option: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff' },
  optionActive: { backgroundColor: '#059669', borderColor: '#059669' },
  flag: { fontSize: 16 },
  flagActive: { opacity: 1 },
  label: { fontSize: 13, fontWeight: '500', color: '#374151' },
  labelActive: { color: '#fff' },
})
