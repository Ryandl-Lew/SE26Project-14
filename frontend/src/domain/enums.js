/**
 * 业务枚举与中文标签映射（运行时常量）
 * 集中管理各领域的状态、角色、分类等取值及其展示文本、徽章色系。
 */

/* ----------------------------- 用户 / 角色 ----------------------------- */

/**
 * 项目内角色（按项目授予，权限范围见角色权限矩阵）
 * owner   项目负责人：全部权限
 * editor  可编辑成员：可新建/编辑实验记录、上传附件
 * viewer  只读成员：仅查看与导出
 * pending 待审核成员：已申请加入，等待负责人审批
 * @typedef {'owner'|'editor'|'viewer'|'pending'} ProjectRole
 */
export const PROJECT_ROLE_LABELS = {
  owner: '项目负责人',
  editor: '可编辑成员',
  viewer: '只读成员',
  pending: '待审核成员',
}

/** 角色徽章色系 */
export const PROJECT_ROLE_TONES = {
  owner: 'violet',
  editor: 'green',
  viewer: 'blue',
  pending: 'amber',
}

/** 角色分组展示顺序与说明（团队与权限页使用） */
export const PROJECT_ROLE_GROUPS = [
  { role: 'owner', description: '拥有项目全部权限，可管理成员与审核记录' },
  { role: 'editor', description: '可新建、编辑实验记录，上传项目附件' },
  { role: 'viewer', description: '仅可查看项目内容与导出报告' },
  { role: 'pending', description: '已申请加入项目，等待负责人审批' },
]

/** @typedef {'yes'|'no'|'optional'} PermissionValue */
export const PERMISSION_VALUE_LABELS = {
  yes: '是',
  no: '否',
  optional: '可选',
}

export const PERMISSION_VALUE_TONES = {
  yes: 'green',
  no: 'red',
  optional: 'amber',
}

/* ------------------------------- 项目 -------------------------------- */

/** @typedef {'active'|'paused'|'completed'|'reviewing'|'archived'} ProjectStatus */
export const PROJECT_STATUS_LABELS = {
  active: '进行中',
  paused: '暂停',
  completed: '已完成',
  reviewing: '待复核',
  archived: '已归档',
}

export const PROJECT_STATUS_TONES = {
  active: 'blue',
  paused: 'amber',
  completed: 'green',
  reviewing: 'amber',
  archived: 'gray',
}

/* ------------------------------ 实验记录 ------------------------------ */

/** @typedef {'draft'|'in_progress'|'pending_review'|'completed'|'rejected'|'supplement'|'archived'} RecordStatus */
export const RECORD_STATUS_LABELS = {
  draft: '草稿',
  in_progress: '进行中',
  pending_review: '待审核',
  completed: '已完成',
  rejected: '退回修改',
  supplement: '待补充',
  archived: '已归档',
}

export const RECORD_STATUS_TONES = {
  draft: 'gray',
  in_progress: 'blue',
  pending_review: 'amber',
  completed: 'green',
  rejected: 'red',
  supplement: 'amber',
  archived: 'gray',
}

/* ------------------------------- 模板 -------------------------------- */

/** @typedef {'molecular'|'cell'|'protein'|'immunology'|'mine'} TemplateCategory */
export const TEMPLATE_CATEGORY_LABELS = {
  molecular: '分子生物学',
  cell: '细胞生物学',
  protein: '蛋白实验',
  immunology: '免疫实验',
  mine: '我的模板',
}

/** @typedef {'text'|'number'|'date'|'table'|'image'|'sample_picker'|'reagent_picker'} TemplateFieldType */
export const TEMPLATE_FIELD_TYPE_LABELS = {
  text: '文本',
  number: '数字',
  date: '日期',
  table: '表格',
  image: '图片上传',
  sample_picker: '样品选择器',
  reagent_picker: '试剂选择器',
}

/* ------------------------------ 搜索中心 ------------------------------ */

/** @typedef {'project'|'record'|'template'|'member'|'attachment'} SearchEntityType */
export const SEARCH_ENTITY_LABELS = {
  project: '项目',
  record: '实验记录',
  template: '模板',
  member: '成员',
  attachment: '附件',
}

export const SEARCH_ENTITY_TONES = {
  project: 'violet',
  record: 'amber',
  template: 'green',
  member: 'blue',
  attachment: 'blue',
}

/* ------------------------------ AI 助手 ------------------------------ */

/** @typedef {'generate'|'organize'|'summarize'|'check'|'analyze'} AiFeature */
export const AI_FEATURE_LABELS = {
  generate: '生成实验记录',
  organize: '整理实验记录',
  summarize: '生成实验摘要',
  check: '检查记录完整性',
  analyze: '分析实验问题',
}

/* ------------------------------ 修改追溯 ------------------------------ */

/** @typedef {'create'|'update'|'submit'|'approve'|'reject'|'archive'|'invite'|'role_change'} AuditAction */
export const AUDIT_ACTION_LABELS = {
  create: '创建',
  update: '修改',
  submit: '提交审核',
  approve: '审核通过',
  reject: '退回修改',
  archive: '归档',
  invite: '邀请成员',
  role_change: '调整角色',
}

export const AUDIT_ACTION_TONES = {
  create: 'green',
  update: 'blue',
  submit: 'amber',
  approve: 'green',
  reject: 'red',
  archive: 'gray',
  invite: 'violet',
  role_change: 'violet',
}
