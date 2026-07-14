/**
 * 模板相关 API
 */
import { mockTemplates } from '@/mocks/data'
import { mockResponse } from './client'

/**
 * 获取模板列表
 * @returns {Promise<import('@/domain/models').Template[]>}
 */
export function fetchTemplates() {
  // TODO: GET /api/templates
  return mockResponse(mockTemplates)
}

/**
 * 获取模板详情（含字段结构）
 * @param {string} id
 * @returns {Promise<import('@/domain/models').Template | undefined>}
 */
export function fetchTemplate(id) {
  // TODO: GET /api/templates/:id
  return mockResponse(mockTemplates.find((t) => t.id === id))
}

/**
 * 基于模板新建实验记录（返回预填的草稿标识）
 * @param {string} _templateId
 * @returns {Promise<{ recordId: string }>}
 */
export function createRecordFromTemplate(_templateId) {
  // TODO: POST /api/templates/:id/use
  return mockResponse({ recordId: 'r-new' })
}
