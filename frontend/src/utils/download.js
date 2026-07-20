/**
 * 通用文件下载工具
 *
 * 供所有导出 API（PDF / Excel / Markdown）复用：
 * - 从 Axios blob 响应中提取 Content-Disposition 文件名
 * - 创建 Blob URL → 隐藏 <a> → 模拟点击下载 → 清理
 */

/**
 * 从 Content-Disposition 响应头提取文件名
 *
 * 优先级：
 *   1. RFC 5987:  filename*=UTF-8''%E4%B8%AD%E6%96%87.pdf
 *   2. 旧式:      filename="xxx.pdf" 或 filename=xxx.pdf
 *   3. 兜底:      返回 defaultFilename
 *
 * @param {string} disposition   Content-Disposition 响应头值
 * @param {string} defaultFilename  兜底文件名
 * @returns {string}
 */
export function extractFilename(disposition, defaultFilename = 'download') {
  if (!disposition) return defaultFilename

  // RFC 5987: filename*=UTF-8''encoded-filename
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

  // 旧式: filename="xxx.pdf" 或 filename=xxx.pdf
  const plainMatch = disposition.match(/filename="?([^";\r\n]+)"?/i)
  if (plainMatch) {
    return plainMatch[1].trim().replace(/^"|"$/g, '')
  }

  return defaultFilename
}

/**
 * 通过 Blob URL + 隐藏 <a> 元素触发浏览器文件下载
 *
 * @param {Blob}   blob     文件二进制数据
 * @param {string} filename 下载时使用的文件名
 */
export function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  // 延迟释放 Blob URL，确保浏览器已接管下载
  setTimeout(() => window.URL.revokeObjectURL(url), 200)
}

/**
 * 统一的 Axios 响应 → 文件下载处理器
 *
 * 用法示例：
 *   const response = await axios.get('/api/v1/export/records/123', {
 *     params: { format: 'pdf' },
 *     responseType: 'blob',
 *   })
 *   handleFileDownload(response, '实验记录.pdf')
 *
 * @param {Object} response          Axios 响应对象（必须使用 responseType: 'blob'）
 * @param {string} [defaultFilename] 兜底文件名
 */
export function handleFileDownload(response, defaultFilename = 'download.pdf') {
  try {
    const contentType =
      response.headers?.['content-type'] || 'application/octet-stream'

    const blob = new Blob([response.data], { type: contentType })

    const disposition = response.headers?.['content-disposition']
    const filename = extractFilename(disposition, defaultFilename)

    triggerDownload(blob, filename)
  } catch (error) {
    console.error('文件下载解析失败:', error)
    // 兜底：如果 Blob 创建失败，尝试直接用 response.data
    try {
      const blob = new Blob([response.data])
      triggerDownload(blob, defaultFilename)
    } catch (fallbackError) {
      console.error('兜底下载也失败:', fallbackError)
    }
  }
}
