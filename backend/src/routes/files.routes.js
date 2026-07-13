import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as ctrl from '../controllers/file.controller.js'

const router = Router()

// 文件上传需鉴权
router.post('/upload', authenticate, ctrl.uploadFile)

// 文件信息获取公开（图片URL访问等）
router.get('/:id', ctrl.getFileInfo)

// 删除需鉴权
router.delete('/:id', authenticate, ctrl.deleteFile)

export default router
