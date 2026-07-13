import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as ctrl from '../controllers/reminder.controller.js'

const router = Router()
router.use(authenticate)

// GET /api/reminders/by-project/:projectId
router.get('/by-project/:projectId', ctrl.listByProject)

// POST /api/reminders
router.post(
  '/',
  validate([
    body('projectId').notEmpty().withMessage('projectId 不能为空'),
    body('title').trim().notEmpty().withMessage('提醒标题不能为空'),
    body('remindAt').isISO8601().withMessage('提醒时间格式错误'),
    body('advanceMinutes').optional().isInt({ min: 1 }),
    body('repeatRule').optional().trim(),
  ]),
  ctrl.create,
)

// PUT /api/reminders/:id
router.put('/:id', ctrl.update)

// DELETE /api/reminders/:id
router.delete('/:id', ctrl.remove)

// PATCH /api/reminders/:id/toggle
router.patch('/:id/toggle', ctrl.toggle)

export default router
