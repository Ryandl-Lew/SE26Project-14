import { PrismaClient } from '@prisma/client'
import { unlinkSync, existsSync } from 'node:fs'
import { AppError } from '../utils/AppError.js'

const prisma = new PrismaClient()

/**
 * 上传文件并关联到记录
 */
export async function uploadFile(file, recordId) {
  const record = await prisma.dataRecord.findUnique({ where: { id: recordId } })
  if (!record) throw new AppError('实验记录不存在', 404, 'NOT_FOUND')

  const attachment = await prisma.attachment.create({
    data: {
      recordId,
      fileName: file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
    },
  })

  return {
    id: attachment.id,
    name: attachment.fileName,
    size: attachment.fileSize,
    type: attachment.mimeType,
    createdAt: attachment.createdAt.toISOString(),
  }
}

/**
 * 获取附件信息
 */
export async function getFile(id) {
  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: {
      record: { select: { projectId: true, id: true } },
    },
  })
  if (!attachment) throw new AppError('附件不存在', 404, 'NOT_FOUND')

  return attachment
}

/**
 * 删除附件
 */
export async function deleteFile(id) {
  const attachment = await prisma.attachment.findUnique({ where: { id } })
  if (!attachment) throw new AppError('附件不存在', 404, 'NOT_FOUND')

  // 物理删除文件
  if (existsSync(attachment.filePath)) {
    unlinkSync(attachment.filePath)
  }

  await prisma.attachment.delete({ where: { id } })
  return { ok: true }
}
