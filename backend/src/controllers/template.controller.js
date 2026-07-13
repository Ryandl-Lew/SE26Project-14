import * as templateService from '../services/template.service.js'
import { success } from '../utils/response.js'

export async function listTemplates(_req, res, next) {
  try {
    const templates = await templateService.listTemplates()
    return success(res, templates)
  } catch (err) {
    next(err)
  }
}

export async function getTemplate(req, res, next) {
  try {
    const template = await templateService.getTemplate(req.params.id)
    return success(res, template)
  } catch (err) {
    next(err)
  }
}

export async function createTemplate(req, res, next) {
  try {
    const template = await templateService.createTemplate(req.body)
    return success(res, template, '模板创建成功', 201)
  } catch (err) {
    next(err)
  }
}

export async function useTemplate(req, res, next) {
  try {
    const result = await templateService.useTemplate(req.params.id, req.body.projectId, req.user.userId)
    return success(res, result, '已从模板创建记录')
  } catch (err) {
    next(err)
  }
}
