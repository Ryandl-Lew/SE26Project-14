/**
 * 文件上传 / 下载 / 删除 / 预览 / 恢复 API
 *
 * 后端文件 API 已就绪，本模块使用 Axios 实例直接请求真实后端。
 * 其余业务模块（projects / records 等）暂保持 mock 模式，
 * 后续统一替换 client.js 时一并迁移。
 */
import axios from 'axios'

/** 后端基础地址 */
const API_BASE = '/api/v1'

/**
 * 文件专用 Axios 实例
 * - 不设全局拦截器，避免与 mock 层的 client.js 互相干扰
 * - 上传类请求不设 Content-Type，由浏览器自动生成 multipart boundary
 */
const fileClient = axios.create({
  baseURL: API_BASE,
  timeout: 120_000, // 上传大文件给 2 分钟
})

/* ========================= 工具函数 ========================= */

/**
 * 从 Content-Disposition 响应头中提取文件名
 * 支持 RFC 5987 filename*=UTF-8''encoded 与旧式 filename="..."
 * @param {string} disposition
 * @returns {string}
 */
function extractFilename(disposition) {
  if (!disposition) return 'download'

  // 优先解析 RFC 5987: filename*=UTF-8''%E4%B8%AD%E6%96%87.pdf
  const starMatch = disposition.match(/filename\*=(?:UTF-8''|utf-8'')(.+?)(?:;|$)/i)
  if (starMatch) {
    try {
      return decodeURIComponent(starMatch[1].trim())
    } catch {
      // 解码失败则回退
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
 * 格式化文件大小
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/* ========================= 公开 API ========================= */

/**
 * 上传项目附件
 * @param {string} projectId
 * @param {File}   file
 * @param {(pct: number) => void} [onProgress]  进度回调 0-100
 * @returns {Promise<any>}
 */
export function uploadProjectFile(projectId, file, onProgress) {
  const form = new FormData()
  form.append('file', file)

  return fileClient.request({
    method: 'POST',
    url: `/projects/${projectId}/files`,
    data: form,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })
}

/**
 * 上传实验记录附件
 * @param {string} recordId   实验记录 ID（路径参数）
 * @param {string} projectId  所属项目 ID（必填 query 参数，用于后端权限校验）
 * @param {File}   file       要上传的文件
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<any>}
 */
export function uploadRecordAttachment(recordId, projectId, file, onProgress) {
  const form = new FormData()
  form.append('file', file)
  form.append('projectId', projectId)

  return fileClient.request({
    method: 'POST',
    url: `/records/${recordId}/attachments`,
    data: form,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded * 100) / event.total))
      }
    },
  })
}

/**
 * 下载文件（触发浏览器下载）
 * @param {string} attachmentId
 * @returns {Promise<void>}
 */
export async function downloadFile(attachmentId) {
  const response = await fileClient.get(`/files/${attachmentId}/download`, {
    responseType: 'blob',
  })

  const blob = response.data
  const disposition = response.headers['content-disposition']
  const filename = extractFilename(disposition)

  // 通过 Blob URL + <a> 触发下载
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // 延迟释放 Blob URL，确保浏览器完成下载
  setTimeout(() => window.URL.revokeObjectURL(url), 150)
}

/**
 * 删除文件
 * @param {string} attachmentId
 * @returns {Promise<any>}
 */
export function deleteFile(attachmentId) {
  return fileClient.delete(`/files/${attachmentId}`)
}

/**
 * 恢复已软删除的文件。
 * PUT /api/v1/files/{attachmentId}/restore
 * @param {string} attachmentId
 * @returns {Promise<any>}
 */
export function restoreFile(attachmentId) {
  return fileClient.put(`/files/${attachmentId}/restore`)
}

/**
 * 查询项目文件列表。
 * GET /api/v1/projects/{projectId}/files
 * @param {string}  projectId
 * @param {boolean} [includeDeleted=false]  是否包含已软删除的文件
 * @returns {Promise<Array>}
 */
export async function listProjectFiles(projectId, includeDeleted = false) {
  const params = includeDeleted ? { includeDeleted: true } : {}
  const response = await fileClient.get(`/projects/${projectId}/files`, { params })
  return response.data?.data ?? []
}

/**
 * 查询实验记录附件列表。
 * GET /api/v1/records/{recordId}/attachments
 * @param {string}  recordId
 * @param {boolean} [includeDeleted=false]  是否包含已软删除的文件
 * @returns {Promise<Array>}
 */
export async function listRecordAttachments(recordId, includeDeleted = false) {
  const params = includeDeleted ? { includeDeleted: true } : {}
  const response = await fileClient.get(`/records/${recordId}/attachments`, { params })
  return response.data?.data ?? []
}

/**
 * 生成文件预览 URL。
 * 不发起 HTTP 请求，直接返回后端预览端点地址，
 * 可直接用于 <img src> 或 <iframe src>。
 * GET /api/v1/files/{attachmentId}/preview
 * @param {string} attachmentId
 * @returns {string}
 */
export function previewFileUrl(attachmentId) {
  return `/api/v1/files/${attachmentId}/preview`
}
