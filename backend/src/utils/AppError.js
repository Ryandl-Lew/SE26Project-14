export class AppError extends Error {
  /**
   * @param {string} message 错误消息
   * @param {number} statusCode HTTP 状态码
   * @param {string} [code] 内部错误码
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.name = 'AppError'
  }
}
