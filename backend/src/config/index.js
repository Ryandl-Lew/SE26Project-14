import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

dotenv.config({ path: resolve(__dirname, '../../.env') })

export default {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'fallback-secret',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  uploadDir: resolve(__dirname, '../../', process.env.UPLOAD_DIR || './uploads'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
  agentApiUrl: process.env.AGENT_API_URL || 'https://api.openai.com/v1',
  agentApiKey: process.env.AGENT_API_KEY || '',
  agentModel: process.env.AGENT_MODEL || 'gpt-4o',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
}
