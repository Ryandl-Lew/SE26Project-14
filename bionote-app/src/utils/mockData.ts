import type { Project, ProjectMember, ProjectAttachment, ProjectActivity, TimelineEntry } from '@/types/project';
import type { ExperimentRecord, RecordTreeGroup, ReactionComponent, RecordComment, RecordAttachment } from '@/types/record';
import type { Template, TemplateField } from '@/types/template';
import type { User } from '@/types/user';

// ── Current User ────────────────────────────────────────────
export const currentUser: User = {
  name: '李同学',
  email: 'li@example.com',
  avatar: '李',
  role: 'owner',
  lab: '分子生物学教学实验室',
};

// ── Projects ────────────────────────────────────────────────
export const projects: Project[] = [
  {
    id: 'proj-1',
    projectNo: 'PRJ-2026-001',
    name: 'GFP 融合蛋白表达项目',
    description: '扩增 GFP 片段并验证融合蛋白表达条件。',
    status: 'active',
    progress: 68,
    owner: '李同学',
    memberCount: 5,
    experimentCount: 12,
    updatedAt: '2026-07-07',
    tags: ['GFP', 'PCR', '蛋白表达'],
  },
  {
    id: 'proj-2',
    projectNo: 'PRJ-2026-002',
    name: 'IFN-β 表达检测',
    description: 'qPCR 检测刺激条件下的基因表达变化。',
    status: 'pending_review',
    progress: 42,
    owner: '陈同学',
    memberCount: 3,
    experimentCount: 7,
    updatedAt: '2026-07-07',
    tags: ['qPCR', '基因表达'],
  },
  {
    id: 'proj-3',
    projectNo: 'PRJ-2026-003',
    name: '细胞转染条件优化',
    description: '比较不同细胞密度和试剂比例对转染效率的影响。',
    status: 'completed',
    progress: 100,
    owner: '王同学',
    memberCount: 4,
    experimentCount: 11,
    updatedAt: '2026-07-05',
    tags: ['转染', '细胞培养'],
  },
];

// ── Recent Projects (table view on dashboard) ───────────────
export const recentProjects = [
  { id: 'proj-1', name: 'GFP 融合蛋白表达', status: 'active' as const, owner: '李同学', memberCount: 5, updatedAt: '2026-07-07' },
  { id: 'proj-2', name: '细胞转染条件优化', status: 'paused' as const, owner: '王同学', memberCount: 4, updatedAt: '2026-07-06' },
  { id: 'proj-3', name: 'qPCR 引物验证', status: 'completed' as const, owner: '陈同学', memberCount: 3, updatedAt: '2026-07-05' },
];

// ── Project Detail (GFP project) ────────────────────────────
export const gfpProjectMembers: ProjectMember[] = [
  { name: '李同学', email: 'li@example.com', role: 'owner', permissions: '可管理项目、成员和全部记录', joinedAt: '2026-07-01', lastActive: '2026-07-07' },
  { name: '王同学', email: 'wang@example.com', role: 'member', permissions: '可查看、可编辑自己的记录', joinedAt: '2026-07-01', lastActive: '2026-07-07' },
  { name: '张老师', email: 'pi@example.com', role: 'reviewer', permissions: '可评论、审核实验记录', joinedAt: '2026-07-02', lastActive: '2026-07-07' },
];

export const gfpProjectAttachments: ProjectAttachment[] = [
  { name: '实验方案.pdf', type: 'PDF' },
  { name: '项目设计图.png', type: '图片' },
  { name: '参考文献.zip', type: 'ZIP' },
  { name: '项目汇总表.xlsx', type: 'Excel' },
];

export const gfpProjectActivities: ProjectActivity[] = [
  { actor: '李同学', action: '创建了实验记录', target: 'PCR 扩增 GFP 片段', time: '今天' },
  { actor: '王同学', action: '上传了项目附件', target: '实验方案.pdf', time: '昨天' },
  { actor: '张老师', action: '评论了实验记录', target: 'Western blot 验证', time: '2天前' },
];

export const gfpTimeline: TimelineEntry[] = [
  { date: '2026-07-07', title: 'PCR 扩增 GFP 片段', type: 'PCR', owner: '李同学', status: 'completed', summary: '成功扩增出约 750 bp 条带', attachmentCount: 2, commentCount: 1 },
  { date: '2026-07-06', title: '质粒 pEGFP-N1 小提', type: '质粒提取', owner: '王同学', status: 'active', summary: '浓度 185 ng/μL，等待补充电泳图。', attachmentCount: 0, commentCount: 0 },
  { date: '2026-07-03', title: '测序送样', type: '测序', owner: '陈同学', status: 'completed', summary: '', attachmentCount: 1, commentCount: 0 },
];

