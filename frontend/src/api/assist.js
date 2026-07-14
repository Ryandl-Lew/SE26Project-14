/**
 * 搜索、工作台、AI 助手相关 API
 */
import {
  mockAiResult,
  mockDashboardStats,
  mockNotifications,
  mockSearchHits,
  mockTodos,
} from '@/mocks/data'
import { mockResponse } from './client'

/* ------------------------------ 搜索 ------------------------------ */

/**
 * 全局 / 高级搜索
 * @param {import('@/domain/models').SearchFilters} _filters
 * @returns {Promise<import('@/domain/models').SearchHit[]>}
 */
export function search(_filters) {
  // TODO: GET /api/search
  return mockResponse(mockSearchHits)
}

/* ----------------------------- 工作台 ----------------------------- */

/**
 * 获取工作台统计卡
 * @returns {Promise<import('@/domain/models').DashboardStat[]>}
 */
export function fetchDashboardStats() {
  // TODO: GET /api/dashboard/stats
  return mockResponse(mockDashboardStats)
}

/**
 * 获取我的待办
 * @returns {Promise<import('@/domain/models').TodoItem[]>}
 */
export function fetchTodos() {
  // TODO: GET /api/dashboard/todos
  return mockResponse(mockTodos)
}

/**
 * 获取提醒 / 通知
 * @returns {Promise<import('@/domain/models').NotificationItem[]>}
 */
export function fetchNotifications() {
  // TODO: GET /api/notifications
  return mockResponse(mockNotifications)
}

/* ---------------------------- AI 助手 ----------------------------- */

/**
 * 调用 AI 助手处理自然语言描述。
 * TODO: POST /api/ai/assist —— 后端转发 LLM，注意流式输出与超时处理
 * @param {import('@/domain/enums').AiFeature} feature 功能类型
 * @param {string} _text 自然语言输入
 * @param {string} [_projectId] 关联项目
 * @returns {Promise<import('@/domain/models').AiAssistResult>}
 */
export function runAiAssist(feature, _text, _projectId) {
  return mockResponse({ ...mockAiResult, feature })
}
