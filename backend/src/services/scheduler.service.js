import { PrismaClient } from '@prisma/client'
import { sendToUser } from '../socket/handlers.js'
import { createNotification } from './notification.service.js'

const prisma = new PrismaClient()

/**
 * 初始化定时任务 - 每分钟检查到期提醒
 * @param {import('socket.io').Server} io
 */
export function initScheduler(io) {
  const checkReminders = async () => {
    try {
      const now = new Date()
      const nowMs = now.getTime()

      // 查找需要触发的提醒
      const reminders = await prisma.reminder.findMany({
        where: {
          isEnabled: true,
          remindAt: {
            lte: new Date(nowMs + 5 * 60 * 1000), // remindAt <= now+5分钟
          },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              members: {
                select: { userId: true },
              },
            },
          },
        },
      })

      for (const reminder of reminders) {
        // 检查是否已经为这个提醒在今天触发过 (避免重复)
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const existingLog = await prisma.reminderLog.findFirst({
          where: {
            reminderId: reminder.id,
            triggeredAt: { gte: today },
          },
        })

        if (existingLog) continue

        // 触发提醒 - 为每个项目成员
        for (const member of reminder.project.members) {
          // 创建提醒记录
          await prisma.reminderLog.create({
            data: {
              reminderId: reminder.id,
              userId: member.userId,
              status: 'sent',
            },
          })

          // 创建通知
          await createNotification({
            userId: member.userId,
            title: `采集提醒: ${reminder.title}`,
            content: `项目 "${reminder.project.name}" 的采集时间已到，请及时记录数据。`,
            type: 'reminder',
          })

          // Socket.io 实时推送
          sendToUser(io, member.userId, 'reminder', {
            reminderId: reminder.id,
            projectId: reminder.project.id,
            title: reminder.title,
            projectName: reminder.project.name,
          })
        }

        // 处理重复提醒
        if (reminder.repeatRule) {
          // 简单的每日重复逻辑
          const nextDate = new Date(reminder.remindAt)
          nextDate.setDate(nextDate.getDate() + 1)
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { remindAt: nextDate },
          })
        } else {
          // 单次提醒 - 禁用
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { isEnabled: false },
          })
        }
      }
    } catch (err) {
      console.error('[Scheduler] 提醒检查出错:', err.message)
    }
  }

  // 每分钟执行一次
  setInterval(checkReminders, 60 * 1000)
  console.log('[Scheduler] 提醒定时任务已启动 (每分钟检查)')
}
