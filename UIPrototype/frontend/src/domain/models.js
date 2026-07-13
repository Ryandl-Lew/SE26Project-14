/**
 * 核心业务对象的形状定义（JSDoc）
 * JS 无静态类型，这里用 @typedef 记录字段结构，供编辑器提示与团队对齐使用。
 * 运行时枚举取值见 ./enums.js。
 */

/* ------------------------------ 用户 / 成员 ------------------------------ */
/**
 * @typedef {Object} User
 * @property {import('./common').ID} id
 * @property {string} name
 * @property {string} email
 * @property {string} [avatarText] 头像文字（姓名首字）
 * @property {string} [avatarUrl]
 *
 * @typedef {Object} ProjectMember
 * @property {User} user
 * @property {import('./enums').ProjectRole} role
 * @property {string} permissionSummary 权限摘要文本
 * @property {import('./common').ISODateTime} joinedAt
 * @property {import('./common').ISODateTime} lastActiveAt
 *
 * @typedef {Object} PermissionMatrixRow
 * @property {string} permission 权限项名称
 * @property {Record<import('./enums').ProjectRole, import('./enums').PermissionValue>} values
 */

/* -------------------------------- 项目 --------------------------------- */
/**
 * @typedef {Object} Project
 * @property {import('./common').ID} id
 * @property {string} code 项目编号，如 PRJ-2026-001
 * @property {string} name
 * @property {string} description
 * @property {import('./enums').ProjectStatus} status
 * @property {string} ownerName 负责人姓名
 * @property {number} memberCount
 * @property {number} recordCount
 * @property {number} progress 进度百分比 0-100
 * @property {string[]} tags
 * @property {import('./common').ISODateTime} updatedAt
 *
 * @typedef {Object} ProjectTimelineItem
 * @property {import('./common').ID} id
 * @property {import('./common').ISODateTime} date
 * @property {string} title
 * @property {string} summary
 *
 * @typedef {Object} ProjectAttachment
 * @property {import('./common').ID} id
 * @property {string} name
 * @property {string} kind 文件类型：pdf/image/zip/excel...
 *
 * @typedef {Object} ProjectActivity
 * @property {import('./common').ID} id
 * @property {string} text 动作描述
 * @property {string} target 关联对象名称
 * @property {string} category
 * @property {import('./common').ISODateTime} createdAt
 */

/* ------------------------------ 实验记录 ------------------------------- */
/**
 * @typedef {Object} ReactionRow
 * @property {string} component 组分 / 对象名称
 * @property {string} [code] 编号或批号
 * @property {string} [amount] 用量 / 体积
 * @property {string} [note]
 *
 * @typedef {Object} RecordSection
 * @property {import('./common').ID} id
 * @property {string} title 分节标题
 * @property {string} [body] 纯文本正文
 * @property {ReactionRow[]} [table] 可选表格数据
 *
 * @typedef {Object} RecordRelation
 * @property {import('./common').ID} id
 * @property {string} label
 * @property {string} kind sample/reagent/attachment/instrument
 *
 * @typedef {Object} ExperimentRecordSummary
 * @property {import('./common').ID} id
 * @property {string} code 实验编号，如 EXP-20260707-001
 * @property {string} title
 * @property {string} experimentType 实验类型：PCR/qPCR/WB...
 * @property {import('./enums').RecordStatus} status
 * @property {string} ownerName
 * @property {import('./common').ID} projectId
 * @property {string} projectName
 * @property {import('./common').ISODateTime} updatedAt
 *
 * @typedef {ExperimentRecordSummary & {
 *   experimentDate: import('./common').ISODateTime,
 *   location?: string,
 *   purpose?: string,
 *   sections: RecordSection[],
 *   relations: RecordRelation[],
 * }} ExperimentRecord
 *
 * @typedef {Object} RecordDraftInput
 * @property {import('./common').ID} [id]
 * @property {string} title
 * @property {string} experimentType
 * @property {import('./common').ID} projectId
 * @property {import('./common').ISODateTime} experimentDate
 * @property {string} [ownerName]
 * @property {string} [location]
 * @property {string} [purpose]
 * @property {RecordSection[]} [sections]
 */

/* -------------------------------- 模板 --------------------------------- */
/**
 * @typedef {Object} TemplateField
 * @property {import('./common').ID} id
 * @property {string} name
 * @property {import('./enums').TemplateFieldType} type
 * @property {boolean} required
 * @property {string} [unit]
 * @property {boolean} searchable
 *
 * @typedef {Object} Template
 * @property {import('./common').ID} id
 * @property {string} name
 * @property {string} description
 * @property {import('./enums').TemplateCategory} category
 * @property {number} usageCount
 * @property {string} [tag]
 * @property {TemplateField[]} fields
 */

/* ---------------------- 协作：搜索 / 工作台 / 评论 / AI ---------------------- */
/**
 * @typedef {Object} SearchFilters
 * @property {string} keyword
 * @property {import('./enums').SearchEntityType|'all'} [entityType]
 * @property {string} [ownerName]
 * @property {import('./common').ID} [projectId]
 * @property {string} [status]
 *
 * @typedef {Object} SearchHit
 * @property {import('./common').ID} id
 * @property {import('./enums').SearchEntityType} entityType
 * @property {string} title
 * @property {string} snippet 命中说明 / 摘要
 *
 * @typedef {Object} TodoItem
 * @property {import('./common').ID} id
 * @property {string} title
 * @property {string} badgeText
 * @property {string} description
 *
 * @typedef {Object} NotificationItem
 * @property {import('./common').ID} id
 * @property {string} title
 * @property {string} badgeText
 * @property {string} description
 * @property {import('./common').ISODateTime} [createdAt]
 *
 * @typedef {Object} DashboardStat
 * @property {string} label
 * @property {number|string} value
 * @property {string} note
 * @property {string} [icon]
 *
 * @typedef {Object} Comment
 * @property {import('./common').ID} id
 * @property {string} authorName
 * @property {string} content
 * @property {string} category 审核意见 / 版本历史 / 评论
 * @property {import('./common').ISODateTime} createdAt
 *
 * @typedef {Object} AiStructuredField
 * @property {string} label
 * @property {string} value
 *
 * @typedef {Object} AiAssistResult
 * @property {import('./enums').AiFeature} feature
 * @property {AiStructuredField[]} structuredFields
 * @property {number} [completenessScore] 完整性评分 0-100
 * @property {string} [suggestion]
 */

export {}
