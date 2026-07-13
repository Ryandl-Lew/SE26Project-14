/**
 * 简单的内存限流中间件
 * 生产环境建议使用 express-rate-limit
 */
const ipRequestCounts = new Map()

// 每5分钟清理过期记录
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of ipRequestCounts) {
    if (now - data.resetTime > 5 * 60 * 1000) {
      ipRequestCounts.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * @param {Object} options
 * @param {number} options.windowMs 时间窗口(毫秒)
 * @param {number} options.max 最大请求数
 * @param {string} options.message 超限提示
 */
export function rateLimiter({ windowMs = 60 * 1000, max = 60, message = '请求过于频繁，请稍后再试' } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown'
    const key = `${ip}:${req.path}`

    if (!ipRequestCounts.has(key)) {
      ipRequestCounts.set(key, {
        count: 1,
        resetTime: Date.now() + windowMs,
      })
      return next()
    }

    const data = ipRequestCounts.get(key)
    if (Date.now() > data.resetTime) {
      data.count = 1
      data.resetTime = Date.now() + windowMs
      return next()
    }

    data.count++
    if (data.count > max) {
      return res.status(429).json({
        success: false,
        data: null,
        message,
        error: { code: 'TOO_MANY_REQUESTS' },
      })
    }

    next()
  }
}
