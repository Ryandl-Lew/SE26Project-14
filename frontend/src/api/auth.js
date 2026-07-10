/**
 * 认证 API
 * TODO: 后端就绪后替换为真实 HTTP 请求。
 *       对应后端路由：
 *         POST /api/auth/login
 *         POST /api/auth/logout
 *         GET  /api/auth/me
 */
import { localAccounts } from '@/mocks/data'
import { mockResponse } from './client'

/**
 * 登录
 * @param {{ username: string, password: string }} credentials
 * @returns {Promise<{ user: { id: string, name: string, email: string, avatarText: string }, token: string }>}
 */
export async function login({ username, password }) {
  const account = localAccounts.find(
    (a) => a.username === username && a.password === password,
  )
  if (!account) {
    throw new Error('用户名或密码错误')
  }
  const { id, name, email, avatarText } = account
  return mockResponse({
    user: { id, name, email, avatarText },
    token: `mock-token-${id}-${Date.now()}`,
  })
}

/**
 * 登出
 * @returns {Promise<{ ok: boolean }>}
 */
export async function logout() {
  return mockResponse({ ok: true })
}

/**
 * 获取当前登录用户（通过 token 恢复会话）
 * @returns {Promise<{ user: { id: string, name: string, email: string, avatarText: string } }>}
 */
export async function getCurrentUser() {
  const stored = localStorage.getItem('auth_user')
  if (stored) {
    try {
      return mockResponse({ user: JSON.parse(stored) })
    } catch {
      // ignore
    }
  }
  throw new Error('未登录')
}
