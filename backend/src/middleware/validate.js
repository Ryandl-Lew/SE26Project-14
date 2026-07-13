import { validationResult } from 'express-validator'
import { errorResponse } from '../utils/response.js'

/**
 * 请求参数校验中间件工厂
 * @param {Array} validations - express-validator 规则数组
 * @returns 中间件函数
 *
 * 用法:
 *   router.post('/path', validate([body('name').notEmpty()]), controller.handler)
 */
export function validate(validations) {
  return async (req, res, next) => {
    // 执行所有校验规则
    for (const validation of validations) {
      const result = await validation.run(req)
      if (result.errors.length) break
    }

    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      const details = errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      }))
      return errorResponse(res, '参数校验失败', 422, 'VALIDATION_ERROR', details)
    }
    next()
  }
}
