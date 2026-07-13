import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError.js'

const prisma = new PrismaClient()

export async function listNotifications(userId, { unreadOnly = false } = {}) {
  const where = { userId, ...(unreadOnly && { isRead: false }) }
  return prisma.notification.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
}

export async function markAsRead(id) {
  const notification = await prisma.notification.findUnique({ where: { id } })
  if (!notification) throw new AppError('通知不存在', 404, 'NOT_FOUND')

  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })
}

/**
 * 创建通知
 */
export async function createNotification({ userId, title, content, type }) {
  return prisma.notification.create({
    data: { userId, title, content, type },
  })
}
