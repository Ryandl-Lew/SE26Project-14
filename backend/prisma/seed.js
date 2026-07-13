import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('开始播种种子数据...')

  // 清理数据（按依赖顺序）
  await prisma.reminderLog.deleteMany()
  await prisma.reminder.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.shareLink.deleteMany()
  await prisma.publicData.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.recordValue.deleteMany()
  await prisma.dataRecord.deleteMany()
  await prisma.dataField.deleteMany()
  await prisma.fieldTemplate.deleteMany()
  await prisma.fieldDefinition.deleteMany()
  await prisma.projectMember.deleteMany()
  await prisma.project.deleteMany()
  await prisma.user.deleteMany()

  // 创建用户
  const hash = await bcrypt.hash('123456', 10)
  const users = await Promise.all([
    prisma.user.create({ data: { username: 'li', name: '李同学', email: 'li@example.com', password: hash } }),
    prisma.user.create({ data: { username: 'wang', name: '王同学', email: 'wang@example.com', password: hash } }),
    prisma.user.create({ data: { username: 'zhang', name: '张老师', email: 'pi@example.com', password: hash } }),
    prisma.user.create({ data: { username: 'chen', name: '陈同学', email: 'chen@example.com', password: hash } }),
    prisma.user.create({ data: { username: 'zhao', name: '赵同学', email: 'zhao@example.com', password: hash } }),
  ])
  const [li, wang, zhang, chen, zhao] = users
  console.log(`创建 ${users.length} 个用户`)

  // 创建项目
  const projects = await Promise.all([
    prisma.project.create({
      data: {
        code: 'PRJ-2026-001',
        name: 'GFP 融合蛋白表达项目',
        description: '扩增 GFP 片段并验证融合蛋白表达条件。',
        status: 'active',
        ownerId: li.id,
        progress: 68,
      },
    }),
    prisma.project.create({
      data: {
        code: 'PRJ-2026-002',
        name: 'IFN-β 表达检测',
        description: 'qPCR 检测刺激条件下的基因表达变化。',
        status: 'reviewing',
        ownerId: chen.id,
        progress: 42,
      },
    }),
    prisma.project.create({
      data: {
        code: 'PRJ-2026-003',
        name: '细胞转染条件优化',
        description: '比较不同细胞密度和试剂比例对转染效率的影响。',
        status: 'completed',
        ownerId: wang.id,
        progress: 100,
      },
    }),
    prisma.project.create({
      data: {
        code: 'PRJ-2026-004',
        name: 'qPCR 引物验证',
        description: '验证 qPCR 引物特异性与扩增效率。',
        status: 'completed',
        ownerId: chen.id,
        progress: 100,
      },
    }),
  ])
  const [p1, p2, p3, p4] = projects
  console.log(`创建 ${projects.length} 个项目`)

  // 创建项目成员
  const memberData = [
    // p1: 全部5人
    { projectId: p1.id, userId: li.id, role: 'owner' },
    { projectId: p1.id, userId: wang.id, role: 'member' },
    { projectId: p1.id, userId: zhang.id, role: 'reviewer' },
    { projectId: p1.id, userId: chen.id, role: 'member' },
    { projectId: p1.id, userId: zhao.id, role: 'observer' },
    // p2: li, wang, chen
    { projectId: p2.id, userId: chen.id, role: 'owner' },
    { projectId: p2.id, userId: li.id, role: 'member' },
    { projectId: p2.id, userId: wang.id, role: 'reviewer' },
    // p3: li, wang, chen, zhao
    { projectId: p3.id, userId: wang.id, role: 'owner' },
    { projectId: p3.id, userId: li.id, role: 'member' },
    { projectId: p3.id, userId: chen.id, role: 'member' },
    { projectId: p3.id, userId: zhao.id, role: 'reviewer' },
    // p4: li, chen, zhao
    { projectId: p4.id, userId: chen.id, role: 'owner' },
    { projectId: p4.id, userId: li.id, role: 'member' },
    { projectId: p4.id, userId: zhao.id, role: 'member' },
  ]
  await prisma.projectMember.createMany({ data: memberData })
  console.log(`创建 ${memberData.length} 条成员关系`)

  // 创建数据条目
  const fields = [
    { projectId: p1.id, name: '模板 DNA', type: 'text', required: true, sortOrder: 0 },
    { projectId: p1.id, name: '退火温度', type: 'number', unit: '℃', required: true, sortOrder: 1 },
    { projectId: p1.id, name: '电泳结果', type: 'image', sortOrder: 2 },
    { projectId: p1.id, name: '结论', type: 'text', sortOrder: 3 },
    { projectId: p2.id, name: 'Ct 值', type: 'number', required: true, sortOrder: 0 },
    { projectId: p2.id, name: '内参基因', type: 'text', sortOrder: 1 },
    { projectId: p3.id, name: '细胞密度', type: 'number', unit: 'cells/mL', sortOrder: 0 },
    { projectId: p3.id, name: '转染效率', type: 'number', unit: '%', sortOrder: 1 },
    { projectId: p4.id, name: '引物名称', type: 'text', required: true, sortOrder: 0 },
    { projectId: p4.id, name: 'Tm 值', type: 'number', unit: '℃', sortOrder: 1 },
  ]
  const createdFields = await Promise.all(
    fields.map((f) => prisma.dataField.create({ data: f })),
  )
  console.log(`创建 ${createdFields.length} 个数据条目`)

  // 数据记录
  const now = new Date()
  const records = await Promise.all([
    prisma.dataRecord.create({
      data: {
        code: 'EXP-20260707-001',
        projectId: p1.id,
        userId: li.id,
        title: 'PCR 扩增 GFP 片段',
        status: 'pending_review',
        recordDate: new Date('2026-07-07'),
        purpose: '以 Sample-001 为模板扩增 GFP 目标片段。',
        values: {
          create: [
            { fieldId: createdFields[0].id, value: 'Sample-001 pEGFP-N1' },
            { fieldId: createdFields[1].id, value: '58' },
            { fieldId: createdFields[3].id, value: '扩增成功，条带约 750 bp' },
          ],
        },
      },
    }),
    prisma.dataRecord.create({
      data: {
        code: 'EXP-20260706-001',
        projectId: p1.id,
        userId: wang.id,
        title: '质粒 pEGFP-N1 小提',
        status: 'completed',
        recordDate: new Date('2026-07-06'),
        purpose: '提取质粒用于后续转染实验。',
        values: {
          create: [
            { fieldId: createdFields[1].id, value: '55' },
            { fieldId: createdFields[3].id, value: '浓度 185 ng/μL，A260/A280 = 1.85' },
          ],
        },
      },
    }),
    prisma.dataRecord.create({
      data: {
        code: 'EXP-20260706-002',
        projectId: p1.id,
        userId: chen.id,
        title: 'Western blot 验证 GFP 表达',
        status: 'in_progress',
        recordDate: new Date('2026-07-06'),
        purpose: '检测 GFP 融合蛋白表达水平。',
      },
    }),
    prisma.dataRecord.create({
      data: {
        code: 'EXP-20260707-002',
        projectId: p2.id,
        userId: li.id,
        title: 'qPCR 检测 IFN-β 表达',
        status: 'rejected',
        recordDate: new Date('2026-07-07'),
        purpose: '检测 LPS 刺激后 IFN-β mRNA 水平。',
        values: {
          create: [
            { fieldId: createdFields[4].id, value: '22.5' },
            { fieldId: createdFields[5].id, value: 'GAPDH' },
          ],
        },
      },
    }),
    prisma.dataRecord.create({
      data: {
        code: 'EXP-20260705-001',
        projectId: p3.id,
        userId: wang.id,
        title: '转染效率测试 - 第1组',
        status: 'completed',
        recordDate: new Date('2026-07-05'),
        values: {
          create: [
            { fieldId: createdFields[6].id, value: '500000' },
            { fieldId: createdFields[7].id, value: '45' },
          ],
        },
      },
    }),
  ])
  console.log(`创建 ${records.length} 条数据记录`)

  // 创建提醒
  const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 明天
  await prisma.reminder.createMany({
    data: [
      { projectId: p1.id, title: 'GFP 表达观察', remindAt: futureDate, advanceMinutes: 15 },
      { projectId: p1.id, title: '更换培养基', remindAt: new Date(now.getTime() + 48 * 60 * 60 * 1000), advanceMinutes: 30 },
    ],
  })

  // 创建模板
  const pcrTemplate = await prisma.fieldDefinition.create({
    data: {
      name: 'PCR 模板',
      description: '包含模板 DNA、反应体系、退火温度和电泳结果。',
      category: 'molecular',
      usageCount: 128,
      tag: '使用 128 次',
      fields: {
        create: [
          { name: '模板 DNA', type: 'text', required: true, sortOrder: 0 },
          { name: '退火温度', type: 'number', required: true, unit: '℃', sortOrder: 1 },
          { name: '电泳结果图片', type: 'image', sortOrder: 2 },
          { name: '结论', type: 'text', sortOrder: 3 },
        ],
      },
    },
  })

  await prisma.fieldDefinition.createMany({
    data: [
      { name: 'qPCR 模板', description: 'Ct 值、内参基因、重复孔、熔解曲线和相对表达量。', category: 'molecular', usageCount: 64, tag: '实验室模板' },
      { name: '细胞传代模板', description: '细胞密度、消化时间、传代比例、培养基批号和状态观察。', category: 'cell', usageCount: 40, tag: '通用' },
    ],
  })
  console.log('创建 3 个模板')

  // 创建评论
  await prisma.comment.createMany({
    data: [
      { projectId: p1.id, recordId: records[0].id, userId: zhang.id, content: '请补充 Marker 条带说明，并标注目标条带大小。', category: 'review' },
      { projectId: p1.id, recordId: records[0].id, userId: zhang.id, content: '添加审核意见；上一版本已上传电泳图片。', category: 'version_history' },
    ],
  })
  console.log('创建 2 条评论')

  // 创建动态
  await prisma.activity.createMany({
    data: [
      { projectId: p1.id, text: '李同学创建了实验记录', target: 'PCR 扩增 GFP 片段', category: '实验' },
      { projectId: p1.id, text: '王同学上传了项目附件', target: '实验方案.pdf', category: '附件' },
      { projectId: p1.id, text: '张老师评论了实验记录', target: 'PCR 扩增 GFP 片段', category: '评论' },
    ],
  })
  console.log('创建 3 条动态')

  console.log('种子数据播种完成！')
}

main()
  .catch((e) => {
    console.error('种子数据播种失败:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
