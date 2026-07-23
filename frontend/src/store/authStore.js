/**
 * 静态原型认证状态管理（Zustand）
 *
 * 当前前端用于界面原型预览，不连接后端认证接口。登录信息仅保存在
 * localStorage 中，方便刷新页面后继续浏览。后续接回真实后端时，可将
 * login / register / logout / restoreSession 替换回 src/api/auth.js 的实现。
 */
import { create } from 'zustand'

const DEMO_PASSWORD = '123456'
const STATIC_TOKEN = 'bionote-static-demo-token'

const DEMO_USERS = [
  {
    id: 'u-001',
    username: 'li',
    name: '李同学',
    email: 'li@example.com',
    avatarText: '李',
  },
  {
    id: 'u-002',
    username: 'wang',
    name: '王同学',
    email: 'wang@example.com',
    avatarText: '王',
  },
  {
    id: 'u-003',
    username: 'zhang',
    name: '张老师',
    email: 'pi@example.com',
    avatarText: '张',
  },
]

function saveSession(user) {
  localStorage.setItem('auth_token', STATIC_TOKEN)
  localStorage.setItem('auth_user', JSON.stringify(user))
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

  /**
   * 从 localStorage 恢复静态预览会话，不向后端发送请求。
   */
  restoreSession: () => {
    const savedUser = localStorage.getItem('auth_user')
    if (!savedUser) {
      set({ currentUser: null, token: null, loading: false })
      return
    }

    try {
      const user = JSON.parse(savedUser)
      saveSession(user)
      set({ currentUser: user, token: STATIC_TOKEN, loading: false })
    } catch {
      clearSession()
      set({ currentUser: null, token: null, loading: false })
    }
  },

  /**
   * 登录
   * @param {{ identifier: string, password: string }} credentials
   */
  login: async (credentials) => {
    const identifier = credentials.identifier.trim().toLowerCase()
    const user = DEMO_USERS.find(
      (candidate) =>
        candidate.username.toLowerCase() === identifier ||
        candidate.email.toLowerCase() === identifier,
    )

    if (!user || credentials.password !== DEMO_PASSWORD) {
      throw new Error('静态预览账号或密码错误，请使用页面下方的测试账号')
    }

    saveSession(user)
    set({ currentUser: user, token: STATIC_TOKEN })
  },

  register: async (account) => {
    const user = {
      id: `local-${Date.now()}`,
      username: account.username,
      name: account.name,
      email: account.email,
      avatarText: account.avatarText || account.name?.slice(0, 1) || '用',
    }
    saveSession(user)
    set({ currentUser: user, token: STATIC_TOKEN })
  },

  /**
   * 登出
   */
  logout: async () => {
    clearSession()
    set({ currentUser: null, token: null })
  },
}))
