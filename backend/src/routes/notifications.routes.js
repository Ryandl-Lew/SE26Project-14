import { Router } from 'express'
import { authenticate } from '../middleware/auth.js'
import * as ctrl from '../controllers/dashboard.controller.js'

const router = Router()
router.use(authenticate)

router.get('/', ctrl.getNotifications)
router.patch('/:id/read', ctrl.markNotificationRead)

export default router
