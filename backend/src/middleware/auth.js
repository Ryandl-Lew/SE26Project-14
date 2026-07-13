import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import { errorResponse } from '../utils/response.js'

/**
 * JWT 鉴权中间件
 * 从 Authorization: Bearer <token> 提取并验证 JWT
 * 验证通过后将 userId + username 挂到 req.user
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse(res, '未提供认证令牌', 401, 'UNAUTHORIZED')
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    }
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, '登录已过期，请重新登录', 401, 'TOKEN_EXPIRED')
    }
    return errorResponse(res, '无效的认证令牌', 401, 'INVALID_TOKEN')
  }
}

/**
 * 可选鉴权中间件
 * 有 token 就解析，没有也放行
 */
export function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, config.jwtSecret)
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
      }
    } catch {
      // token 无效，忽略
    }
  }
  next()
}
