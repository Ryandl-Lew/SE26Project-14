/**
 * Mock 数据
 * 数据取自静态原型 bionote-static-legacy.html，仅用于骨架阶段占位展示。
 * TODO: 后端接入后删除本文件，API 层改为真实请求。
 */

/** @type {import('@/domain/models').Project[]} */
export const mockProjects = [
  {
    id: 'p-001',
    code: 'PRJ-2026-001',
    name: 'GFP 融合蛋白表达项目',
    description: '扩增 GFP 片段并验证融合蛋白表达条件。',
    status: 'active',
    ownerName: '李同学',
    currentUserRole: 'owner',
    memberCount: 5,
    recordCount: 12,
    tags: ['GFP', 'PCR', '蛋白表达'],
    createdAt: '2026-07-01',
    updatedAt: '2026-07-07',
  },
  {
    id: 'p-002',
    code: 'PRJ-2026-002',
    name: 'IFN-β 表达检测',
    description: 'qPCR 检测刺激条件下的基因表达变化。',
    status: 'active',
    ownerName: '陈同学',
    currentUserRole: 'member',
    memberCount: 3,
    recordCount: 7,
    tags: ['qPCR', 'IFN-β'],
    createdAt: '2026-06-18',
    updatedAt: '2026-07-07',
  },
  {
    id: 'p-003',
    code: 'PRJ-2026-003',
    name: '细胞转染条件优化',
    description: '比较不同细胞密度和试剂比例对转染效率的影响。',
    status: 'archived',
    ownerName: '王同学',
    currentUserRole: 'member',
    memberCount: 4,
    recordCount: 11,
    tags: ['转染', '细胞'],
    createdAt: '2026-05-12',
    updatedAt: '2026-07-05',
  },
  {
    id: 'p-004',
    code: 'PRJ-2026-004',
    name: 'qPCR 引物验证',
    description: '验证 qPCR 引物特异性与扩增效率。',
    status: 'active',
    ownerName: '陈同学',
    currentUserRole: 'owner',
    memberCount: 3,
    recordCount: 6,
    tags: ['qPCR', '引物'],
    createdAt: '2026-04-09',
    updatedAt: '2026-07-05',
  },
]

/** @type {import('@/domain/models').ExperimentRecordSummary[]} */
export const mockRecords = [
  {
    id: 'r-001',
    code: 'EXP-20260707-001',
    title: 'PCR 扩增 GFP 片段',
    experimentType: 'PCR',
    status: 'pending_review',
    ownerName: '李同学',
    creatorId: 'u-001',
    assignedReviewerId: 'u-003',
    assignedReviewerName: '张老师',
    revision: 'R1',
    projectId: 'p-001',
    projectName: 'GFP 融合蛋白表达项目',
    createdAt: '2026-07-07 09:20',
    updatedAt: '2026-07-07 14:30',
  },
  {
    id: 'r-002',
    code: 'EXP-20260707-002',
    title: 'qPCR 检测 IFN-β 表达',
    experimentType: 'qPCR',
    status: 'rejected',
    ownerName: '李同学',
    creatorId: 'u-001',
    assignedReviewerId: 'u-003',
    assignedReviewerName: '张老师',
    revision: 'R1',
    projectId: 'p-002',
    projectName: 'IFN-β 表达检测',
    createdAt: '2026-07-07 08:40',
    updatedAt: '2026-07-07 11:40',
  },
  {
    id: 'r-003',
    code: 'EXP-20260706-001',
    title: '质粒 pEGFP-N1 小提',
    experimentType: '质粒提取',
    status: 'completed',
    ownerName: '王同学',
    creatorId: 'u-002',
    assignedReviewerId: 'u-003',
    assignedReviewerName: '张老师',
    revision: 'R2',
    projectId: 'p-001',
    projectName: 'GFP 融合蛋白表达项目',
    createdAt: '2026-07-06 13:10',
    updatedAt: '2026-07-06 18:20',
  },
  {
    id: 'r-004',
    code: 'EXP-20260706-002',
    title: 'Western blot 验证 GFP 表达',
    experimentType: 'WB',
    status: 'in_progress',
    ownerName: '陈同学',
    creatorId: 'u-003',
    assignedReviewerId: null,
    assignedReviewerName: null,
    revision: null,
    projectId: 'p-001',
    projectName: 'GFP 融合蛋白表达项目',
    createdAt: '2026-07-06 09:15',
    updatedAt: '2026-07-06 09:15',
  },
  {
    id: 'r-005',
    code: 'EXP-20260703-001',
    title: '测序送样',
    experimentType: '测序',
    status: 'completed',
    ownerName: '陈同学',
    creatorId: 'u-003',
    assignedReviewerId: 'u-001',
    assignedReviewerName: '李同学',
    revision: 'R1',
    projectId: 'p-001',
    projectName: 'GFP 融合蛋白表达项目',
    createdAt: '2026-07-03 09:10',
    updatedAt: '2026-07-03 10:00',
  },
  {
    id: 'r-006',
    code: 'EXP-20260702-001',
    title: 'qPCR 引物扩增效率验证',
    experimentType: 'qPCR',
    status: 'pending_review',
    ownerName: '王同学',
    creatorId: 'u-002',
    assignedReviewerId: 'u-001',
    assignedReviewerName: '李同学',
    revision: 'R2',
    projectId: 'p-004',
    projectName: 'qPCR 引物验证',
    createdAt: '2026-07-02 10:30',
    updatedAt: '2026-07-05 16:20',
  },
]

