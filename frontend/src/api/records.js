/**
 * 实验记录相关 API
 * 当前返回 mock 数据；函数签名即未来后端契约。
 */
import { mockComments, mockRecordDetail, mockRecords, mockRecordRevisions } from '@/mocks/data'
import { mockResponse } from './client'

/**
 * 按项目获取实验记录列表
 * @param {string} [projectId]
 * @param {import('@/domain/common').PageQuery} [_query]
 * @returns {Promise<import('@/domain/models').ExperimentRecordSummary[]>}
 */
export function fetchRecords(projectId, _query) {
  // TODO: GET /api/records?projectId=
  const list = projectId
    ? mockRecords.filter((r) => r.projectId === projectId)
    : mockRecords
  return mockResponse(list)
}

/**
 * 获取实验记录详情
 * @param {string} _id
 * @returns {Promise<import('@/domain/models').ExperimentRecord>}
 */
export function fetchRecord(_id) {
  // TODO: GET /api/records/:id
  return mockResponse(mockRecordDetail)
}

/**
 * 获取实验记录的评论 / 审核意见 / 版本历史
 * @param {string} _recordId
 * @returns {Promise<import('@/domain/models').Comment[]>}
 */
export function fetchRecordComments(_recordId) {
  // TODO: GET /api/records/:id/comments
  return mockResponse(mockComments)
}

/**
 * 获取实验记录的修改追溯（修改人 / 时间 / 内容 / 原因）
 * @param {string} _recordId
 * @returns {Promise<import('@/domain/models').AuditEntry[]>}
 */
export function fetchRecordRevisions(_recordId) {
  // TODO: GET /api/records/:id/revisions
  return mockResponse(mockRecordRevisions)
}

/**
 * 保存草稿（新建或更新）
 * @param {import('@/domain/models').RecordDraftInput & { reason?: string }} input
 * reason 修改原因：更新已有记录时必填，服务端据此生成修改追溯日志。
 * @returns {Promise<import('@/domain/models').ExperimentRecord>}
 */
export function saveRecordDraft(input) {
  // TODO: POST /api/records 或 PUT /api/records/:id
  // TODO: 正文按 Markdown 富文本存储（content 字段），服务端保存渲染所需原文
  return mockResponse({ ...mockRecordDetail, title: input.title })
}

/**
 * 提交审核
 * @param {string} _id
 * @returns {Promise<void>}
 */
export function submitRecordForReview(_id) {
  // TODO: POST /api/records/:id/submit
  return mockResponse(undefined)
}

/**
 * 审核通过
 * @param {string} _id
 * @returns {Promise<void>}
 */
export function approveRecord(_id) {
  // TODO: POST /api/records/:id/approve
  return mockResponse(undefined)
}

/**
 * 退回修改
 * @param {string} _id
 * @param {string} [_reason]
 * @returns {Promise<void>}
 */
export function rejectRecord(_id, _reason) {
  // TODO: POST /api/records/:id/reject
  return mockResponse(undefined)
}