// ── Experiment Records ──────────────────────────────────────
export const recentRecords: ExperimentRecord[] = [
  { id: 'rec-1', expNo: 'EXP-20260707-001', title: 'PCR 扩增 GFP 片段', type: 'PCR', status: 'pending_review', projectId: 'proj-1', projectName: 'GFP 融合蛋白表达项目', owner: '李同学', date: '2026-07-07', updatedAt: '2026-07-07T14:30', purpose: '', keyResult: '' },
  { id: 'rec-2', expNo: 'EXP-20260707-002', title: 'qPCR 检测 IFN-β 表达', type: 'qPCR', status: 'rejected', projectId: 'proj-2', projectName: 'IFN-β 表达检测', owner: '李同学', date: '2026-07-07', updatedAt: '2026-07-07T11:40', purpose: '', keyResult: '' },
  { id: 'rec-3', expNo: 'EXP-20260706-001', title: '质粒 pEGFP-N1 小提', type: '质粒提取', status: 'completed', projectId: 'proj-1', projectName: 'GFP 融合蛋白表达项目', owner: '王同学', date: '2026-07-06', updatedAt: '2026-07-06T18:20', purpose: '', keyResult: '' },
  { id: 'rec-4', expNo: 'EXP-20260706-002', title: 'Western blot 验证 GFP 表达', type: 'Western blot', status: 'active', projectId: 'proj-1', projectName: 'GFP 融合蛋白表达项目', owner: '陈同学', date: '2026-07-06', updatedAt: '2026-07-06T09:15', purpose: '', keyResult: '' },
];

export const recordTreeGroups: RecordTreeGroup[] = [
  {
    label: '2026-07',
    count: 4,
    records: [
      { id: 'rec-1', title: 'PCR 扩增 GFP 片段', type: 'PCR', status: 'completed', date: '2026-07-07', pageJump: 'detail' },
      { id: 'rec-5', title: '琼脂糖凝胶电泳验证', type: '电泳', status: 'completed', date: '2026-07-07', pageJump: 'detail' },
      { id: 'rec-3', title: '质粒 pEGFP-N1 小提', type: '质粒提取', status: 'active', date: '2026-07-06', pageJump: 'editor' },
      { id: 'rec-6', title: '测序送样', type: '测序', status: 'completed', date: '2026-07-03', pageJump: 'detail' },
    ],
  },
  {
    label: '2026-06',
    count: 5,
    records: [
      { id: 'rec-7', title: '双酶切载体准备', type: '酶切', status: 'completed', date: '2026-06-28', pageJump: 'detail' },
      { id: 'rec-8', title: 'T4 连接反应', type: '连接', status: 'completed', date: '2026-06-29', pageJump: 'detail' },
      { id: 'rec-9', title: '感受态细胞转化', type: '转化', status: 'draft', date: '2026-06-30', pageJump: 'editor' },
    ],
  },
  {
    label: '项目资料',
    count: 3,
    records: [
      { id: 'rec-10', title: '实验方案与引物设计', type: '方案', status: 'completed', date: '2026-06-20', pageJump: 'detail' },
      { id: 'rec-11', title: '样品与质粒编号表', type: '清单', status: 'completed', date: '2026-06-20', pageJump: 'detail' },
    ],
  },
];

// ── Record Detail (PCR record) ──────────────────────────────
export const pcrReactionComponents: ReactionComponent[] = [
  { name: 'Template DNA', code: 'Sample-001', volume: '1 μL', notes: 'pEGFP-N1 质粒' },
  { name: 'Forward Primer', code: 'GFP-F', volume: '1 μL', notes: '10 μM' },
  { name: 'Reverse Primer', code: 'GFP-R', volume: '1 μL', notes: '10 μM' },
  { name: '2x Master Mix', code: 'LOT202607', volume: '25 μL', notes: 'Taq DNA Polymerase' },
];

export const pcrReactionTable: { component: string; volume: string }[] = [
  { component: 'Template DNA', volume: '1 μL' },
  { component: 'Forward Primer', volume: '1 μL' },
  { component: 'Reverse Primer', volume: '1 μL' },
  { component: '2x Master Mix', volume: '25 μL' },
  { component: 'ddH₂O', volume: '22 μL' },
  { component: 'Total', volume: '50 μL' },
];

export const pcrComments: RecordComment[] = [
  { author: '张老师', time: '2026-07-07 14:00', content: '请补充 Marker 条带说明，并标注目标条带大小。', type: '审核意见' },
  { author: 'v3 · 张老师', time: '', content: '添加审核意见；上一版本 v2 由李同学上传电泳图片。', type: '版本历史' },
];

export const pcrAttachments: RecordAttachment[] = [
  { name: 'Sample-001 pEGFP-N1', type: '样品', badge: 'completed' },
  { name: 'LOT202607 Taq 酶', type: '试剂', badge: 'active' },
  { name: 'GFP_gel_0707.png', type: '图片', badge: 'completed' },
  { name: 'PCR_program.csv', type: '仪器数据', badge: 'pending_review' },
];

