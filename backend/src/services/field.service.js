import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError.js'

const prisma = new PrismaClient()

/**
 * 获取项目的数据条目列表
 */
export async function listFields(projectId) {
  const fields = await prisma.dataField.findMany({
    where: { projectId },
    orderBy: { sortOrder: 'asc' },
  })
  return fields
}

/**
 * 创建数据条目
 */
export async function createField(projectId, { name, type, unit, required, groupName }) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const maxSort = await prisma.dataField.findFirst({
    where: { projectId },
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })

  const field = await prisma.dataField.create({
    data: {
      projectId,
      name,
      type,
      unit: unit || null,
      required: required || false,
      groupName: groupName || null,
      sortOrder: (maxSort?.sortOrder || 0) + 1,
    },
  })

  return field
}

/**
 * 更新数据条目
 */
export async function updateField(fieldId, data) {
  const field = await prisma.dataField.findUnique({ where: { id: fieldId } })
  if (!field) throw new AppError('数据条目不存在', 404, 'NOT_FOUND')

  const updated = await prisma.dataField.update({
    where: { id: fieldId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.unit !== undefined && { unit: data.unit }),
      ...(data.required !== undefined && { required: data.required }),
      ...(data.groupName !== undefined && { groupName: data.groupName }),
    },
  })

  return updated
}

/**
 * 删除数据条目
 */
export async function deleteField(fieldId) {
  const field = await prisma.dataField.findUnique({ where: { id: fieldId } })
  if (!field) throw new AppError('数据条目不存在', 404, 'NOT_FOUND')

  await prisma.dataField.delete({ where: { id: fieldId } })
  return { ok: true }
}

/**
 * 拖拽重排序
 */
export async function reorderFields(projectId, orderedFieldIds) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const updates = orderedFieldIds.map((fieldId, index) =>
    prisma.dataField.update({
      where: { id: fieldId },
      data: { sortOrder: index },
    }),
  )
  await Promise.all(updates)

  return { ok: true }
}
