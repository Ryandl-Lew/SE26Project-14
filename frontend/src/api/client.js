/** 后端基础地址，可通过 VITE_API_BASE_URL 覆盖。 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

/** 模拟网络延迟（毫秒） */
const MOCK_DELAY = 200

/**
 * 将 mock 数据包装为 Promise，模拟异步请求。
 * @template T
 * @param {T} data 要返回的数据
 * @returns {Promise<T>}
 */
export function mockResponse(data) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), MOCK_DELAY)
  })
}

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
 * 发送请求并解包后端统一 ApiResponse。
 * @param {string} path
 * @param {RequestInit} [options]
 */
export async function request(path, options = {}) {
  const token = localStorage.getItem('auth_token')
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
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