// ── Editor Form Defaults ────────────────────────────────────
export const editorDefaults = {
  title: 'PCR 扩增 GFP 片段',
  type: 'PCR',
  project: 'GFP 质粒构建项目',
  date: '2026-07-07',
  owner: '李同学',
  location: '分子生物学教学实验室 A203',
  purpose: '以 Sample-001 为模板扩增 GFP 目标片段，为后续酶切连接和重组质粒构建提供片段。',
  status: 'active' as const,
};

// ── Templates ───────────────────────────────────────────────
export const templates: Template[] = [
  { id: 'tpl-1', name: 'PCR 模板', category: '分子生物学', description: '包含模板 DNA、引物、反应体系、退火温度、循环数、电泳结果和结论。', usageCount: 128, badge: '使用 128 次', badgeColor: 'blue' },
  { id: 'tpl-2', name: 'qPCR 模板', category: '分子生物学', description: '包含 Ct 值、内参基因、重复孔、熔解曲线和相对表达量计算。', usageCount: 0, badge: '实验室模板', badgeColor: 'green' },
  { id: 'tpl-3', name: '细胞传代模板', category: '细胞生物学', description: '记录细胞密度、消化时间、传代比例、培养基批号和状态观察。', usageCount: 0, badge: '通用', badgeColor: 'gray' },
];

export const pcrTemplateFields: TemplateField[] = [
  { name: '模板 DNA', type: '样品选择器', required: true, unit: '-', searchable: true },
  { name: '退火温度', type: '数字', required: true, unit: '℃', searchable: true },
  { name: 'PCR 程序', type: '表格', required: true, unit: '-', searchable: false },
  { name: '电泳结果图片', type: '图片上传', required: false, unit: '-', searchable: true },
];

// ── Todos & Notices ─────────────────────────────────────────
export const todos = [
  { title: '补充 qPCR 结果', badge: '今天 18:00', badgeColor: 'amber' as const, detail: '导师要求增加熔解曲线截图和重复组说明' },
  { title: 'PCR 记录等待审核', badge: '实验记录', badgeColor: 'blue' as const, detail: '所属项目：GFP 融合蛋白表达 · 2026-07-07' },
  { title: '处理 3 条项目评论', badge: '评论', badgeColor: 'red' as const, detail: '张老师评论了 Western blot 验证记录' },
];

export const notices = [
  { title: 'AI 助手', badge: '草稿', badgeColor: 'amber' as const, detail: '可从自然语言描述生成实验记录初稿' },
  { title: '评论提醒', badge: '审核', badgeColor: 'blue' as const, detail: '张老师评论了 PCR 扩增 GFP 片段' },
];

// ── Search Results ──────────────────────────────────────────
export const searchResults = [
  { title: 'PCR 扩增 GFP 片段', badge: '实验记录', badgeColor: 'amber' as const, detail: '匹配：标题、标签、实验目的 · 最近修改 2026-07-07 16:00' },
  { title: 'GFP 融合蛋白表达项目', badge: '项目', badgeColor: 'violet' as const, detail: '项目编号 PRJ-2026-001 · 负责人 李同学 · 实验记录 12 条 · 最近更新 2026-07-07' },
  { title: 'PCR 实验模板', badge: '模板', badgeColor: 'green' as const, detail: '实验类型 PCR · 分类 分子生物学 · 使用 128 次 · 操作：预览 / 使用' },
  { title: 'GFP_gel_0707.png', badge: '附件', badgeColor: 'blue' as const, detail: '所属位置：实验附件 / PCR 扩增 GFP 片段 · 操作：预览 / 下载 / 定位' },
];

// ── Team / Permissions ──────────────────────────────────────
export const teamMembers = gfpProjectMembers;

export const permissionMatrix = [
  { permission: '查看项目', owner: true, member: true, reviewer: true, observer: true },
  { permission: '编辑项目信息', owner: true, member: false, reviewer: false, observer: false },
  { permission: '新建实验记录', owner: true, member: true, reviewer: '可选', observer: false },
  { permission: '审核实验记录', owner: true, member: false, reviewer: true, observer: false },
  { permission: '管理项目成员', owner: true, member: false, reviewer: false, observer: false },
  { permission: '上传项目附件', owner: true, member: true, reviewer: '可选', observer: false },
];

// ── AI Page ─────────────────────────────────────────────────
export const aiStructuredResult = [
  { label: '实验类型', value: 'PCR' },
  { label: '模板', value: 'Sample-001' },
  { label: '引物', value: 'GFP-F / GFP-R' },
  { label: '退火温度', value: '58℃' },
  { label: '循环数', value: '35' },
  { label: '结论', value: '扩增成功' },
];

export const aiDefaultInput = '今天做了 PCR，用 Sample-001 做模板，引物是 GFP-F/GFP-R，退火温度 58℃，循环 35 次，跑胶后有一条 750 bp 的条带。';
