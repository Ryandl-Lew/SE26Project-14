import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError.js'

const prisma = new PrismaClient()

/**
 * 生成项目编号 PRJ-YYYY-序号
 */
async function generateProjectCode() {
  const year = new Date().getFullYear()
  const count = await prisma.project.count({
    where: { code: { startsWith: `PRJ-${year}` } },
  })
  return `PRJ-${year}-${String(count + 1).padStart(3, '0')}`
}

/**
 * 创建项目动态
 */
async function createActivity(projectId, text, category, target) {
  return prisma.activity.create({
    data: { projectId, text, category, target: target || null },
  })
}

/**
 * 获取用户有权访问的项目 ID 列表
 */
async function getUserProjectIds(userId) {
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    select: { projectId: true },
  })
  return memberships.map((m) => m.projectId)
}

/**
 * 项目列表 - 分页 + 搜索 + 筛选
 */
export async function listProjects({ keyword, status, page = 1, pageSize = 20, userId }) {
  const userProjectIds = await getUserProjectIds(userId)
  if (userProjectIds.length === 0) {
    return { items: [], total: 0, page, pageSize }
  }

  const where = {
    id: { in: userProjectIds },
    ...(status && { status }),
    ...(keyword && {
      OR: [
        { name: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ],
    }),
  }

  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { members: true, records: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.project.count({ where }),
  ])

  return {
    items: items.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      description: p.description,
      status: p.status,
      progress: p.progress,
      ownerName: p.owner.name,
      memberCount: p._count.members,
      recordCount: p._count.records,
      updatedAt: p.updatedAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  }
}

/**
 * 创建项目
 */
export async function createProject({ name, description, userId }) {
  const code = await generateProjectCode()
  const project = await prisma.project.create({
    data: {
      code,
      name,
      description,
      ownerId: userId,
      members: {
        create: { userId, role: 'owner' },
      },
    },
    include: {
      owner: { select: { id: true, name: true } },
    },
  })

  await createActivity(project.id, `${project.owner.name} 创建了项目`, '项目', project.name)

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    description: project.description,
    status: project.status,
    progress: project.progress,
    ownerName: project.owner.name,
    memberCount: 1,
    recordCount: 0,
    updatedAt: project.updatedAt.toISOString(),
  }
}

/**
 * 获取项目详情
 */
export async function getProject(id) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, avatarUrl: true } },
      _count: { select: { members: true, records: true } },
    },
  })
  if (!project) {
    throw new AppError('项目不存在', 404, 'NOT_FOUND')
  }

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    description: project.description,
    status: project.status,
    progress: project.progress,
    isPublic: project.isPublic,
    owner: {
      id: project.owner.id,
      name: project.owner.name,
      email: project.owner.email,
      avatarText: project.owner.name?.charAt(0),
      avatarUrl: project.owner.avatarUrl,
    },
    memberCount: project._count.members,
    recordCount: project._count.records,
    updatedAt: project.updatedAt.toISOString(),
    createdAt: project.createdAt.toISOString(),
  }
}

/**
 * 更新项目
 */
export async function updateProject(id, data) {
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const updated = await prisma.project.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.progress !== undefined && { progress: data.progress }),
    },
    include: { owner: { select: { name: true } } },
  })

  await createActivity(id, '项目信息已更新', '项目')

  return {
    id: updated.id,
    code: updated.code,
    name: updated.name,
    description: updated.description,
    status: updated.status,
    progress: updated.progress,
    updatedAt: updated.updatedAt.toISOString(),
  }
}

/**
 * 归档项目 (软删除)
 */
export async function archiveProject(id) {
  const project = await prisma.project.findUnique({ where: { id } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  await prisma.project.update({
    where: { id },
    data: { status: 'archived' },
  })

  await createActivity(id, '项目已归档', '项目', project.name)

  return { ok: true }
}

/**
 * 项目时间线 (记录按日期排序)
 */
export async function getProjectTimeline(projectId) {
  const records = await prisma.dataRecord.findMany({
    where: { projectId },
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      recordDate: true,
      user: { select: { name: true } },
      _count: { select: { comments: true, attachments: true } },
    },
    orderBy: { recordDate: 'desc' },
  })

  return records.map((r) => ({
    id: r.id,
    date: r.recordDate.toISOString().split('T')[0],
    title: r.title,
    summary: `编号: ${r.code} · 负责人: ${r.user.name} · 状态: ${r.status} · 附件 ${r._count.attachments} · 评论 ${r._count.comments}`,
  }))
}

/**
 * 项目动态
 */
export async function getProjectActivities(projectId) {
  const activities = await prisma.activity.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })
  return activities.map((a) => ({
    id: a.id,
    text: a.text,
    target: a.target,
    category: a.category,
    createdAt: a.createdAt.toISOString().split('T')[0],
  }))
}

