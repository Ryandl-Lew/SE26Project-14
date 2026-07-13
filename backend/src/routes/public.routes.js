import { Router } from 'express'
import { authenticate, optionalAuth } from '../middleware/auth.js'
import * as ctrl from '../controllers/public.controller.js'

const router = Router()

// 公开数据 - 可选鉴权
router.get('/data', optionalAuth, ctrl.listPublicData)
router.get('/data/:id', optionalAuth, ctrl.getPublicDataDetail)

// 项目发布 - 需鉴权
router.post('/projects/:id/publish', authenticate, ctrl.publishProject)
router.delete('/projects/:id/publish', authenticate, ctrl.unpublishProject)

// 分享链接
router.post('/projects/:id/share', authenticate, ctrl.createShareLink)
router.get('/share/:token', ctrl.verifyShareLink)
router.post('/share/:token/verify', ctrl.verifyShareLink)

export default router
