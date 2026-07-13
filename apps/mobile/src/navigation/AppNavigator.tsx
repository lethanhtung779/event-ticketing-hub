import { useState, useEffect } from 'react'
import { NavigationContainer, useNavigation } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { subscribe, hydrate, getUser, SecureStore } from '../stores/auth'
import { connectSocket, disconnectSocket } from '../stores/notification'

import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen'
import ResetPasswordScreen from '../screens/ResetPasswordScreen'
import HomeScreen from '../screens/HomeScreen'
import EventDetailScreen from '../screens/EventDetailScreen'
import TicketDetailScreen from '../screens/TicketDetailScreen'
import MyTicketsScreen from '../screens/MyTicketsScreen'
import WishlistScreen from '../screens/WishlistScreen'
import ProfileScreen from '../screens/ProfileScreen'
import PurchaseScreen from '../screens/PurchaseScreen'
import VnpayWebViewScreen from '../screens/VnpayWebViewScreen'
import SearchScreen from '../screens/SearchScreen'
import VerifyEmailScreen from '../screens/VerifyEmailScreen'
import OrganizerHomeScreen from '../screens/organizer/OrganizerHomeScreen'
import OrganizerSetupScreen from '../screens/organizer/OrganizerSetupScreen'
import OrganizerEventsScreen from '../screens/organizer/OrganizerEventsScreen'
import OrganizerReportsScreen from '../screens/organizer/OrganizerReportsScreen'
import OrganizerTermsScreen from '../screens/organizer/OrganizerTermsScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import NotificationBell from '../components/NotificationBell'
import StaffCheckinScreen from '../screens/staff/StaffCheckinScreen'
import CheckInHistoryScreen from '../screens/staff/CheckInHistoryScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    'Trang chủ': '🏠',
    'Yêu thích': '❤️',
    'Vé của tôi': '🎫',
    'Cá nhân': '👤',
  }
  return (
    <View style={tabStyles.icon}>
      <Text style={tabStyles.emoji}>{icons[label] || '•'}</Text>
    </View>
  )
}

const tabStyles = StyleSheet.create({
  icon: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  emoji: { fontSize: 20 },
})

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 4,
          height: 56,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Trang chủ" component={HomeScreen} />
      <Tab.Screen name="Yêu thích" component={WishlistScreen} />
      <Tab.Screen name="Vé của tôi" component={MyTicketsScreen} />
      <Tab.Screen name="Cá nhân" component={ProfileScreen} />
    </Tab.Navigator>
  )
}

function MainLayout() {
  const navigation = useNavigation()
  return (
    <View style={{ flex: 1 }}>
      <MainTabs />
      <View style={navStyles.bellWrap}>
        <NotificationBell onPress={() => navigation.navigate('Notifications' as never)} />
      </View>
    </View>
  )
}

const navStyles = StyleSheet.create({
  bellWrap: {
    position: 'absolute', top: Platform.OS === 'ios' ? 54 : 8, right: 12, zIndex: 100,
    backgroundColor: '#fff', borderRadius: 20, padding: 6,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },
})

export default function AppNavigator() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(getUser())

  useEffect(() => {
    hydrate().then(() => { setReady(true); setUser(getUser()) })
    const unsub = subscribe(() => {
      const u = getUser()
      setUser(u)
      if (u) {
        SecureStore.getItemAsync('access_token').then((token) => {
          if (token) connectSocket(token)
        })
      } else {
        disconnectSocket()
      }
    })
    return () => { unsub(); disconnectSocket() }
  }, [])

  if (!ready) return null

  return (
    <NavigationContainer>
      {user ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Main" component={MainLayout} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Search" component={SearchScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="StaffCheckin" component={StaffCheckinScreen} options={{ headerShown: false }} />
          <Stack.Screen name="CheckInHistory" component={CheckInHistoryScreen} options={{ headerShown: false }} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: true, headerTitle: '', headerTintColor: '#059669', headerBackTitle: 'Quay lại' }} />
          <Stack.Screen name="TicketDetail" component={TicketDetailScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Purchase" component={PurchaseScreen} options={{ headerShown: false }} />
          <Stack.Screen name="VnpayWebView" component={VnpayWebViewScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OrganizerHome" component={OrganizerHomeScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OrganizerSetup" component={OrganizerSetupScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OrganizerEvents" component={OrganizerEventsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OrganizerReports" component={OrganizerReportsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="OrganizerTerms" component={OrganizerTermsScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  )
}
