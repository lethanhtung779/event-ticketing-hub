import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useTranslation } from 'react-i18next'

export default function OrganizerTermsScreen({ navigation }: any) {
  const { t } = useTranslation()

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.backBtn}>← {t('common.back')}</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{t('organizer.terms')}</Text>
        <View style={{ width: 60 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.paragraph}>
          1. Với tư cách là nhà tổ chức sự kiện (Organizer), bạn chịu trách nhiệm về mọi thông tin sự kiện đăng tải.
        </Text>
        <Text style={styles.paragraph}>
          2. Doanh thu từ vé bán ra sẽ được chuyển khoản theo định kỳ sau khi sự kiện kết thúc, trừ phí nền tảng.
        </Text>
        <Text style={styles.paragraph}>
          3. Bạn có trách nhiệm hỗ trợ người mua vé trong trường hợp sự kiện thay đổi hoặc bị huỷ bỏ.
        </Text>
        <Text style={styles.paragraph}>
          4. Mọi hành vi gian lận, đăng tải thông tin sai lệch có thể dẫn đến khoá tài khoản vĩnh viễn.
        </Text>
        <Text style={styles.paragraph}>
          5. TicketHub có quyền từ chối đăng tải hoặc gỡ bỏ sự kiện nếu vi phạm chính sách nền tảng.
        </Text>
        <Text style={styles.paragraph}>
          6. Bạn có thể yêu cầu rút doanh thu bất kỳ lúc nào sau khi sự kiện kết thúc. Thời gian xử lý từ 3-5 ngày làm việc.
        </Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#fff', paddingTop: 52, paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  backBtn: { fontSize: 14, color: '#059669', fontWeight: '500' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  content: { padding: 16 },
  paragraph: { fontSize: 14, color: '#4b5563', lineHeight: 22, marginBottom: 16 },
})
