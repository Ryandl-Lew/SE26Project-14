/**
 * 搜索 API
 *
 * 对接后端 GET /api/v1/search，支持全局搜索与项目内搜索。
 * 后端返回标准 ApiResponse<PageResponse<SearchHit>> 格式，
 * 本模块自动解包 ApiResponse.data 返回给调用方。
 */
import axios from 'axios'

const API_BASE = '/api/v1'

/**
 * 搜索专用 Axios 实例。
 * - baseURL 指向 /api/v1
 * - 超时 15 秒（搜索跨多表聚合，后端可能较慢）
 */
const searchClient = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
})

/**
 * 从 ApiResponse 中提取 data 字段。
 * 后端统一返回 { code, message, traceId, data }，
 * 这里只把 data 透传给调用方；若 code !== 'OK' 则抛错。
 *
 * @param {import('axios').AxiosResponse} response
 * @returns {any}
 */
function unwrap(response) {
  const body = response.data
  if (body && body.code === 'OK') {
    return body.data
  }
  // 后端返回了业务错误
  const msg = body?.message || '搜索请求失败'
  const err = new Error(msg)
  err.code = body?.code || 'UNKNOWN'
  err.traceId = body?.traceId || ''
  throw err
}

/**
 * 全局/项目内搜索。
 *
 * @param {string}  keyword   搜索关键词（必填）
 * @param {string}  [projectId] 限定项目 ID，不传则全局搜索
 * @param {number}  [page]     页码，0-based，默认 0
 * @param {number}  [size]     每页条数，默认 20
 * @returns {Promise<import('@/domain/models').PageResponse<import('@/domain/models').SearchHit>>}
 */
export async function globalSearch(keyword, projectId = null, page = 0, size = 20) {
  const params = { keyword, page, size }
  if (projectId) {
    params.projectId = projectId
  }

  const response = await searchClient.get('/search', { params })
  return unwrap(response)
}
