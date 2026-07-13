import { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { subscribe, getUnreadCount } from '../stores/notification'

export default function NotificationBell({ onPress }: { onPress: () => void }) {
  const [count, setCount] = useState(getUnreadCount())

  useEffect(() => {
    const unsub = subscribe(() => setCount(getUnreadCount()))
    return unsub
  }, [])

  return (
    <TouchableOpacity onPress={onPress} style={styles.bell} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Text style={styles.icon}>🔔</Text>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  bell: { padding: 4, position: 'relative' },
  icon: { fontSize: 22 },
  badge: {
    position: 'absolute', top: -2, right: -4,
    backgroundColor: '#ef4444', borderRadius: 10,
    minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
})
