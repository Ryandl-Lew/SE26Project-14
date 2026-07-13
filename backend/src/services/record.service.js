import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError.js'
import { buildCSV } from '../utils/csv.js'

const prisma = new PrismaClient()

/**
 * 生成记录编号 EXP-YYYYMMDD-序号
 */
async function generateRecordCode() {
  const now = new Date()
  const prefix = `EXP-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
  const count = await prisma.dataRecord.count({
    where: { code: { startsWith: prefix } },
  })
  return `${prefix}-${String(count + 1).padStart(3, '0')}`
}

/**
 * 记录列表 - 多条件筛选 + 分页
 */
export async function listRecords({ projectId, status, userId, page = 1, pageSize = 20, keyword, startDate, endDate }) {
  const where = {
    ...(projectId && { projectId }),
    ...(status && { status }),
    ...(userId && { userId }),
    ...(keyword && {
      OR: [
        { title: { contains: keyword, mode: 'insensitive' } },
      ],
    }),
    ...(startDate && { recordDate: { gte: new Date(startDate) } }),
    ...(endDate && { recordDate: { lte: new Date(endDate) } }),
  }

  const [items, total] = await Promise.all([
    prisma.dataRecord.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { comments: true, attachments: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.dataRecord.count({ where }),
  ])

  return {
    items: items.map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      experimentType: r.title, // 简化映射
      status: r.status,
      ownerName: r.user.name,
      projectId: r.project.id,
      projectName: r.project.name,
      updatedAt: r.updatedAt.toISOString().replace('T', ' ').slice(0, 16),
      createdAt: r.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
  }
}

/**
 * 创建记录
 */
export async function createRecord({ projectId, userId, title, values = [], location, purpose, recordDate }) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const code = await generateRecordCode()

  // 校验必填字段
  const requiredFields = await prisma.dataField.findMany({
    where: { projectId, required: true },
    select: { id: true, name: true },
  })
  const providedFieldIds = values.map((v) => v.fieldId)
  for (const f of requiredFields) {
    if (!providedFieldIds.includes(f.id)) {
      throw new AppError(`必填字段 "${f.name}" 未提供`, 400, 'MISSING_REQUIRED_FIELD')
    }
  }

  const record = await prisma.dataRecord.create({
    data: {
      code,
      projectId,
      userId,
      title,
      location: location || null,
      purpose: purpose || null,
      recordDate: recordDate ? new Date(recordDate) : new Date(),
      status: 'draft',
      values: {
        create: values.map((v) => ({
          fieldId: v.fieldId,
          value: String(v.value ?? ''),
        })),
      },
    },
  })

  await prisma.activity.create({
    data: {
      projectId,
      text: `创建了实验记录`,
      category: '实验',
      target: record.title,
    },
  })

  return { id: record.id, code: record.code, title: record.title }
}

/**
 * 更新记录
 */
export async function updateRecord(id, { title, values, location, purpose, recordDate, status }) {
  const record = await prisma.dataRecord.findUnique({ where: { id } })
  if (!record) throw new AppError('记录不存在', 404, 'NOT_FOUND')

  const updated = await prisma.dataRecord.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(location !== undefined && { location }),
      ...(purpose !== undefined && { purpose }),
      ...(recordDate !== undefined && { recordDate: new Date(recordDate) }),
      ...(status !== undefined && { status }),
    },
  })

  // Upsert values
  if (values && Array.isArray(values)) {
    for (const v of values) {
      await prisma.recordValue.upsert({
        where: { recordId_fieldId: { recordId: id, fieldId: v.fieldId } },
        create: { recordId: id, fieldId: v.fieldId, value: String(v.value ?? '') },
        update: { value: String(v.value ?? '') },
      })
    }
  }

  return { id: updated.id, title: updated.title }
}

/**
 * 获取记录详情
 */
export async function getRecordDetail(id) {
  const record = await prisma.dataRecord.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      project: { select: { id: true, name: true, code: true } },
      values: {
        include: {
          field: { select: { id: true, name: true, type: true, unit: true } },
        },
      },
      attachments: {
        select: { id: true, fileName: true, filePath: true, mimeType: true, fileSize: true, createdAt: true },
      },
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  })
  if (!record) throw new AppError('记录不存在', 404, 'NOT_FOUND')

  return {
    id: record.id,
    code: record.code,
    title: record.title,
    status: record.status,
    experimentDate: record.recordDate.toISOString().split('T')[0],
    location: record.location,
    purpose: record.purpose,
    conclusion: record.conclusion,
    ownerName: record.user.name,
    projectId: record.project.id,
    projectName: record.project.name,
    projectCode: record.project.code,
    updatedAt: record.updatedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    sections: [{
      id: 'section-1',
      title: '实验数据',
      body: record.purpose || '',
    }],
    values: record.values.map((v) => ({
      fieldId: v.field.id,
      fieldName: v.field.name,
      fieldType: v.field.type,
      fieldUnit: v.field.unit,
      value: v.value,
    })),
    relations: record.attachments.map((a) => ({
      id: a.id,
      label: a.fileName,
      kind: 'attachment',
    })),
    attachments: record.attachments.map((a) => ({
      id: a.id,
      name: a.fileName,
      path: a.filePath,
      size: a.fileSize,
      mimeType: a.mimeType,
      createdAt: a.createdAt.toISOString(),
    })),
    comments: record.comments.map((c) => ({
      id: c.id,
      authorName: c.user.name,
      content: c.content,
      category: c.category,
      createdAt: c.createdAt.toISOString().replace('T', ' ').slice(0, 16),
    })),
  }
}

/**
 * 删除记录 (软删除)
 */
export async function deleteRecord(id) {
  const record = await prisma.dataRecord.findUnique({ where: { id } })
  if (!record) throw new AppError('记录不存在', 404, 'NOT_FOUND')

  await prisma.dataRecord.update({
    where: { id },
    data: { status: 'archived' },
  })

  return { ok: true }
}

/**
 * 提交审核
 */
export async function submitForReview(id) {
  const record = await prisma.dataRecord.findUnique({ where: { id } })
  if (!record) throw new AppError('记录不存在', 404, 'NOT_FOUND')

  const updated = await prisma.dataRecord.update({
    where: { id },
    data: { status: 'pending_review' },
  })

  return { id: updated.id, status: updated.status }
}

/**
 * 审核通过
 */
export async function approveRecord(id) {
  const record = await prisma.dataRecord.findUnique({ where: { id } })
  if (!record) throw new AppError('记录不存在', 404, 'NOT_FOUND')

  const updated = await prisma.dataRecord.update({
    where: { id },
    data: { status: 'completed' },
  })

  await prisma.activity.create({
    data: { projectId: record.projectId, text: '审核通过了实验记录', category: '审核', target: record.title },
  })

  return { id: updated.id, status: updated.status }
}

/**
 * 退回修改
 */
export async function rejectRecord(id, reason, userId) {
  const record = await prisma.dataRecord.findUnique({ where: { id }, include: { project: true } })
  if (!record) throw new AppError('记录不存在', 404, 'NOT_FOUND')

  const updated = await prisma.dataRecord.update({
    where: { id },
    data: { status: 'rejected' },
  })

  // 创建审核意见评论
  await prisma.comment.create({
    data: {
      projectId: record.projectId,
      recordId: id,
      userId,
      content: reason || '请修改后重新提交',
      category: 'review',
    },
  })

  return { id: updated.id, status: updated.status }
}

/**
 * 获取记录评论
 */
export async function getRecordComments(recordId) {
  return prisma.comment.findMany({
    where: { recordId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * 添加评论
 */
export async function addComment(recordId, projectId, userId, { content, category = 'comment' }) {
  return prisma.comment.create({
    data: {
      recordId,
      projectId,
      userId,
      content,
      category,
    },
    include: { user: { select: { id: true, name: true } } },
  })
}

/**
 * CSV 导出
 */
export async function exportRecordsCSV({ projectId, startDate, endDate }) {
  const records = await prisma.dataRecord.findMany({
    where: {
      ...(projectId && { projectId }),
      ...(startDate && { recordDate: { gte: new Date(startDate) } }),
      ...(endDate && { recordDate: { lte: new Date(endDate) } }),
    },
    include: {
      values: {
        include: { field: { select: { name: true } } },
      },
      user: { select: { name: true } },
    },
    orderBy: { recordDate: 'asc' },
  })

  // 收集所有 field 名称作为表头
  const fieldNames = new Set()
  const rowMap = new Map()
  for (const r of records) {
    const row = { '编号': r.code, '标题': r.title, '记录人': r.user.name, '日期': r.recordDate.toISOString().split('T')[0], '状态': r.status }
    for (const v of r.values) {
      fieldNames.add(v.field.name)
      row[v.field.name] = v.value
    }
    rowMap.set(r.id, row)
  }

  const headers = ['编号', '标题', '记录人', '日期', '状态', ...Array.from(fieldNames)]
  const rows = Array.from(rowMap.values()).map((row) => headers.map((h) => row[h] || ''))

  return buildCSV(headers, rows)
}
