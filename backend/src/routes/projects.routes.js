import { Router } from 'express'
import { body, query } from 'express-validator'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import * as ctrl from '../controllers/project.controller.js'
import * as fieldCtrl from '../controllers/field.controller.js'
import * as statsCtrl from '../controllers/statistics.controller.js'

const router = Router()

// 所有路由需要鉴权
router.use(authenticate)

// GET /api/projects
router.get('/', ctrl.listProjects)

// POST /api/projects
router.post(
  '/',
  validate([
    body('name').trim().notEmpty().withMessage('项目名称不能为空'),
    body('description').optional().trim(),
  ]),
  ctrl.createProject,
)

// GET /api/projects/:id
router.get('/:id', ctrl.getProject)

// PUT /api/projects/:id
router.put('/:id', ctrl.updateProject)

// PATCH /api/projects/:id/archive
router.patch('/:id/archive', ctrl.archiveProject)

// GET /api/projects/:id/timeline
router.get('/:id/timeline', ctrl.getProjectTimeline)

// GET /api/projects/:id/activities
router.get('/:id/activities', ctrl.getProjectActivities)

// GET /api/projects/:id/attachments
router.get('/:id/attachments', ctrl.getProjectAttachments)

// ---- 成员管理 ----
router.get('/:id/members', ctrl.getProjectMembers)

router.post(
  '/:id/members',
  validate([
    body('userId').notEmpty().withMessage('用户ID不能为空'),
    body('role').optional().isIn(['member', 'reviewer', 'observer']).withMessage('无效的角色'),
  ]),
  ctrl.addMember,
)

router.patch(
  '/:id/members/:userId',
  validate([
    body('role').isIn(['member', 'reviewer', 'observer', 'owner']).withMessage('无效的角色'),
  ]),
  ctrl.updateMemberRole,
)

router.delete('/:id/members/:userId', ctrl.removeMember)

// GET /api/projects/:id/permissions
router.get('/:id/permissions', ctrl.getPermissionMatrix)

// ---- 数据条目管理 ----
router.get('/:id/fields', fieldCtrl.listFields)

router.post(
  '/:id/fields',
  validate([
    body('name').trim().notEmpty().withMessage('条目名称不能为空'),
    body('type').isIn(['text', 'number', 'date', 'image', 'table', 'select']).withMessage('无效的条目类型'),
    body('unit').optional().trim(),
    body('required').optional().isBoolean(),
    body('groupName').optional().trim(),
  ]),
  fieldCtrl.createField,
)

router.put('/:id/fields/:fieldId', fieldCtrl.updateField)

router.delete('/:id/fields/:fieldId', fieldCtrl.deleteField)

router.put(
  '/:id/fields/sort',
  validate([
    body('orderedFieldIds').isArray({ min: 1 }).withMessage('排序ID数组不能为空'),
  ]),
  fieldCtrl.reorderFields,
)

// ---- 数据统计 ----
router.get('/:id/statistics', statsCtrl.getProjectStatistics)
router.get('/:id/statistics/overview', statsCtrl.getRecordOverview)
router.get('/:id/statistics/fields/:fieldId/timeseries', statsCtrl.getTimeSeriesData)

export default router
