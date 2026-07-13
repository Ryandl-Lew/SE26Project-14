import multer from 'multer'
import { mkdirSync, existsSync } from 'node:fs'
import { v4 as uuidv4 } from 'uuid'
import { extname } from 'node:path'
import config from '../config/index.js'
import { AppError } from '../utils/AppError.js'

// 确保上传目录存在
if (!existsSync(config.uploadDir)) {
  mkdirSync(config.uploadDir, { recursive: true })
}

const ALLOWED_MIMES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir)
  },
  filename: (_req, file, cb) => {
    const shortId = uuidv4().slice(0, 8)
    const ext = extname(file.originalname)
    const safeName = Buffer.from(file.originalname.replace(ext, ''), 'latin1').toString('utf8').slice(0, 50).replace(/[^a-zA-Z0-9\u4e00-\u9fa5_\-]/g, '_')
    cb(null, `${Date.now()}-${shortId}-${safeName}${ext}`)
  },
})

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIMES.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new AppError(`不支持的文件类型: ${file.mimetype}`, 400, 'INVALID_FILE_TYPE'), false)
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
})
