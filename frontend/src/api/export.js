/**
 * 报告导出 API
 *
 * 后端导出端点返回二进制流（PDF / Excel / Markdown），
 * 所有请求统一使用 responseType: 'blob'。
 * 文件名解析与下载逻辑委托给 utils/download.js。
 */
import axios from 'axios'
import { handleFileDownload } from '@/utils/download'

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

  handleFileDownload(response, `项目实验记录_${projectId}.xlsx`)
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
  const defaultName =
    format === 'md'
      ? `实验记录_${recordId}.md`
      : `实验记录_${recordId}.pdf`

  const response = await exportClient.get(
    `/export/records/${recordId}`,
    {
      params: { format },
      responseType: 'blob',
    },
  )

  handleFileDownload(response, defaultName)
}
