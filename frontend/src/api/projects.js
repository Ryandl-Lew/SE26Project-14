/**
 * 项目相关 API
 * 当前返回 mock 数据；函数签名即未来后端契约。
 */
import {
  mockActivities,
  mockAttachments,
  mockMembers,
  mockProjects,
  mockTimeline,
} from '@/mocks/data'
import { mockResponse } from './client'

/**
 * 获取项目列表
 * @param {import('@/domain/common').PageQuery} [_query]
 * @returns {Promise<import('@/domain/models').Project[]>}
 */
export function fetchProjects(_query) {
  // TODO: GET /api/projects
  return mockResponse(mockProjects)
}

/**
 * 获取单个项目详情
 * @param {string} id
 * @returns {Promise<import('@/domain/models').Project | undefined>}
 */
export function fetchProject(id) {
  // TODO: GET /api/projects/:id
  return mockResponse(mockProjects.find((p) => p.id === id))
}

/**
 * 获取项目时间线
 * @param {string} _projectId
 * @returns {Promise<import('@/domain/models').ProjectTimelineItem[]>}
 */
export function fetchProjectTimeline(_projectId) {
  // TODO: GET /api/projects/:id/timeline
  return mockResponse(mockTimeline)
}

/**
 * 获取项目附件
 * @param {string} _projectId
 * @returns {Promise<import('@/domain/models').ProjectAttachment[]>}
 */
export function fetchProjectAttachments(_projectId) {
  // TODO: GET /api/projects/:id/attachments
  return mockResponse(mockAttachments)
}

/**
 * 获取项目最近动态
 * @param {string} _projectId
 * @returns {Promise<import('@/domain/models').ProjectActivity[]>}
 */
export function fetchProjectActivities(_projectId) {
  // TODO: GET /api/projects/:id/activities
  return mockResponse(mockActivities)
}

/**
 * 获取项目成员
 * @param {string} _projectId
 * @returns {Promise<import('@/domain/models').ProjectMember[]>}
 */
export function fetchProjectMembers(_projectId) {
  // TODO: GET /api/projects/:id/members
  return mockResponse(mockMembers)
}

/**
 * 创建项目
 * @param {{ name: string, description: string }} input
 * @returns {Promise<import('@/domain/models').Project>}
 */
export function createProject(input) {
  // TODO: POST /api/projects
  return mockResponse({
    ...mockProjects[0],
    id: `p-new-${input.name}`,
    name: input.name,
    description: input.description,
  })
}

/**
 * 归档项目
 * @param {string} _id
 * @returns {Promise<void>}
 */
export function archiveProject(_id) {
  // TODO: PATCH /api/projects/:id/archive
  return mockResponse(undefined)
}
