import * as searchService from '../services/search.service.js'
import { success } from '../utils/response.js'

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
