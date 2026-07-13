import * as reminderService from '../services/reminder.service.js'
import { success } from '../utils/response.js'

export async function listByProject(req, res, next) {
  try {
    const reminders = await reminderService.listByProject(req.params.projectId)
    return success(res, reminders)
  } catch (err) {
    next(err)
  }
}

export async function create(req, res, next) {
  try {
    const reminder = await reminderService.create(req.body)
    return success(res, reminder, '提醒创建成功', 201)
  } catch (err) {
    next(err)
  }
}

export async function update(req, res, next) {
  try {
    const reminder = await reminderService.update(req.params.id, req.body)
    return success(res, reminder, '更新成功')
  } catch (err) {
    next(err)
  }
}

export async function remove(req, res, next) {
  try {
    await reminderService.remove(req.params.id)
    return success(res, null, '提醒已删除')
  } catch (err) {
    next(err)
  }
}

export async function toggle(req, res, next) {
  try {
    const reminder = await reminderService.toggle(req.params.id)
    return success(res, reminder, `提醒已${reminder.isEnabled ? '启用' : '禁用'}`)
  } catch (err) {
    next(err)
  }
}
