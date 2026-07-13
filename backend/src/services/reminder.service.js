import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError.js'

const prisma = new PrismaClient()

export async function listByProject(projectId) {
  return prisma.reminder.findMany({
    where: { projectId },
    orderBy: { remindAt: 'asc' },
  })
}

export async function create({ projectId, title, remindAt, advanceMinutes = 5, repeatRule }) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  return prisma.reminder.create({
    data: {
      projectId,
      title,
      remindAt: new Date(remindAt),
      advanceMinutes,
      repeatRule: repeatRule || null,
    },
  })
}

export async function update(id, data) {
  const reminder = await prisma.reminder.findUnique({ where: { id } })
  if (!reminder) throw new AppError('提醒不存在', 404, 'NOT_FOUND')

  return prisma.reminder.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.remindAt !== undefined && { remindAt: new Date(data.remindAt) }),
      ...(data.advanceMinutes !== undefined && { advanceMinutes: data.advanceMinutes }),
      ...(data.repeatRule !== undefined && { repeatRule: data.repeatRule }),
      ...(data.isEnabled !== undefined && { isEnabled: data.isEnabled }),
    },
  })
}

export async function remove(id) {
  const reminder = await prisma.reminder.findUnique({ where: { id } })
  if (!reminder) throw new AppError('提醒不存在', 404, 'NOT_FOUND')

  await prisma.reminder.delete({ where: { id } })
  return { ok: true }
}

export async function toggle(id) {
  const reminder = await prisma.reminder.findUnique({ where: { id } })
  if (!reminder) throw new AppError('提醒不存在', 404, 'NOT_FOUND')

  return prisma.reminder.update({
    where: { id },
    data: { isEnabled: !reminder.isEnabled },
  })
}
