import * as projectService from '../services/project.service.js'
import { success } from '../utils/response.js'

export async function listProjects(req, res, next) {
  try {
    const { keyword, status, page = 1, pageSize = 20 } = req.query
    const result = await projectService.listProjects({
      keyword,
      status,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      userId: req.user.userId,
    })
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function createProject(req, res, next) {
  try {
    const result = await projectService.createProject({
      ...req.body,
      userId: req.user.userId,
    })
    return success(res, result, '项目创建成功', 201)
  } catch (err) {
    next(err)
  }
}

export async function getProject(req, res, next) {
  try {
    const result = await projectService.getProject(req.params.id)
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function updateProject(req, res, next) {
  try {
    const result = await projectService.updateProject(req.params.id, req.body)
    return success(res, result, '更新成功')
  } catch (err) {
    next(err)
  }
}

export async function archiveProject(req, res, next) {
  try {
    await projectService.archiveProject(req.params.id)
    return success(res, null, '项目已归档')
  } catch (err) {
    next(err)
  }
}

export async function getProjectTimeline(req, res, next) {
  try {
    const result = await projectService.getProjectTimeline(req.params.id)
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getProjectActivities(req, res, next) {
  try {
    const result = await projectService.getProjectActivities(req.params.id)
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getProjectAttachments(req, res, next) {
  try {
    const result = await projectService.getProjectAttachments(req.params.id)
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getProjectMembers(req, res, next) {
  try {
    const result = await projectService.getProjectMembers(req.params.id)
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function addMember(req, res, next) {
  try {
    const { userId, role } = req.body
    await projectService.addMember(req.params.id, userId, role)
    return success(res, null, '成员添加成功', 201)
  } catch (err) {
    next(err)
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    await projectService.updateMemberRole(req.params.id, req.params.userId, req.body.role)
    return success(res, null, '角色更新成功')
  } catch (err) {
    next(err)
  }
}

export async function removeMember(req, res, next) {
  try {
    await projectService.removeMember(req.params.id, req.params.userId)
    return success(res, null, '成员已移除')
  } catch (err) {
    next(err)
  }
}

export async function getPermissionMatrix(req, res, next) {
  try {
    const result = await projectService.getPermissionMatrix(req.params.id)
    return success(res, result)
  } catch (err) {
    next(err)
  }
}
