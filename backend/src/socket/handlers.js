/**
 * Socket.io 事件处理器
 */
import jwt from 'jsonwebtoken'
import config from '../config/index.js'

/**
 * 初始化 Socket.io
 * @param {import('socket.io').Server} io
 */
export function initSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) {
      return next(new Error('未提供认证令牌'))
    }
    try {
      const decoded = jwt.verify(token, config.jwtSecret)
      socket.userId = decoded.userId
      socket.username = decoded.username
      next()
    } catch {
      next(new Error('无效的认证令牌'))
    }
  })

  io.on('connection', (socket) => {
    const room = `user:${socket.userId}`
    socket.join(room)
    console.log(`[Socket] 用户 ${socket.username}(${socket.userId}) 已连接`)

    socket.on('disconnect', () => {
      console.log(`[Socket] 用户 ${socket.username}(${socket.userId}) 已断开`)
    })
  })
}

/**
 * 向指定用户推送消息
 * @param {import('socket.io').Server} io
 * @param {string} userId
 * @param {string} event
 * @param {*} data
 */
export function sendToUser(io, userId, event, data) {
  io.to(`user:${userId}`).emit(event, data)
}
