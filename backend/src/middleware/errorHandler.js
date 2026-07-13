import { AppError } from '../utils/AppError.js'
import { errorResponse } from '../utils/response.js'

/**
 * 全局错误处理中间件
 * 必须在所有路由之后注册
 */
export function errorHandler(err, req, res, _next) {
  // Prisma 已知错误
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      const target = err.meta?.target || '字段'
      return errorResponse(res, `唯一约束冲突: ${target}`, 409, 'UNIQUE_CONFLICT', err.meta)
    }
    if (err.code === 'P2025') {
      return errorResponse(res, '记录不存在', 404, 'NOT_FOUND')
    }
    return errorResponse(res, '数据库错误', 500, 'DATABASE_ERROR')
  }

  // Multer 文件上传错误
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return errorResponse(res, '文件大小超过限制', 400, 'FILE_TOO_LARGE')
    }
    return errorResponse(res, `文件上传错误: ${err.message}`, 400, 'UPLOAD_ERROR')
  }

  // 自定义 AppError
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode, err.code)
  }

  // JSON 解析错误
  if (err.type === 'entity.parse.failed') {
    return errorResponse(res, '请求体 JSON 格式错误', 400, 'INVALID_JSON')
  }

  // 未知错误
  const statusCode = err.statusCode || 500
  const message = process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
  console.error('[Error]', err)
  return errorResponse(res, message, statusCode)
}
