/**
 * 团队 / 成员相关 API
 * 项目内权限管理：成员按项目隔离，角色分为 负责人 / 可编辑 / 只读 / 待审核。
 */
import { mockMembersByProject, mockPermissionMatrix } from '@/mocks/data'
import { mockResponse } from './client'

/**
 * 获取某项目的成员列表（含待审核成员）
 * @param {string} projectId
 * @returns {Promise<import('@/domain/models').ProjectMember[]>}
 */
export function fetchTeamMembers(projectId) {
  // TODO: GET /api/projects/:id/members
  return mockResponse(mockMembersByProject[projectId] ?? mockMembersByProject['p-001'])
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
 * 邀请成员（受邀成员进入「待审核」状态）
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

/**
 * 审批通过待审核成员
 * @param {string} _projectId
 * @param {string} _userId
 * @param {import('@/domain/enums').ProjectRole} [_role] 通过后的角色，默认 editor
 * @returns {Promise<void>}
 */
export function approveMember(_projectId, _userId, _role = 'editor') {
  // TODO: POST /api/projects/:id/members/:userId/approve
  return mockResponse(undefined)
}

/**
 * 拒绝 / 移除成员
 * @param {string} _projectId
 * @param {string} _userId
 * @returns {Promise<void>}
 */
export function removeMember(_projectId, _userId) {
  // TODO: DELETE /api/projects/:id/members/:userId
  return mockResponse(undefined)
}