/**
 * 项目附件列表 (汇总所有记录的附件)
 */
export async function getProjectAttachments(projectId) {
  const records = await prisma.dataRecord.findMany({
    where: { projectId },
    select: { id: true },
  })
  const recordIds = records.map((r) => r.id)
  if (recordIds.length === 0) return []

  const attachments = await prisma.attachment.findMany({
    where: { recordId: { in: recordIds } },
    select: { id: true, fileName: true, mimeType: true, fileSize: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return attachments.map((a) => ({
    id: a.id,
    name: a.fileName,
    kind: a.mimeType?.includes('image') ? 'image' : a.mimeType?.includes('pdf') ? 'pdf' : a.mimeType?.includes('excel') || a.mimeType?.includes('spreadsheet') ? 'excel' : a.mimeType?.includes('zip') ? 'zip' : 'file',
    fileSize: a.fileSize,
    createdAt: a.createdAt.toISOString(),
  }))
}

/**
 * 项目成员列表
 */
export async function getProjectMembers(projectId) {
  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return members.map((m) => ({
    user: {
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
      avatarText: m.user.name?.charAt(0),
      avatarUrl: m.user.avatarUrl,
    },
    role: m.role,
    permissionSummary: {
      owner: '可管理项目、成员和全部记录',
      member: '可查看、可编辑自己的记录',
      reviewer: '可评论、审核实验记录',
      observer: '只读查看',
    }[m.role] || '未知',
    joinedAt: m.joinedAt.toISOString(),
    lastActiveAt: m.joinedAt.toISOString(),
  }))
}

/**
 * 添加项目成员
 */
export async function addMember(projectId, userId, role = 'member') {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError('用户不存在', 404, 'NOT_FOUND')

  const existing = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (existing) throw new AppError('该用户已是项目成员', 409, 'ALREADY_MEMBER')

  await prisma.projectMember.create({
    data: { projectId, userId, role },
  })

  await createActivity(projectId, `${user.name} 加入了项目`, '成员', user.name)
  return { ok: true }
}

/**
 * 修改成员角色
 */
export async function updateMemberRole(projectId, userId, role) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (!member) throw new AppError('成员不存在', 404, 'NOT_FOUND')

  await prisma.projectMember.update({
    where: { projectId_userId: { projectId, userId } },
    data: { role },
  })

  return { ok: true }
}

/**
 * 移除成员
 */
export async function removeMember(projectId, userId) {
  const member = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
  })
  if (!member) throw new AppError('成员不存在', 404, 'NOT_FOUND')
  if (member.role === 'owner') throw new AppError('不能移除项目负责人', 400, 'CANNOT_REMOVE_OWNER')

  await prisma.projectMember.delete({
    where: { projectId_userId: { projectId, userId } },
  })

  return { ok: true }
}

/**
 * 权限矩阵 (静态)
 */
export async function getPermissionMatrix(_projectId) {
  return [
    { permission: '查看项目', values: { owner: 'yes', member: 'yes', reviewer: 'yes', observer: 'yes' } },
    { permission: '编辑项目信息', values: { owner: 'yes', member: 'no', reviewer: 'no', observer: 'no' } },
    { permission: '新建实验记录', values: { owner: 'yes', member: 'yes', reviewer: 'optional', observer: 'no' } },
    { permission: '审核实验记录', values: { owner: 'yes', member: 'no', reviewer: 'yes', observer: 'no' } },
    { permission: '管理项目成员', values: { owner: 'yes', member: 'no', reviewer: 'no', observer: 'no' } },
    { permission: '上传项目附件', values: { owner: 'yes', member: 'yes', reviewer: 'optional', observer: 'no' } },
  ]
}
