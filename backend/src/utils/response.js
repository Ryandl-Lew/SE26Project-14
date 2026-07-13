/**
 * 统一成功响应
 */
export function success(res, data = null, message = '操作成功', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    error: null,
  })
}

/**
 * 统一错误响应
 */
export function errorResponse(res, message = '服务器错误', statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
  const body = {
    success: false,
    data: null,
    message,
    error: { code },
  }
  if (details) body.error.details = details
  return res.status(statusCode).json(body)
}
