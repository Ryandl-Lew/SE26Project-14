import { create } from 'zustand'
import * as authApi from '@/api/auth'

function saveToken(token) {
  localStorage.setItem('auth_token', token)
}

function clearSession() {
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
}

export const useAuthStore = create((set) => ({
  /** @type {{ id: string, name: string, email: string, avatarText: string } | null} */
  currentUser: null,
  /** @type {string | null} */
  token: null,
  /** 是否正在加载会话恢复 */
  loading: true,

  restoreSession: async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      set({ currentUser: null, token: null, loading: false })
      return
    }
    try {
      const user = await authApi.getCurrentUser()
      localStorage.setItem('auth_user', JSON.stringify(user))
      set({ currentUser: user, token, loading: false })
    } catch {
      clearSession()
      set({ currentUser: null, token: null, loading: false })
    }
  },

  login: async (credentials) => {
    const response = await authApi.login(credentials)
    saveToken(response.token)
    localStorage.setItem('auth_user', JSON.stringify(response.user))
    set({ currentUser: response.user, token: response.token })
  },

  register: async (account) => {
    await authApi.register(account)
    const response = await authApi.login({
      identifier: account.username,
      password: account.password,
    })
    saveToken(response.token)
    localStorage.setItem('auth_user', JSON.stringify(response.user))
    set({ currentUser: response.user, token: response.token })
  },

  logout: async () => {
    try {
      await authApi.logout()
    } catch {
      // ignore logout errors
    }
    clearSession()
    set({ currentUser: null, token: null })
  },
}))