/** @type {import('@/domain/models').ExperimentRecord} */
export const mockRecordDetail = {
  ...mockRecords[0],
  experimentDate: '2026-07-07',
  location: '分子生物学教学实验室 A203',
  purpose:
    '以 Sample-001 为模板扩增 GFP 目标片段，为后续酶切连接和重组质粒构建提供片段。',
  sections: [
    {
      id: 's-1',
      title: '实验内容',
      body: '本次 PCR 使用 Sample-001 作为模板，GFP-F / GFP-R 作为引物。反应体系总体积 50 μL，退火温度 58℃，循环 35 次。电泳检测结果显示约 750 bp 条带，阴性对照未见明显扩增条带，初步判断 GFP 片段扩增成功。',
    },
    {
      id: 's-2',
      title: '反应体系',
      table: [
        { component: 'Template DNA', amount: '1 μL' },
        { component: 'Forward Primer', amount: '1 μL' },
        { component: 'Reverse Primer', amount: '1 μL' },
        { component: '2x Master Mix', amount: '25 μL' },
        { component: 'ddH2O', amount: '22 μL' },
        { component: 'Total', amount: '50 μL' },
      ],
    },
  ],
  relations: [
    { id: 'rel-1', label: 'Sample-001 pEGFP-N1', kind: 'sample' },
    { id: 'rel-2', label: 'LOT202607 Taq 酶', kind: 'reagent' },
    { id: 'rel-3', label: 'GFP_gel_0707.png', kind: 'attachment' },
    { id: 'rel-4', label: 'PCR_program.csv', kind: 'instrument' },
  ],
}

/** @type {import('@/domain/models').ProjectTimelineItem[]} */
export const mockTimeline = [
  {
    id: 't-1',
    date: '2026-07-07',
    time: '14:30',
    title: '李同学提交了实验记录 R1',
    summary: '「PCR 扩增 GFP 片段」进入审核中，指定张老师审核。',
    category: '审核',
  },
  {
    id: 't-2',
    date: '2026-07-06',
    time: '18:20',
    title: '张老师通过了实验记录',
    summary: '「质粒 pEGFP-N1 小提」审核完成，记录转为只读。',
    category: '审核',
  },
  {
    id: 't-3',
    date: '2026-07-03',
    time: '10:00',
    title: '陈同学创建了实验记录',
    summary: '创建「测序送样」，记录进入进行中状态。',
    category: '记录',
  },
  {
    id: 't-4',
    date: '2026-07-02',
    time: '09:40',
    title: '王同学加入项目',
    summary: '通过项目邀请加入，默认角色为编辑成员。',
    category: '成员',
  },
  {
    id: 't-5',
    date: '2026-07-01',
    time: '10:12',
    title: '李同学创建了项目',
    summary: '项目「GFP 融合蛋白表达项目」开始记录审计事件。',
    category: '项目',
  },
]

