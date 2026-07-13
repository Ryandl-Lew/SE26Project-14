import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as ctrl from '../controllers/template.controller.js'

const router = Router()

router.use(authenticate)

// GET /api/templates
router.get('/', ctrl.listTemplates)

// GET /api/templates/:id
router.get('/:id', ctrl.getTemplate)

// POST /api/templates
router.post(
  '/',
  validate([
    body('name').trim().notEmpty().withMessage('模板名称不能为空'),
    body('category').optional().trim(),
    body('fields').optional().isArray(),
  ]),
  ctrl.createTemplate,
)

// POST /api/templates/:id/use
router.post(
  '/:id/use',
  validate([
    body('projectId').notEmpty().withMessage('项目ID不能为空'),
  ]),
  ctrl.useTemplate,
)

export default router
