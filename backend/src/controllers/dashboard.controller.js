import * as dashboardService from '../services/dashboard.service.js'
import * as searchService from '../services/search.service.js'
import * as notificationService from '../services/notification.service.js'
import { success } from '../utils/response.js'

export async function getStats(req, res, next) {
  try {
    const stats = await dashboardService.getStats(req.user.userId)
    return success(res, stats)
  } catch (err) {
    next(err)
  }
}

export async function getTodos(req, res, next) {
  try {
    const todos = await dashboardService.getTodos(req.user.userId)
    return success(res, todos)
  } catch (err) {
    next(err)
  }
}

export async function search(req, res, next) {
  try {
    const { keyword, entityType = 'all', projectId, page = 1, pageSize = 20 } = req.query
    const result = await searchService.search({
      keyword: keyword || '',
      entityType,
      projectId,
      userId: req.user.userId,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    })
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getNotifications(req, res, next) {
  try {
    const { unreadOnly } = req.query
    const notifications = await notificationService.listNotifications(
      req.user.userId,
      { unreadOnly: unreadOnly === 'true' },
    )
    return success(res, notifications)
  } catch (err) {
    next(err)
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    await notificationService.markAsRead(req.params.id)
    return success(res, null, '已标记为已读')
  } catch (err) {
    next(err)
  }
}
