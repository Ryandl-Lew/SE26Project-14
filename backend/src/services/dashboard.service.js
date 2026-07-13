import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 获取用户仪表盘统计
 */
export async function getStats(userId) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  })
  const projectIds = memberships.map((m) => m.projectId)

  const [totalProjects, activeProjects, weeklyRecords, pendingRecords] = await Promise.all([
    projectIds.length > 0
      ? prisma.project.count({ where: { id: { in: projectIds } } })
      : 0,
    projectIds.length > 0
      ? prisma.project.count({ where: { id: { in: projectIds }, status: 'active' } })
      : 0,
    // 本周新增记录
    (async () => {
      if (projectIds.length === 0) return 0
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      return prisma.dataRecord.count({
        where: { projectId: { in: projectIds }, createdAt: { gte: weekAgo } },
      })
    })(),
    // 待处理记录
    (async () => {
      if (projectIds.length === 0) return 0
      return prisma.dataRecord.count({
        where: { projectId: { in: projectIds }, status: { in: ['pending_review', 'rejected'] } },
      })
    })(),
  ])

  return [
    { label: '我参与的项目', value: totalProjects, note: '点击后进入项目管理' },
    { label: '进行中的项目', value: activeProjects, note: '' },
    { label: '本周新增实验', value: weeklyRecords, note: '' },
    { label: '待处理记录', value: pendingRecords, note: '含待审核与退回修改' },
  ]
}

/**
 * 获取用户待办列表
 */
export async function getTodos(userId) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true, role: true },
  })
  const projectIds = memberships.map((m) => m.projectId)
  const reviewerProjectIds = memberships.filter((m) => m.role === 'reviewer' || m.role === 'owner').map((m) => m.projectId)

  const todos = []

  // 待审核记录
  if (reviewerProjectIds.length > 0) {
    const pendingReviews = await prisma.dataRecord.findMany({
      where: { projectId: { in: reviewerProjectIds }, status: 'pending_review' },
      select: { id: true, title: true, projectId: true, project: { select: { name: true } } },
      take: 5,
    })
    pendingReviews.forEach((r) => {
      todos.push({
        id: `review-${r.id}`,
        title: `${r.title} 等待审核`,
        badgeText: '待审核',
        description: `所属项目：${r.project.name}`,
      })
    })
  }

  // 退回修改的记录
  if (projectIds.length > 0) {
    const rejected = await prisma.dataRecord.findMany({
      where: { projectId: { in: projectIds }, userId, status: 'rejected' },
      select: { id: true, title: true, project: { select: { name: true } } },
      take: 5,
    })
    rejected.forEach((r) => {
      todos.push({
        id: `reject-${r.id}`,
        title: r.title,
        badgeText: '退回修改',
        description: `所属项目：${r.project.name} · 需要修改后重新提交`,
      })
    })
  }

  // 未读提醒通知
  const unreadNotifications = await prisma.notification.findMany({
    where: { userId, isRead: false, type: 'reminder' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })
  unreadNotifications.forEach((n) => {
    todos.push({
      id: `notif-${n.id}`,
      title: n.title,
      badgeText: '提醒',
      description: n.content,
    })
  })

  return todos
}
