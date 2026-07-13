import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimiter } from './middleware/rateLimiter.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import projectRoutes from './routes/projects.routes.js'
import recordRoutes from './routes/records.routes.js'
import templateRoutes from './routes/templates.routes.js'
import reminderRoutes from './routes/reminders.routes.js'
import fileRoutes from './routes/files.routes.js'
import aiRoutes from './routes/ai.routes.js'
import publicRoutes from './routes/public.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import searchRoutes from './routes/search.routes.js'
import notificationRoutes from './routes/notifications.routes.js'
import config from './config/index.js'

const app = express()

// --- 安全头 ---
app.use(helmet())

// --- 限流 ---
app.use('/api/auth/login', rateLimiter({ windowMs: 60 * 1000, max: 5, message: '登录请求过于频繁，请1分钟后再试' }))
app.use('/api/auth/register', rateLimiter({ windowMs: 60 * 1000, max: 5 }))
app.use('/api', rateLimiter({ windowMs: 60 * 1000, max: 60 }))

// --- CORS ---
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}))

// --- Body 解析 ---
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// --- 静态资源（上传文件访问） ---
app.use('/uploads', express.static(config.uploadDir))

// --- 健康检查 ---
app.get('/', (_req, res) => res.json({ status: 'ok', name: 'BioNote API' }))

// --- 路由注册 ---
app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/templates', templateRoutes)
app.use('/api/reminders', reminderRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/public', publicRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/notifications', notificationRoutes)

// --- 全局错误处理（必须在所有路由之后） ---
app.use(errorHandler)

export default app
