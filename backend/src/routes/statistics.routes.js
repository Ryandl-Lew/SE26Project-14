import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as ctrl from '../controllers/statistics.controller.js'

const router = Router()
router.use(authenticate)

// 这些路由挂在 /api/projects 下，放在 projects.routes.js 中

export default router
