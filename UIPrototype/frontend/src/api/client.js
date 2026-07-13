/**
 * API 客户端占位层
 *
 * 当前阶段不接入真实后端：所有请求由 mock 数据包装成 Promise 返回。
 * 后续接入后端时，只需替换本文件为真实 HTTP 客户端（如 Axios），
 * 各业务 API 模块的函数签名保持不变即可平滑迁移。
 */

/** 后端基础地址（后端就绪后启用） */
export const API_BASE_URL = '/api'

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

/**
 * 真实请求占位函数。
 * TODO: 后端就绪后用 Axios / fetch 实现，并统一处理鉴权、错误、拦截。
 * @param {string} path
 * @param {RequestInit} [_options]
 * @returns {Promise<never>}
 */
export async function request(path, _options) {
  // TODO: 替换为真实实现
  throw new Error(`request() 尚未实现：${API_BASE_URL}${path}`)
}