/** @type {import('@/domain/models').ProjectAttachment[]} */
export const mockAttachments = [
  { id: 'a-1', name: '实验方案.pdf', kind: 'PDF', size: '2.4 MB', uploader: '李同学', uploadedAt: '2026-07-01 11:30' },
  { id: 'a-2', name: '项目设计图.png', kind: '图片', size: '860 KB', uploader: '王同学', uploadedAt: '2026-07-02 15:20' },
  { id: 'a-3', name: '参考文献.zip', kind: '压缩包', size: '8.1 MB', uploader: '张老师', uploadedAt: '2026-07-03 09:10' },
  { id: 'a-4', name: '项目汇总表.xlsx', kind: '表格', size: '124 KB', uploader: '李同学', uploadedAt: '2026-07-06 17:45' },
]

/** @type {import('@/domain/models').ProjectActivity[]} */
export const mockActivities = [
  { id: 'ac-1', text: '李同学创建了实验记录', target: 'PCR 扩增 GFP 片段', category: '实验', createdAt: '2026-07-07' },
  { id: 'ac-2', text: '王同学上传了项目附件', target: '实验方案.pdf', category: '附件', createdAt: '2026-07-06' },
  { id: 'ac-3', text: '张老师评论了实验记录', target: 'Western blot 验证', category: '评论', createdAt: '2026-07-06' },
]

/** @type {import('@/domain/models').ProjectMember[]} */
export const mockMembers = [
  {
    user: { id: 'u-001', name: '李同学', email: 'li@example.com', avatarText: '李' },
    role: 'owner',
    permissionSummary: '可管理项目、成员和全部记录',
    joinedAt: '2026-07-01',
    lastActiveAt: '2026-07-07',
  },
  {
    user: { id: 'u-002', name: '王同学', email: 'wang@example.com', avatarText: '王' },
    role: 'member',
    permissionSummary: '可查看、可编辑自己的记录',
    joinedAt: '2026-07-01',
    lastActiveAt: '2026-07-07',
  },
  {
    user: { id: 'u-003', name: '张老师', email: 'pi@example.com', avatarText: '张' },
    role: 'reviewer',
    permissionSummary: '可评论、审核实验记录',
    joinedAt: '2026-07-02',
    lastActiveAt: '2026-07-07',
  },
]

/** @type {import('@/domain/models').PermissionMatrixRow[]} */
export const mockPermissionMatrix = [
  { permission: '查看项目', values: { owner: 'yes', member: 'yes', reviewer: 'yes', observer: 'yes' } },
  { permission: '编辑项目信息', values: { owner: 'yes', member: 'no', reviewer: 'no', observer: 'no' } },
  { permission: '新建实验记录', values: { owner: 'yes', member: 'yes', reviewer: 'optional', observer: 'no' } },
  { permission: '审核实验记录', values: { owner: 'yes', member: 'no', reviewer: 'yes', observer: 'no' } },
  { permission: '管理项目成员', values: { owner: 'yes', member: 'no', reviewer: 'no', observer: 'no' } },
  { permission: '上传项目附件', values: { owner: 'yes', member: 'yes', reviewer: 'optional', observer: 'no' } },
]

/** @type {import('@/domain/models').Template[]} */
export const mockTemplates = [
  {
    id: 'tpl-1',
    name: 'PCR 模板',
    description: '包含模板 DNA、引物、反应体系、退火温度、循环数、电泳结果和结论。',
    category: 'molecular',
    experimentType: 'PCR',
    scope: 'system',
    usageCount: 128,
    tag: '使用 128 次',
    fields: [
      { id: 'f-1', name: '模板 DNA', type: 'sample_picker', required: true, unit: '-', searchable: true },
      { id: 'f-2', name: '退火温度', type: 'number', required: true, unit: '℃', searchable: true },
      { id: 'f-3', name: 'PCR 程序', type: 'table', required: true, unit: '-', searchable: false },
      { id: 'f-4', name: '电泳结果图片', type: 'image', required: false, unit: '-', searchable: true },
    ],
  },
  {
    id: 'tpl-2',
    name: 'qPCR 模板',
    description: '包含 Ct 值、内参基因、重复孔、熔解曲线和相对表达量计算。',
    category: 'molecular',
    experimentType: 'qPCR',
    scope: 'system',
    usageCount: 64,
    tag: '实验室模板',
    fields: [],
  },
  {
    id: 'tpl-3',
    name: '细胞传代模板',
    description: '记录细胞密度、消化时间、传代比例、培养基批号和状态观察。',
    category: 'cell',
    experimentType: '细胞培养',
    scope: 'system',
    usageCount: 40,
    tag: '通用',
    fields: [],
  },
  {
    id: 'tpl-4',
    name: '我的 Western blot 记录',
    description: '适合课程项目的简化 WB 记录结构，包含上样量、抗体信息和曝光结果。',
    category: 'protein',
    experimentType: 'Western blot',
    scope: 'personal',
    ownerId: 'u-001',
    usageCount: 9,
    tag: '我的模板',
    fields: [
      { id: 'f-5', name: '上样量', type: 'number', required: true, unit: 'μg', searchable: true },
      { id: 'f-6', name: '一抗信息', type: 'text', required: true, unit: '-', searchable: true },
      { id: 'f-7', name: '曝光结果', type: 'image', required: false, unit: '-', searchable: false },
    ],
  },
]

