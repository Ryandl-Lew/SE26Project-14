import * as fieldService from '../services/field.service.js'
import { success } from '../utils/response.js'

export async function listFields(req, res, next) {
  try {
    const fields = await fieldService.listFields(req.params.id)
    return success(res, fields)
  } catch (err) {
    next(err)
  }
}

export async function createField(req, res, next) {
  try {
    const field = await fieldService.createField(req.params.id, req.body)
    return success(res, field, '条目创建成功', 201)
  } catch (err) {
    next(err)
  }
}

export async function updateField(req, res, next) {
  try {
    const field = await fieldService.updateField(req.params.fieldId, req.body)
    return success(res, field, '更新成功')
  } catch (err) {
    next(err)
  }
}

export async function deleteField(req, res, next) {
  try {
    await fieldService.deleteField(req.params.fieldId)
    return success(res, null, '条目已删除')
  } catch (err) {
    next(err)
  }
}

export async function reorderFields(req, res, next) {
  try {
    await fieldService.reorderFields(req.params.id, req.body.orderedFieldIds)
    return success(res, null, '排序已更新')
  } catch (err) {
    next(err)
  }
}
