/**
 * 认证状态管理（Zustand）
 * 管理当前登录用户、token 和登录/登出操作。
 * 登录成功后持久化到 localStorage，刷新页面可恢复会话。
 */
import { create } from 'zustand'
import { login as loginApi, logout as logoutApi } from '@/api/auth'

export const useAuthStore = create((set, get) => ({
  /** @type {{ id: string, name: string, email: string, avatarText: string } | null} */
  currentUser: null,
  /** @type {string | null} */
  token: null,
  /** 是否正在加载会话恢复 */
  loading: true,

  /**
   * 尝试从 localStorage 恢复登录会话
   */
  restoreSession: () => {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('auth_user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ currentUser: user, token, loading: false })
        return
      } catch {
        // ignore
      }
    }
    set({ loading: false })
  },

  /**
   * 登录
   * @param {{ username: string, password: string }} credentials
   */
  login: async (credentials) => {
    const { user, token } = await loginApi(credentials)
    localStorage.setItem('auth_token', token)
    localStorage.setItem('auth_user', JSON.stringify(user))
    set({ currentUser: user, token })
  },

  /**
   * 登出
   */
  logout: async () => {
    try {
      await logoutApi()
    } finally {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      set({ currentUser: null, token: null })
    }
  },
}))
