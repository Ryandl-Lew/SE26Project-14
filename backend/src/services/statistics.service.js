import { PrismaClient } from '@prisma/client'
import { AppError } from '../utils/AppError.js'

const prisma = new PrismaClient()

/**
 * 项目数据聚合统计
 */
export async function getProjectStatistics(projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const numericFields = await prisma.dataField.findMany({
    where: { projectId, type: 'number' },
    select: { id: true, name: true, unit: true },
  })

  const stats = []
  for (const field of numericFields) {
    const values = await prisma.recordValue.findMany({
      where: { fieldId: field.id },
      select: { value: true },
    })

    const nums = values.map((v) => parseFloat(v.value)).filter((n) => !isNaN(n))
    if (nums.length === 0) continue

    const sum = nums.reduce((a, b) => a + b, 0)
    const avg = sum / nums.length
    const max = Math.max(...nums)
    const min = Math.min(...nums)
    const variance = nums.reduce((s, n) => s + (n - avg) ** 2, 0) / nums.length
    const stddev = Math.sqrt(variance)

    stats.push({
      fieldId: field.id,
      fieldName: field.name,
      unit: field.unit,
      count: nums.length,
      max: Math.round(max * 1000) / 1000,
      min: Math.round(min * 1000) / 1000,
      avg: Math.round(avg * 1000) / 1000,
      stddev: Math.round(stddev * 1000) / 1000,
    })
  }

  return stats
}

/**
 * 时间序列数据
 */
export async function getTimeSeriesData(projectId, fieldId, { startDate, endDate } = {}) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const field = await prisma.dataField.findUnique({ where: { id: fieldId } })
  if (!field) throw new AppError('数据条目不存在', 404, 'NOT_FOUND')

  const where = { fieldId }
  const values = await prisma.recordValue.findMany({
    where,
    include: {
      record: {
        select: { id: true, title: true, recordDate: true },
      },
    },
    orderBy: { record: { recordDate: 'asc' } },
  })

  return values.map((v) => ({
    date: v.record.recordDate.toISOString().split('T')[0],
    value: parseFloat(v.value) || v.value,
    recordId: v.record.id,
    recordTitle: v.record.title,
  }))
}

/**
 * 记录概览
 */
export async function getRecordOverview(projectId) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const [totalRecords, statusDistribution, last7Days] = await Promise.all([
    prisma.dataRecord.count({ where: { projectId } }),
    (async () => {
      const groups = await prisma.dataRecord.groupBy({
        by: ['status'],
        where: { projectId },
        _count: true,
      })
      return Object.fromEntries(groups.map((g) => [g.status, g._count]))
    })(),
    (async () => {
      const days = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const start = new Date(d)
        start.setHours(0, 0, 0, 0)
        const end = new Date(d)
        end.setHours(23, 59, 59, 999)
        const count = await prisma.dataRecord.count({
          where: { projectId, createdAt: { gte: start, lte: end } },
        })
        days.push({ date: d.toISOString().split('T')[0], count })
      }
      return days
    })(),
  ])

  return {
    totalRecords,
    statusDistribution,
    last7Days,
  }
}
