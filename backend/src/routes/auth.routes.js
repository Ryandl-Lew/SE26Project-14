import { Router } from 'express'
import { body } from 'express-validator'
import { validate } from '../middleware/validate.js'
import { authenticate } from '../middleware/auth.js'
import * as authController from '../controllers/auth.controller.js'

const router = Router()

// POST /api/auth/register
router.post(
  '/register',
  validate([
    body('username').trim().isLength({ min: 3, max: 20 }).withMessage('用户名需 3-20 个字符'),
    body('email').isEmail().withMessage('请输入有效邮箱'),
    body('password').isLength({ min: 6 }).withMessage('密码至少 6 个字符'),
    body('name').trim().notEmpty().withMessage('姓名不能为空'),
  ]),
  authController.register,
)

// POST /api/auth/login
router.post(
  '/login',
  validate([
    body('username').trim().notEmpty().withMessage('用户名不能为空'),
    body('password').notEmpty().withMessage('密码不能为空'),
  ]),
  authController.login,
)

// GET /api/auth/me
router.get('/me', authenticate, authController.getMe)

// PUT /api/auth/profile
router.put('/profile', authenticate, authController.updateProfile)

export default router
