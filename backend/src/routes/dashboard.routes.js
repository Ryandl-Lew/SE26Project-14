import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as ctrl from '../controllers/dashboard.controller.js'

const router = Router()
router.use(authenticate)

router.get('/stats', ctrl.getStats)
router.get('/todos', ctrl.getTodos)

export default router
