import config from '../config/index.js'
import { AppError } from '../utils/AppError.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * 调用 Agent API
 */
async function callAgent(prompt, systemMessage = '你是一个生物实验数据分析专家。') {
  if (!config.agentApiKey || config.agentApiKey === 'sk-placeholder') {
    // 无真实 API Key 时返回模拟结果
    return JSON.stringify({
      summary: '（未配置 Agent API Key，返回模拟分析结果）请设置 AGENT_API_KEY 环境变量以启用真实 AI 分析。',
    })
  }

  try {
    const response = await fetch(`${config.agentApiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.agentApiKey}`,
      },
      body: JSON.stringify({
        model: config.agentModel,
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      throw new Error(`Agent API error: ${response.status}`)
    }

    const data = await response.json()
    return data.choices?.[0]?.message?.content || '{}'
  } catch (err) {
    console.error('[Agent] API 调用失败:', err.message)
    throw new AppError('AI 分析服务暂时不可用，请稍后重试', 503, 'AGENT_UNAVAILABLE')
  }
}

/**
 * AI 助手 - 处理自然语言描述
 */
export async function assist(feature, text, projectId, userId) {
  const prompts = {
    generate: `请根据以下自然语言描述，提取关键实验信息并结构化。返回 JSON 格式：{"experimentType": "实验类型", "structuredFields": [{"label": "字段名", "value": "字段值"}], "completenessScore": 0-100, "suggestion": "补充建议"}。\n描述: ${text}`,
    organize: `请将以下实验记录整理得更规范清晰：\n${text}`,
    summarize: `请对以下实验记录生成摘要：\n${text}`,
    check: `请检查以下实验记录的完整性和规范性，指出缺失或需要改进的地方：\n${text}`,
    analyze: `请分析以下实验数据，给出专业评估：\n${text}`,
  }

  const result = await callAgent(prompts[feature] || prompts.generate)
  try {
    const parsed = JSON.parse(result)
    return { feature, ...parsed }
  } catch {
    return { feature, result }
  }
}

/**
 * 数据分析 - 模型拟合
 */
export async function analyzeData(projectId, fieldId, { model, startDate, endDate }) {
  // 查询时间序列数据
  const field = await prisma.dataField.findUnique({
    where: { id: fieldId },
    select: { name: true, type: true, unit: true },
  })
  if (!field) throw new AppError('数据条目不存在', 404, 'NOT_FOUND')

  const values = await prisma.recordValue.findMany({
    where: { fieldId },
    include: {
      record: {
        select: { id: true, title: true, recordDate: true },
      },
    },
    orderBy: { record: { recordDate: 'asc' } },
  })

  if (values.length < 3) throw new AppError('数据点不足（至少需要3个点）', 400, 'INSUFFICIENT_DATA')

  const dataPoints = values.map((v) => ({
    date: v.record.recordDate.toISOString().split('T')[0],
    value: parseFloat(v.value),
  }))

  const models = {
    linear: '线性回归',
    polynomial: '多项式回归',
    exponential: '指数回归',
    logarithmic: '对数回归',
    sigmoid: 'Sigmoid (逻辑回归)',
  }

  const prompt = `你是一个生物数据分析专家。请对以下实验数据进行数学模型拟合分析。

数据字段: "${field.name}" (${field.unit || '无单位'})
数据点: ${JSON.stringify(dataPoints)}
${model ? `指定模型: ${models[model] || model}` : '请自动推荐最佳拟合模型'}

请返回 JSON 格式：
{
  "model": "选用的数学模型",
  "parameters": { "a": 0, "b": 0, ... },
  "rSquared": 0.95,
  "interpretation": "拟合结果的专业解读",
  "conclusion": "实验结论建议",
  "chartData": {
    "raw": ${JSON.stringify(dataPoints)},
    "fitted": [{"date": "x", "value": y}]
  }
}`

  const result = await callAgent(prompt)
  try {
    return JSON.parse(result)
  } catch {
    return { summary: result }
  }
}

/**
 * 生成实验报告
 */
export async function generateReport(projectId, { template }) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { owner: { select: { name: true } } },
  })
  if (!project) throw new AppError('项目不存在', 404, 'NOT_FOUND')

  const records = await prisma.dataRecord.findMany({
    where: { projectId },
    include: {
      values: {
        include: { field: { select: { name: true, type: true, unit: true } } },
      },
      user: { select: { name: true } },
    },
    orderBy: { recordDate: 'asc' },
  })

  const reportData = records.map((r) => ({
    date: r.recordDate.toISOString().split('T')[0],
    title: r.title,
    recorder: r.user.name,
    fields: r.values.map((v) => ({
      name: v.field.name,
      value: v.value,
      unit: v.field.unit,
    })),
  }))

  const reportType = template === 'summary' ? '摘要' : '完整'

  const prompt = `请为以下生物实验项目生成${reportType}实验报告（Markdown格式）。

项目名称: ${project.name}
项目描述: ${project.description || '无'}
实验数据: ${JSON.stringify(reportData, null, 2)}

报告应包含：
1. 实验概述
2. 实验方法
3. 关键数据汇总
4. 结果分析
5. 结论与建议

请直接返回 Markdown 格式的报告内容。`

  const result = await callAgent(prompt, '你是一个专业的科学实验报告撰写专家，擅长生物实验数据分析和报告编写。')

  return {
    projectName: project.name,
    reportType,
    markdown: result,
    recordCount: records.length,
  }
}
