import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { mkdirSync } from 'node:fs'
import config from './config/index.js'
import { initSocket } from './socket/handlers.js'
import { initScheduler } from './services/scheduler.service.js'
import app from './app.js'

// 确保上传目录存在
try {
  mkdirSync(config.uploadDir, { recursive: true })
} catch {
  // 目录已存在
}

const httpServer = createServer(app)

// 初始化 Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: config.corsOrigins,
    methods: ['GET', 'POST'],
  },
})

// 挂载 io 实例到 app，供 controller 使用
app.set('io', io)

initSocket(io)

// 启动提醒定时任务
initScheduler(io)

httpServer.listen(config.port, () => {
  console.log(`[BioNote] 服务器已启动: http://localhost:${config.port}`)
  console.log(`[BioNote] Socket.IO 已初始化`)
  console.log(`[BioNote] 上传目录: ${config.uploadDir}`)
})

export { io }
