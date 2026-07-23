/** 后端基础地址，可通过 VITE_API_BASE_URL 覆盖。 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export class ApiError extends Error {
  constructor(message, code, fieldErrors, status) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.fieldErrors = fieldErrors
    this.status = status
  }
}

/**
 * 将对象序列化为 URL 查询字符串（忽略 undefined/null 值）。
 * @param {Record<string, unknown>} params
 * @returns {string}
 */
function toQueryString(params) {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
  if (parts.length === 0) return ''
  return '?' + parts.join('&')
}

/**
 * 发送请求并解包后端统一 ApiResponse。
 * @param {string} path
 * @param {RequestInit & { params?: Record<string, unknown> }} [options]
 */
export async function request(path, options = {}) {
  const { params, ...init } = options
  const token = localStorage.getItem('auth_token')
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const queryString = params ? toQueryString(params) : ''
  const url = `${API_BASE_URL}${path}${queryString}`

  let response
  try {
    response = await fetch(url, { ...init, headers })
  } catch {
    throw new ApiError('无法连接服务器，请稍后重试', 'NETWORK_ERROR', null, 0)
  }

  const payload = response.status === 204
    ? null
    : await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(
      payload?.message || '请求失败，请稍后重试',
      payload?.code || 'REQUEST_FAILED',
      payload?.fieldErrors || null,
      response.status,
    )
  }
  return payload?.data ?? null
}
