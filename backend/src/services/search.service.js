import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 全局搜索 - 多表联合
 */
export async function search({ keyword, entityType, projectId, userId, page = 1, pageSize = 20 }) {
  // 获取用户有权限的项目 ID
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  })
  const userProjectIds = memberships.map((m) => m.projectId)
  const allowedProjectIds = projectId ? [projectId].filter((id) => userProjectIds.includes(id)) : userProjectIds

  if (allowedProjectIds.length === 0) {
    return { items: [], total: 0, page, pageSize }
  }

  const results = []

  // 搜索项目
  if (entityType === 'all' || entityType === 'project') {
    const projects = await prisma.project.findMany({
      where: {
        id: { in: allowedProjectIds },
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      },
      select: { id: true, name: true, description: true, updatedAt: true },
      take: 10,
    })
    projects.forEach((p) => {
      results.push({
        id: p.id,
        entityType: 'project',
        title: p.name,
        snippet: `项目 · ${p.description || '无描述'} · 最近更新 ${p.updatedAt.toISOString().split('T')[0]}`,
      })
    })
  }

  // 搜索记录
  if (entityType === 'all' || entityType === 'record') {
    const records = await prisma.dataRecord.findMany({
      where: {
        projectId: { in: allowedProjectIds },
        OR: [
          { title: { contains: keyword } },
        ],
      },
      select: {
        id: true,
        title: true,
        code: true,
        recordDate: true,
        project: { select: { name: true } },
      },
      take: 10,
    })
    records.forEach((r) => {
      results.push({
        id: r.id,
        entityType: 'record',
        title: r.title,
        snippet: `匹配：${r.code} · 项目 ${r.project.name} · 实验日期 ${r.recordDate.toISOString().split('T')[0]}`,
      })
    })
  }

  // 搜索模板
  if (entityType === 'all' || entityType === 'template') {
    const templates = await prisma.fieldDefinition.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { description: { contains: keyword } },
        ],
      },
      select: { id: true, name: true, description: true, usageCount: true, category: true },
      take: 5,
    })
    templates.forEach((t) => {
      results.push({
        id: t.id,
        entityType: 'template',
        title: t.name,
        snippet: `模板 · 分类 ${t.category} · 使用 ${t.usageCount} 次`,
      })
    })
  }

  // 搜索成员
  if (entityType === 'all' || entityType === 'member') {
    const memberUserIds = await prisma.projectMember.findMany({
      where: { projectId: { in: allowedProjectIds } },
      distinct: ['userId'],
      select: { userId: true },
    })
    const ids = memberUserIds.map((m) => m.userId)

    if (ids.length > 0) {
      const users = await prisma.user.findMany({
        where: {
          id: { in: ids },
          OR: [
            { name: { contains: keyword } },
            { email: { contains: keyword } },
          ],
        },
        select: { id: true, name: true, email: true },
        take: 5,
      })
      users.forEach((u) => {
        results.push({
          id: u.id,
          entityType: 'member',
          title: u.name,
          snippet: `成员 · ${u.email}`,
        })
      })
    }
  }

  // 排序 + 分页
  const total = results.length
  const paged = results.slice((page - 1) * pageSize, page * pageSize)

  return { items: paged, total, page, pageSize }
}
