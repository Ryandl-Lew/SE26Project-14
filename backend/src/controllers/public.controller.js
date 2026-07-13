import * as publicService from '../services/public.service.js'
import { success } from '../utils/response.js'
import { optionalAuth } from '../middleware/auth.js'

export async function listPublicData(req, res, next) {
  try {
    const { keyword, category, page, pageSize } = req.query
    const result = await publicService.listPublicData({
      keyword,
      category,
      page: page ? parseInt(page) : 1,
      pageSize: pageSize ? parseInt(pageSize) : 20,
    })
    return success(res, result)
  } catch (err) {
    next(err)
  }
}

export async function getPublicDataDetail(req, res, next) {
  try {
    const data = await publicService.getPublicDataDetail(req.params.id)
    return success(res, data)
  } catch (err) {
    next(err)
  }
}

export async function publishProject(req, res, next) {
  try {
    const result = await publicService.publishProject(req.params.id, req.user.userId)
    return success(res, result, '项目已发布')
  } catch (err) {
    next(err)
  }
}

export async function unpublishProject(req, res, next) {
  try {
    const result = await publicService.unpublishProject(req.params.id, req.user.userId)
    return success(res, result, '已取消发布')
  } catch (err) {
    next(err)
  }
}

export async function createShareLink(req, res, next) {
  try {
    const { expiresAt, password } = req.body
    const link = await publicService.createShareLink(req.params.id, { expiresAt, password })
    return success(res, { token: link.token, expiresAt: link.expiresAt?.toISOString() }, '分享链接已生成', 201)
  } catch (err) {
    next(err)
  }
}

export async function verifyShareLink(req, res, next) {
  try {
    const { password } = req.body || {}
    const result = await publicService.verifyShareLink(req.params.token, password)
    return success(res, result)
  } catch (err) {
    next(err)
  }
}
