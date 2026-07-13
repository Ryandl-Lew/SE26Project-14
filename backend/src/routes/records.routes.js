import { Router } from 'express'
import { body } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as ctrl from '../controllers/record.controller.js'

const router = Router()
router.use(authenticate)

// GET /api/records
router.get('/', ctrl.listRecords)

// GET /api/records/export (必须在 :id 之前)
router.get('/export', ctrl.exportCSV)

// POST /api/records
router.post(
  '/',
  validate([
    body('projectId').notEmpty().withMessage('projectId 不能为空'),
    body('title').trim().notEmpty().withMessage('记录标题不能为空'),
  ]),
  ctrl.createRecord,
)

// GET /api/records/:id
router.get('/:id', ctrl.getRecord)

// PUT /api/records/:id
router.put('/:id', ctrl.updateRecord)

// DELETE /api/records/:id
router.delete('/:id', ctrl.deleteRecord)

// POST /api/records/:id/submit
router.post('/:id/submit', ctrl.submitForReview)

// POST /api/records/:id/approve
router.post('/:id/approve', ctrl.approveRecord)

// POST /api/records/:id/reject
router.post(
  '/:id/reject',
  validate([body('reason').optional().trim()]),
  ctrl.rejectRecord,
)

// GET /api/records/:id/comments
router.get('/:id/comments', ctrl.getRecordComments)

// POST /api/records/:id/comments
router.post(
  '/:id/comments',
  validate([body('content').trim().notEmpty().withMessage('评论内容不能为空')]),
  ctrl.addComment,
)

export default router
