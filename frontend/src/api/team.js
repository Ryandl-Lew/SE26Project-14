/**
 * 团队 / 成员相关 API
 */
import { mockMembers, mockPermissionMatrix } from '@/mocks/data'
import { mockResponse } from './client'

/**
 * 获取某项目的成员列表
 * @param {string} _projectId
 * @returns {Promise<import('@/domain/models').ProjectMember[]>}
 */
export function fetchTeamMembers(_projectId) {
  // TODO: GET /api/projects/:id/members
  return mockResponse(mockMembers)
}

/**
 * 获取角色权限矩阵
 * @param {string} _projectId
 * @returns {Promise<import('@/domain/models').PermissionMatrixRow[]>}
 */
export function fetchPermissionMatrix(_projectId) {
  // TODO: GET /api/projects/:id/permissions
  return mockResponse(mockPermissionMatrix)
}

/**
 * 邀请成员
 * @param {string} _projectId
 * @param {string} _email
 * @returns {Promise<void>}
 */
export function inviteMember(_projectId, _email) {
  // TODO: POST /api/projects/:id/members
  return mockResponse(undefined)
}

/**
 * 修改成员角色
 * @param {string} _projectId
 * @param {string} _userId
 * @param {import('@/domain/enums').ProjectRole} _role
 * @returns {Promise<void>}
 */
export function updateMemberRole(_projectId, _userId, _role) {
  // TODO: PATCH /api/projects/:id/members/:userId
  return mockResponse(undefined)
}
