import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError.js'

const prisma = new PrismaClient()

/**
 * 模板列表
 */
export async function listTemplates() {
  return prisma.fieldDefinition.findMany({
    include: {
      fields: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { usageCount: 'desc' },
  })
}

/**
 * 模板详情
 */
export async function getTemplate(id) {
  const template = await prisma.fieldDefinition.findUnique({
    where: { id },
    include: {
      fields: { orderBy: { sortOrder: 'asc' } },
    },
  })
  if (!template) throw new AppError('模板不存在', 404, 'NOT_FOUND')

  return {
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    usageCount: template.usageCount,
    tag: template.tag,
    fields: template.fields.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      required: f.required,
      unit: f.unit,
      searchable: f.searchable,
    })),
  }
}

/**
 * 创建模板
 */
export async function createTemplate({ name, description, category, fields = [] }) {
  const template = await prisma.fieldDefinition.create({
    data: {
      name,
      description: description || '',
      category,
      usageCount: 0,
      fields: {
        create: fields.map((f, i) => ({
          name: f.name,
          type: f.type || 'text',
          required: f.required || false,
          unit: f.unit || null,
          searchable: f.searchable !== false,
          sortOrder: i,
        })),
      },
    },
    include: {
      fields: true,
    },
  })

  return template
}

/**
 * 使用模板创建记录
 * 复制模板 fields 到项目 DataField, 创建预填草稿记录
 */
export async function useTemplate(templateId, projectId, userId) {
  const template = await prisma.fieldDefinition.findUnique({
    where: { id: templateId },
    include: { fields: true },
  })
  if (!template) throw new AppError('模板不存在', 404, 'NOT_FOUND')

  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  // 增加使用计数
  await prisma.fieldDefinition.update({
    where: { id: templateId },
    data: { usageCount: { increment: 1 } },
  })

  // 复制 fields 到项目
  const maxSort = await prisma.dataField.findFirst({
    where: { projectId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  let sortOffset = (maxSort?.sortOrder || 0) + 1

  const fieldMap = new Map()
  for (const f of template.fields) {
    const df = await prisma.dataField.create({
      data: {
        projectId,
        name: f.name,
        type: f.type,
        unit: f.unit,
        required: f.required,
        sortOrder: sortOffset++,
      },
    })
    fieldMap.set(f.id, df.id)
  }

  // 创建预填记录
  const year = new Date().getFullYear()
  const count = await prisma.dataRecord.count({
    where: { code: { startsWith: `EXP-${year}` } },
  })
  const code = `EXP-${year}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(count + 1).padStart(3, '0')}`

  const record = await prisma.dataRecord.create({
    data: {
      code,
      projectId,
      userId,
      title: template.name,
      status: 'draft',
    },
  })

  // 创建 Activity
  await prisma.activity.create({
    data: {
      projectId,
      text: `从模板 "${template.name}" 创建了实验记录`,
      category: '实验',
      target: record.title,
    },
  })

  return { recordId: record.id, templateName: template.name }
}
