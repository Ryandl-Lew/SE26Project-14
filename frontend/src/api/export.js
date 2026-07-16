/**
 * 报告导出 API
 *
 * 后端导出端点返回二进制流（PDF / Excel / Markdown），
 * 本模块使用 Axios + responseType: 'blob' 接收，
 * 并复用 files.js 同款的 Content-Disposition 文件名解析
 * 与 Blob URL 浏览器下载机制。
 */
import axios from 'axios'

/** 后端 API 基础路径 */
const API_BASE = '/api/v1'

/**
 * 导出专用 Axios 实例
 * - baseURL 指向 /api/v1
 * - 超时 60 秒（PDF/Excel 生成可能耗时）
 */
const exportClient = axios.create({
  baseURL: API_BASE,
  timeout: 60_000,
})

/* ========================= 工具函数 ========================= */

/**
 * 从 Content-Disposition 响应头中提取文件名
 *
 * 与 files.js 中的 extractFilename 逻辑一致：
 *   1. 优先 RFC 5987: filename*=UTF-8''%E4%B8%AD%E6%96%87.pdf
 *   2. 回退旧式:  filename="xxx.pdf" 或 filename=xxx.pdf
 *   3. 兜底返回 'download'
 *
 * @param {string} disposition
 * @returns {string}
 */
function extractFilename(disposition) {
  if (!disposition) return 'download'

  // 优先解析 RFC 5987
  const starMatch = disposition.match(
    /filename\*=(?:UTF-8''|utf-8'')(.+?)(?:;|$)/i,
  )
  if (starMatch) {
    try {
      return decodeURIComponent(starMatch[1].trim())
    } catch {
      // 解码失败则继续尝试旧式
    }
  }

  // 旧式 filename="xxx.pdf" 或 filename=xxx.pdf
  const plainMatch = disposition.match(/filename="?([^";\r\n]+)"?/i)
  if (plainMatch) {
    return plainMatch[1].trim().replace(/^"|"$/g, '')
  }

  return 'download'
}

/**
 * 通过 Blob URL + 隐藏 <a> 触发浏览器下载
 *
 * @param {Blob}   blob     文件二进制数据
 * @param {string} filename 下载文件名
 */
function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // 延迟释放 Blob URL，确保浏览器接管下载
  setTimeout(() => window.URL.revokeObjectURL(url), 150)
}

/* ========================= 公开 API ========================= */

/**
 * 导出项目实验记录一览表为 Excel (.xlsx)
 *
 * GET /api/v1/export/projects/{projectId}?format=excel
 *
 * @param {string} projectId
 * @returns {Promise<void>}
 */
export async function exportProjectToExcel(projectId) {
  const response = await exportClient.get(
    `/export/projects/${projectId}`,
    {
      params: { format: 'excel' },
      responseType: 'blob',
    },
  )

  const blob = response.data
  const disposition = response.headers['content-disposition']
  const filename = extractFilename(disposition)

  triggerDownload(blob, filename)
}

/**
 * 导出实验记录为 PDF 或 Markdown
 *
 * GET /api/v1/export/records/{recordId}?format=pdf|md
 *
 * @param {string}          recordId
 * @param {'pdf'|'md'}      [format='pdf']  导出格式
 * @returns {Promise<void>}
 */
export async function exportRecord(recordId, format = 'pdf') {
  const response = await exportClient.get(
    `/export/records/${recordId}`,
    {
      params: { format },
      responseType: 'blob',
    },
  )

  const blob = response.data
  const disposition = response.headers['content-disposition']
  const filename = extractFilename(disposition)

  triggerDownload(blob, filename)
}
