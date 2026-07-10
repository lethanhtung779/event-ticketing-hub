import { create } from 'zustand'
import type { User } from '@/types'
import { userApi } from '@/lib/api'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  login: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
  hydrate: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, isAuthenticated: true, isLoading: false })
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false, isLoading: false })
  },

  hydrate: () => {
    try {
      const token = localStorage.getItem('access_token')
      if (token) {
        userApi.getProfile()
          .then((res) => {
            const user = res.data as User
            localStorage.setItem('user', JSON.stringify(user))
            set({ user, isAuthenticated: true, isLoading: false })
          })
          .catch(() => {
            const userStr = localStorage.getItem('user')
            if (userStr) {
              const user = JSON.parse(userStr) as User
              set({ user, isAuthenticated: true, isLoading: false })
            } else {
              set({ isLoading: false })
            }
          })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },
}))
