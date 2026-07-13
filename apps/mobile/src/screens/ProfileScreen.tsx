import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, Modal, TextInput, ActivityIndicator, ScrollView, Image } from 'react-native'
import { getUser, logout, SecureStore } from '../stores/auth'
import { userApi, authApi, ticketApi, followApi } from '../api/client'
import { File, Paths } from 'expo-file-system'
import LanguageSwitcher from '../components/LanguageSwitcher'
import type { User, Order } from '../types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

function bu(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

function fc(amount: number) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount) }
function fd(date: string) { const d = new Date(date); return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}` }

export default function ProfileScreen({ navigation }: any) {
  const [user, setUser] = useState<User | null>(getUser())
  const [stats, setStats] = useState({ tickets: 0, orders: 0 })
  const [editModal, setEditModal] = useState(false)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwModal, setPwModal] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [showOrders, setShowOrders] = useState(false)
  const [followedOrgs, setFollowedOrgs] = useState<any[]>([])
  const [showFollows, setShowFollows] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [googleAvatar, setGoogleAvatar] = useState<string | null>(null)

  useEffect(() => {
    const u = getUser()
    setUser(u)
    SecureStore.getItemAsync('google_avatar').then((url) => setGoogleAvatar(url)).catch(() => {})
    if (u) {
      userApi.getProfile().then(({ data }) => setUser(data)).catch(() => {})
      Promise.all([
        ticketApi.getMyTickets(),
        userApi.getMyOrders(),
        followApi.getMyFollows(),
      ]).then(([tRes, oRes, fRes]) => {
        const tickets = tRes.data
        const orders = oRes.data
        const follows = fRes.data
        setStats({
          tickets: Array.isArray(tickets) ? tickets.length : tickets?.data?.length ?? 0,
          orders: Array.isArray(orders) ? orders.length : orders?.data?.length ?? 0,
        })
        setMyOrders(Array.isArray(orders) ? orders : orders?.data ?? [])
        setFollowedOrgs(Array.isArray(follows) ? follows : follows?.data ?? [])
      }).catch(() => {})
    }
  }, [])

  const handleSaveName = async () => {
    if (!editName.trim()) { Alert.alert('Lỗi', 'Vui lòng nhập tên'); return }
    setSaving(true)
    try {
      await userApi.updateProfile({ fullName: editName.trim() })
      const { data } = await userApi.getProfile()
      setUser(data)
      setEditModal(false)
      Alert.alert('Thành công', 'Đã cập nhật thông tin')
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Cập nhật thất bại')
    } finally { setSaving(false) }
  }

  const handleChangePw = async () => {
    if (!currentPw || !newPw) { Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ'); return }
    if (newPw.length < 6) { Alert.alert('Lỗi', 'Mật khẩu mới phải có ít nhất 6 ký tự'); return }
    setChangingPw(true)
    try {
      await authApi.changePassword({ currentPassword: currentPw, newPassword: newPw })
      setPwModal(false)
      setCurrentPw(''); setNewPw('')
      Alert.alert('Thành công', 'Đã đổi mật khẩu')
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Đổi mật khẩu thất bại')
    } finally { setChangingPw(false) }
  }

  const handleVerifyEmail = async () => {
    setVerifying(true)
    try {
      await authApi.sendVerification()
      Alert.alert('Đã gửi', 'Vui lòng kiểm tra email, sao chép mã xác thực và dán vào màn hình tiếp theo', [
        { text: 'Nhập mã xác thực', onPress: () => navigation.navigate('VerifyEmail') },
        { text: 'Để sau' },
      ])
    } catch (err: any) {
      Alert.alert('Lỗi', err?.response?.data?.message || 'Gửi email xác thực thất bại')
    } finally { setVerifying(false) }
  }

  const handleUnfollow = async (orgId: string) => {
    try {
      await followApi.unfollow(orgId)
      setFollowedOrgs((prev) => prev.filter((o: any) => o.id !== orgId))
    } catch { Alert.alert('Lỗi', 'Bỏ theo dõi thất bại') }
  }

  const handleChangeAvatar = async () => {
    try {
      const picked = await File.pickFileAsync({ mimeTypes: ['image/png', 'image/jpeg'] })
      if (!picked) return
      setUploadingAvatar(true)
      await userApi.updateAvatar(picked.uri)
      const { data } = await userApi.getProfile()
      setUser(data)
      Alert.alert('Thành công', 'Đã cập nhật ảnh đại diện')
    } catch (err: any) {
      if (err?.message?.includes('cancel')) return
      Alert.alert('Lỗi', err?.response?.data?.message || 'Cập nhật ảnh thất bại')
    } finally { setUploadingAvatar(false) }
  }

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Huỷ', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: () => { logout() } },
    ])
  }

  if (!user) return null

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleChangeAvatar} disabled={uploadingAvatar} style={styles.avatarWrap}>
          {user.avatar ? (
            <Image source={{ uri: bu(user.avatar)! }} style={styles.avatarImage} />
          ) : googleAvatar ? (
            <Image source={{ uri: googleAvatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.fullName.charAt(0)}</Text>
            </View>
          )}
          <View style={styles.avatarOverlay}>
            <Text style={styles.avatarOverlayIcon}>{uploadingAvatar ? '⏳' : '📷'}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user.fullName}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={styles.verifyRow}>
          {user.isVerified ? (
            <Text style={styles.verifiedBadge}>✅ Đã xác thực</Text>
          ) : (
            <TouchableOpacity onPress={handleVerifyEmail} disabled={verifying}>
              <Text style={styles.verifyLink}>{verifying ? 'Đang gửi...' : '🔴 Xác thực email'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.tickets}</Text>
          <Text style={styles.statLabel}>Vé</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.orders}</Text>
          <Text style={styles.statLabel}>Đơn hàng</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => { setEditName(user.fullName); setEditModal(true) }}>
          <Text style={styles.menuIcon}>✏️</Text>
          <Text style={styles.menuText}>Sửa thông tin cá nhân</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setPwModal(true)}>
          <Text style={styles.menuIcon}>🔑</Text>
          <Text style={styles.menuText}>Đổi mật khẩu</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        {user.role === 'STAFF' && (
            <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('StaffCheckin')}>
            <Text style={styles.menuIcon}>📱</Text>
            <Text style={styles.menuText}>Quét vé check-in</Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('OrganizerHome')}>
          <Text style={styles.menuIcon}>📢</Text>
          <Text style={styles.menuText}>Organizer Dashboard</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setShowOrders(!showOrders)}>
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuText}>Lịch sử đơn hàng</Text>
          <Text style={styles.menuArrow}>{showOrders ? 'v' : '›'}</Text>
        </TouchableOpacity>
        {showOrders && (
          <View style={styles.subList}>
            {myOrders.length === 0 ? (
              <Text style={styles.emptyText}>Chưa có đơn hàng nào</Text>
            ) : (
              myOrders.map((o) => (
                <View key={o.id} style={styles.orderCard}>
                  <View>
                    <Text style={styles.orderId}>Đơn #{o.id.slice(0, 8)}</Text>
                    <Text style={styles.orderDate}>{fd(o.createdAt)}</Text>
                    <Text style={styles.orderStatus}>{o.status === 'PAID' ? '✅ Đã thanh toán' : o.status === 'PENDING' ? '💳 Chờ thanh toán' : o.status === 'CANCELLED' ? '❌ Đã huỷ' : '🔄 Đã hoàn tiền'}</Text>
                  </View>
                  <Text style={styles.orderAmount}>{fc(o.finalAmount)}</Text>
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => setShowFollows(!showFollows)}>
          <Text style={styles.menuIcon}>👥</Text>
          <Text style={styles.menuText}>Đang theo dõi ({followedOrgs.length})</Text>
          <Text style={styles.menuArrow}>{showFollows ? 'v' : '›'}</Text>
        </TouchableOpacity>
        {showFollows && (
          <View style={styles.subList}>
            {followedOrgs.length === 0 ? (
              <Text style={styles.emptyText}>Chưa theo dõi tổ chức nào</Text>
            ) : (
              followedOrgs.map((org: any) => (
                <View key={org.id} style={styles.followCard}>
                  <View style={styles.followAvatar}>
                    <Text style={styles.followAvatarText}>{org.name?.charAt(0) || '?'}</Text>
                  </View>
                  <Text style={styles.followName}>{org.name}</Text>
                  <TouchableOpacity onPress={() => handleUnfollow(org.id)}>
                    <Text style={styles.unfollowText}>Bỏ theo dõi</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Main', { screen: 'Vé của tôi' })}>
          <Text style={styles.menuIcon}>🎫</Text>
          <Text style={styles.menuText}>Vé của tôi</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <View style={[styles.menuItem, { flexDirection: 'column', alignItems: 'stretch' }]}>
          <Text style={[styles.menuText, { marginBottom: 10 }]}>🌐 Ngôn ngữ / Language</Text>
          <LanguageSwitcher />
        </View>

        <TouchableOpacity style={[styles.menuItem, styles.logoutItem]} onPress={handleLogout}>
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={[styles.menuText, { color: '#ef4444' }]}>Đăng xuất</Text>
          <Text style={[styles.menuArrow, { color: '#ef4444' }]}>›</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={editModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Sửa thông tin</Text>
            <TextInput style={styles.modalInput} placeholder="Họ và tên" placeholderTextColor="#9ca3af" value={editName} onChangeText={setEditName} />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setEditModal(false)}><Text style={styles.modalCancelText}>Huỷ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleSaveName} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Lưu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={pwModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
            <TextInput style={styles.modalInput} placeholder="Mật khẩu hiện tại" placeholderTextColor="#9ca3af" value={currentPw} onChangeText={setCurrentPw} secureTextEntry />
            <TextInput style={styles.modalInput} placeholder="Mật khẩu mới (6+ ký tự)" placeholderTextColor="#9ca3af" value={newPw} onChangeText={setNewPw} secureTextEntry />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setPwModal(false)}><Text style={styles.modalCancelText}>Huỷ</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSubmit} onPress={handleChangePw} disabled={changingPw}>
                {changingPw ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSubmitText}>Đổi mật khẩu</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#059669', paddingTop: 60, paddingBottom: 24, alignItems: 'center' },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, marginBottom: 12, position: 'relative' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarOverlay: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: '#059669', borderRadius: 14,
    width: 28, height: 28, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarOverlayIcon: { fontSize: 12, color: '#fff' },
  avatarText: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  verifyRow: { marginTop: 8 },
  verifiedBadge: { fontSize: 13, color: '#bbf7d0', fontWeight: '500' },
  verifyLink: { fontSize: 13, color: '#fbbf24', fontWeight: '500' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -16, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statItem: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, backgroundColor: '#e5e7eb' },
  statNumber: { fontSize: 22, fontWeight: 'bold', color: '#059669' },
  statLabel: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  menu: { marginTop: 24, marginHorizontal: 16, marginBottom: 40 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  menuIcon: { fontSize: 16, marginRight: 12 },
  menuText: { fontSize: 15, color: '#374151', fontWeight: '500', flex: 1 },
  menuArrow: { fontSize: 18, color: '#9ca3af' },
  logoutItem: { borderWidth: 1, borderColor: '#fecaca' },
  subList: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, marginTop: -4 },
  emptyText: { fontSize: 14, color: '#9ca3af', textAlign: 'center', padding: 12 },
  orderCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  orderId: { fontSize: 13, fontWeight: '600', color: '#111827' },
  orderDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  orderStatus: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  orderAmount: { fontSize: 15, fontWeight: '700', color: '#059669' },
  followCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 10 },
  followAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#d1fae5', justifyContent: 'center', alignItems: 'center' },
  followAvatarText: { fontSize: 16, fontWeight: '700', color: '#059669' },
  followName: { flex: 1, fontSize: 14, fontWeight: '500', color: '#111827' },
  unfollowText: { fontSize: 12, color: '#ef4444', fontWeight: '500' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 16 },
  modalInput: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 14, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 14 },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalCancel: { flex: 1, alignItems: 'center', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  modalCancelText: { fontSize: 15, fontWeight: '500', color: '#6b7280' },
  modalSubmit: { flex: 1, backgroundColor: '#059669', borderRadius: 12, padding: 14, alignItems: 'center' },
  modalSubmitText: { color: '#fff', fontSize: 15, fontWeight: '600' },
})
