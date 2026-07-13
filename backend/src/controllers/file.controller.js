import * as fileService from '../services/file.service.js'
import { upload } from '../middleware/upload.js'
import { success } from '../utils/response.js'
import { AppError } from '../utils/AppError.js'

export async function uploadFile(req, res, next) {
  upload.single('file')(req, res, async (err) => {
    if (err) return next(err)
    try {
      const { recordId } = req.body
      if (!recordId) throw new AppError('缺少 recordId', 400, 'MISSING_RECORD_ID')
      const result = await fileService.uploadFile(req.file, recordId)
      return success(res, result, '上传成功', 201)
    } catch (e) {
      next(e)
    }
  })
}

export async function getFileInfo(req, res, next) {
  try {
    const file = await fileService.getFile(req.params.id)
    return success(res, {
      id: file.id,
      fileName: file.fileName,
      filePath: file.filePath,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      createdAt: file.createdAt.toISOString(),
    })
  } catch (err) {
    next(err)
  }
}

export async function deleteFile(req, res, next) {
  try {
    await fileService.deleteFile(req.params.id)
    return success(res, null, '文件已删除')
  } catch (err) {
    next(err)
  }
}
