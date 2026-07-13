import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError.js'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

/**
 * 发布项目到公开区
 */
export async function publishProject(projectId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { owner: { select: { id: true } } },
  })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')
  if (project.ownerId !== userId) throw new AppError('仅项目负责人可以发布', 403, 'FORBIDDEN')

  // 收集公开数据快照
  const fields = await prisma.dataField.findMany({
    where: { projectId },
    orderBy: { sortOrder: 'asc' },
  })
  const recordCount = await prisma.dataRecord.count({ where: { projectId } })

  const existing = await prisma.publicData.findUnique({ where: { projectId } })

  if (existing) {
    await prisma.publicData.update({
      where: { projectId },
      data: {
        title: project.name,
        description: project.description || '',
        snapshot: { fieldCount: fields.length, recordCount },
        updatedAt: new Date(),
      },
    })
  } else {
    await prisma.publicData.create({
      data: {
        projectId,
        title: project.name,
        description: project.description || '',
        tags: [],
        snapshot: { fieldCount: fields.length, recordCount },
      },
    })
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { isPublic: true },
  })

  return { ok: true }
}

/**
 * 取消发布
 */
export async function unpublishProject(projectId, userId) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { owner: { select: { id: true } } },
  })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')
  if (project.ownerId !== userId) throw new AppError('仅项目负责人可操作', 403, 'FORBIDDEN')

  await prisma.publicData.deleteMany({ where: { projectId } })
  await prisma.project.update({
    where: { id: projectId },
    data: { isPublic: false },
  })

  return { ok: true }
}

/**
 * 公开数据列表
 */
export async function listPublicData({ keyword, category, page = 1, pageSize = 20 }) {
  const where = {
    ...(keyword && {
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ],
    }),
    ...(category && { category }),
  }

  const [items, total] = await Promise.all([
    prisma.publicData.findMany({
      where,
      include: {
        project: {
          select: {
            owner: { select: { name: true } },
            _count: { select: { records: true } },
          },
        },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.publicData.count({ where }),
  ])

  return {
    items: items.map((d) => ({
      id: d.id,
      projectId: d.projectId,
      title: d.title,
      description: d.description,
      category: d.category,
      tags: d.tags,
      ownerName: d.project.owner.name,
      recordCount: d.project._count.records,
      snapshot: d.snapshot,
      publishedAt: d.publishedAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  }
}

/**
 * 公开数据详情
 */
export async function getPublicDataDetail(id) {
  const data = await prisma.publicData.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          description: true,
          owner: { select: { name: true } },
          dataFields: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { records: true } },
        },
      },
    },
  })
  if (!data) throw new AppError('公开数据不存在', 404, 'NOT_FOUND')

  return {
    id: data.id,
    projectId: data.projectId,
    title: data.title,
    description: data.description,
    category: data.category,
    tags: data.tags,
    ownerName: data.project.owner.name,
    recordCount: data.project._count.records,
    fields: data.project.dataFields.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      unit: f.unit,
    })),
    publishedAt: data.publishedAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
  }
}

/**
 * 创建分享链接
 */
export async function createShareLink(projectId, { expiresAt, password }) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const token = uuidv4()
  return prisma.shareLink.create({
    data: {
      projectId,
      token,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      password: password || null,
    },
  })
}

/**
 * 验证分享链接
 */
export async function verifyShareLink(token, password) {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      project: { select: { id: true, name: true, description: true, owner: { select: { name: true } } } },
    },
  })
  if (!link) throw new AppError('分享链接不存在或已失效', 404, 'SHARE_NOT_FOUND')

  if (link.expiresAt && new Date() > link.expiresAt) {
    throw new AppError('分享链接已过期', 410, 'SHARE_EXPIRED')
  }

  if (link.password && link.password !== password) {
    throw new AppError('访问密码错误', 403, 'INVALID_PASSWORD')
  }

  return {
    token: link.token,
    projectName: link.project.name,
    projectDescription: link.project.description,
    ownerName: link.project.owner.name,
    requiresPassword: !!link.password,
  }
}