/** @type {import('@/domain/models').DashboardStat[]} */
export const mockDashboardStats = [
  { label: '我参与的项目', value: 6, note: '点击后进入项目管理', icon: '▣' },
  { label: '进行中的项目', value: 3, note: 'GFP 项目本周更新 4 次', icon: '↗' },
  { label: '本周新增实验', value: 12, note: '8 条来自当前项目', icon: '✎' },
  { label: '待处理记录', value: 2, note: '含 1 条待审核记录', icon: '!' },
]

/** @type {import('@/domain/models').TodoItem[]} */
export const mockTodos = [
  { id: 'td-1', title: '补充 qPCR 结果', badgeText: '今天 18:00', description: '导师要求增加熔解曲线截图和重复组说明' },
  { id: 'td-2', title: 'PCR 记录等待审核', badgeText: '实验记录', description: '所属项目：GFP 融合蛋白表达 · 2026-07-07' },
  { id: 'td-3', title: '处理 3 条项目评论', badgeText: '评论', description: '张老师评论了 Western blot 验证记录' },
]

/** @type {import('@/domain/models').NotificationItem[]} */
export const mockNotifications = [
  { id: 'n-1', title: 'AI 助手', badgeText: '草稿', description: '可从自然语言描述生成实验记录初稿' },
  { id: 'n-2', title: '评论提醒', badgeText: '审核', description: '张老师评论了 PCR 扩增 GFP 片段' },
]

/** @type {import('@/domain/models').Comment[]} */
export const mockComments = [
  {
    id: 'c-1',
    authorName: '张老师',
    content: '请补充 Marker 条带说明，并标注目标条带大小。',
    category: '审核意见',
    createdAt: '2026-07-07 14:00',
  },
  {
    id: 'c-2',
    authorName: '张老师',
    content: '添加审核意见；上一版本 v2 由李同学上传电泳图片。',
    category: '版本历史',
    createdAt: '2026-07-07 13:30',
  },
]

/** @type {import('@/domain/models').SearchHit[]} */
export const mockSearchHits = [
  { id: 'sh-1', entityType: 'record', title: 'PCR 扩增 GFP 片段', snippet: '匹配：标题、标签、实验目的 · 最近修改 2026-07-07 16:00' },
  { id: 'sh-2', entityType: 'project', title: 'GFP 融合蛋白表达项目', snippet: '项目编号 PRJ-2026-001 · 负责人 李同学 · 实验记录 12 条 · 最近更新 2026-07-07' },
  { id: 'sh-3', entityType: 'template', title: 'PCR 实验模板', snippet: '实验类型 PCR · 分类 分子生物学 · 使用 128 次 · 操作：预览 / 使用' },
  { id: 'sh-4', entityType: 'attachment', title: 'GFP_gel_0707.png', snippet: '所属位置：实验附件 / PCR 扩增 GFP 片段 · 操作：预览 / 下载 / 定位' },
]

/** @type {import('@/domain/models').AiAssistResult} */
export const mockAiResult = {
  feature: 'generate',
  structuredFields: [
    { label: '实验类型', value: 'PCR' },
    { label: '模板', value: 'Sample-001' },
    { label: '引物', value: 'GFP-F / GFP-R' },
    { label: '退火温度', value: '58℃' },
    { label: '循环数', value: '35' },
    { label: '结论', value: '扩增成功' },
  ],
  completenessScore: 78,
  suggestion: '建议补充 Taq 酶批号、电泳结果图片和最终结论。',
}
