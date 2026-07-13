import * as SecureStore from 'expo-secure-store'
import type { User } from '../types'

const KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: 'user',
}

let currentUser: User | null = null
let listeners: Array<() => void> = []

export function subscribe(fn: () => void) {
  listeners.push(fn)
  return () => { listeners = listeners.filter((l) => l !== fn) }
}

function notify() {
  listeners.forEach((fn) => fn())
}

export async function hydrate() {
  try {
    const raw = await SecureStore.getItemAsync(KEYS.user)
    if (raw) currentUser = JSON.parse(raw)
  } catch {}
  notify()
}

export async function setAuth(data: any) {
  console.log('[AUTH DATA]', JSON.stringify(data).slice(0, 200))
  const access_token = data?.access_token || data?.accessToken || ''
  const refresh_token = data?.refresh_token || data?.refreshToken || ''
  const user = data?.user

  if (!access_token || !user) {
    console.log('[AUTH ERROR] Missing fields', { hasAccess: !!access_token, hasUser: !!user })
    throw new Error('Phản hồi đăng nhập không hợp lệ')
  }

  currentUser = user
  await SecureStore.setItemAsync(KEYS.accessToken, access_token)
  await SecureStore.setItemAsync(KEYS.refreshToken, refresh_token)
  await SecureStore.setItemAsync(KEYS.user, JSON.stringify(user))
  notify()
}

export async function logout() {
  currentUser = null
  await SecureStore.deleteItemAsync(KEYS.accessToken)
  await SecureStore.deleteItemAsync(KEYS.refreshToken)
  await SecureStore.deleteItemAsync(KEYS.user)
  notify()
}

export function getUser() {
  return currentUser
}

export { SecureStore }
