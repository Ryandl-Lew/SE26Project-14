import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as ctrl from '../controllers/ai.controller.js'

const router = Router()
router.use(authenticate)

// POST /api/ai/assist
router.post(
  '/assist',
  validate([
    body('feature').isIn(['generate', 'organize', 'summarize', 'check', 'analyze']).withMessage('无效的功能类型'),
    body('text').trim().notEmpty().withMessage('输入文本不能为空'),
  ]),
  ctrl.assist,
)

// POST /api/ai/analyze
router.post(
  '/analyze',
  validate([
    body('projectId').notEmpty().withMessage('projectId 不能为空'),
    body('fieldId').notEmpty().withMessage('fieldId 不能为空'),
  ]),
  ctrl.analyze,
)

// POST /api/ai/report
router.post(
  '/report',
  validate([
    body('projectId').notEmpty().withMessage('projectId 不能为空'),
  ]),
  ctrl.generateReport,
)

export default router
