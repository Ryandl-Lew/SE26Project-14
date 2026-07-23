/**
 * 业务枚举与中文标签映射（运行时常量）
 * 集中管理各领域的状态、角色、分类等取值及其展示文本、徽章色系。
 */

/* ----------------------------- 用户 / 角色 ----------------------------- */

/** @typedef {'owner'|'member'|'reviewer'|'observer'} ProjectRole */
export const PROJECT_ROLE_LABELS = {
  owner: '项目负责人',
  member: '项目成员',
  reviewer: '审核者',
  observer: '观察者',
}

/** 角色徽章色系 */
export const PROJECT_ROLE_TONES = {
  owner: 'blue',
  member: 'green',
  reviewer: 'amber',
  observer: 'gray',
}

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

/** @typedef {'in_progress'|'active'|'completed'|'pending_review'|'archived'} ProjectStatus */
export const PROJECT_STATUS_LABELS = {
  in_progress: '进行中',
  active: '进行中',
  completed: '已完成',
  pending_review: '待复核',
  archived: '已归档',
}

export const PROJECT_STATUS_TONES = {
  in_progress: 'blue',
  active: 'blue',
  completed: 'green',
  pending_review: 'amber',
  archived: 'gray',
}

/* ------------------------------ 实验记录 ------------------------------ */

/** @typedef {'draft'|'in_progress'|'pending_review'|'completed'|'rejected'} RecordStatus */
export const RECORD_STATUS_LABELS = {
  draft: '草稿',
  in_progress: '进行中',
  pending_review: '待审核',
  completed: '已完成',
  rejected: '需修改',
}

export const RECORD_STATUS_TONES = {
  draft: 'gray',
  in_progress: 'blue',
  pending_review: 'amber',
  completed: 'green',
  rejected: 'red',
}

/* ------------------------------- 模板 -------------------------------- */

/** @typedef {'molecular'|'cell'|'protein'|'immunology'|'mine'} TemplateCategory */
export const TEMPLATE_CATEGORY_LABELS = {
  all: '全部模板',
  mine: '我的模板',
  molecular: '分子生物学',
  cell: '细胞生物学',
  protein: '蛋白实验',
  immunology: '免疫实验',
}

/** @typedef {'text'|'number'|'date'|'table'|'image'|'textarea'|'sample_picker'|'reagent_picker'} TemplateFieldType */
export const TEMPLATE_FIELD_TYPE_LABELS = {
  text: '文本',
  number: '数字',
  date: '日期',
  textarea: '多行文本',
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
