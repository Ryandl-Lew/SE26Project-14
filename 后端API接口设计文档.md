# BioNote 生物实验记录助手 — 后端 API 接口设计文档

> 基于 `bionote-static-legacy.html` 静态原型 + Vision文档 + 用例模型 分析生成

---

## 目录

- [一、应用页面概览](#一应用页面概览)
- [二、接口清单（按模块）](#二接口清单按模块)
  - [1. 用户认证模块](#1-用户认证模块)
  - [2. 工作台 Dashboard](#2-工作台-dashboard)
  - [3. 项目管理 Projects](#3-项目管理-projects)
  - [4. 实验记录 Experiments](#4-实验记录-experiments)
  - [5. 样品管理 Samples](#5-样品管理-samples)
  - [6. 冻存管理 Freezer](#6-冻存管理-freezer)
  - [7. 模板中心 Templates](#7-模板中心-templates)
  - [8. 搜索中心 Search](#8-搜索中心-search)
  - [9. 团队管理 Team](#9-团队管理-team)
  - [10. AI 助手](#10-ai-助手)
  - [11. 文件上传](#11-文件上传)
  - [12. 通知](#12-通知)
- [三、核心数据模型](#三核心数据模型)
- [四、状态枚举定义](#四状态枚举定义)
- [五、接口汇总与优先级](#五接口汇总与优先级)

---

## 一、应用页面概览

该静态原型共包含 **10 个页面/视图**：

| 页面 ID | 名称 | 说明 |
|---------|------|------|
| `dashboard` | 工作台 | 首页概览，统计卡片、最近项目、最近实验、待办、提醒 |
| `projects` | 项目管理 | 项目列表（卡片视图），搜索/筛选/新建/编辑/归档 |
| `current-project` | 项目详情 | 单个项目概览、时间线、成员、附件、最近实验 |
| `records` | 实验记录 | 项目维度目录树 + 记录预览，切换项目 |
| `editor` | 实验记录编辑器 | 富文本编辑、表单字段、关联样品/试剂/附件、提交审核 |
| `detail` | 实验详情 | 只读查看，含元数据、附件、评论、版本历史、审核操作 |
| `templates` | 模板中心 | 按分类查看模板、使用模板、编辑字段结构 |
| `search` | 搜索中心 | 全局搜索，高级筛选，按类型分 tab 展示结果 |
| `team` | 团队管理 | 按项目查看成员、权限矩阵 |
| `ai` | AI 助手 | 自然语言→结构化记录、完整性检查、摘要生成 |

---

## 二、接口清单（按模块）

### 通用约定

- **基础路径**: `/api`
- **认证方式**: Bearer Token (`Authorization: Bearer <token>`)
- **Content-Type**: `application/json`（文件上传除外）
- **分页参数**: `?page=1&page_size=20`

---

### 1. 用户认证模块

| 方法 | 路径 | 说明 | 请求体 / 响应 |
|------|------|------|--------------|
| `POST` | `/api/auth/login` | 用户登录 | 请求: `{ email, password }` → 响应: `{ token, user: { id, name, email, avatar, lab, role } }` |
| `POST` | `/api/auth/logout` | 用户登出 | 响应: `{ message: "ok" }` |
| `GET` | `/api/auth/me` | 获取当前登录用户信息 | 响应: `{ id, name, email, avatar, lab, role }` |
| `PUT` | `/api/auth/me` | 更新个人资料 | 请求: `{ name, avatar, lab }` → 响应: 更新后的用户对象 |

---

### 2. 工作台 Dashboard

| 方法 | 路径 | 说明 | 响应要点 |
|------|------|------|----------|
| `GET` | `/api/dashboard` | 获取工作台聚合数据 | `{ my_projects_count, active_projects_count, weekly_experiments, pending_records }` |
| `GET` | `/api/dashboard/recent-projects` | 最近访问项目列表 | 列表项: `{ id, name, status, owner_name, member_count, updated_at }` |
| `GET` | `/api/dashboard/recent-experiments` | 最近实验记录 | 列表项: `{ id, title, type, status, updated_at, person_in_charge }` |
| `GET` | `/api/dashboard/todos` | 我的待办列表 | 列表项: `{ id, title, badge, description, due_date }` |
| `GET` | `/api/dashboard/notifications` | 提醒列表 | 列表项: `{ id, title, badge, description }` |

---

### 3. 项目管理 Projects

#### 3.0 项目基本 CRUD

| 方法 | 路径 | 说明 | 请求参数 |
|------|------|------|----------|
| `GET` | `/api/projects` | 获取项目列表 | Query: `search`, `status`, `owner_id`, `page`, `page_size` |
| `POST` | `/api/projects` | 新建项目 | Body: `{ name, description, tags[], status }` |
| `GET` | `/api/projects/:id` | 获取项目详情 | 响应含统计: `{ ...project, stats: { total_experiments, completed_experiments, in_progress_experiments, attachment_count } }` |
| `PUT` | `/api/projects/:id` | 编辑项目信息 | Body: `{ name, description, tags, status }` |
| `DELETE` | `/api/projects/:id` | 删除项目 | — |
| `PUT` | `/api/projects/:id/archive` | 归档项目 | — |
| `PUT` | `/api/projects/:id/current` | 设为当前项目 | — |

#### 3.1 项目附件

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects/:id/attachments` | 获取项目附件列表 |
| `POST` | `/api/projects/:id/attachments` | 上传项目附件（`multipart/form-data`，字段名 `file`） |
| `DELETE` | `/api/projects/:id/attachments/:attId` | 删除附件 |

#### 3.2 项目时间线

| 方法 | 路径 | 说明 | 请求参数 |
|------|------|------|----------|
| `GET` | `/api/projects/:id/timeline` | 项目时间线/动态 | Query: `days`, `type`, `status`, `search` |

响应示例:

```json
[
  {
    "date": "2026-07-07",
    "title": "PCR 扩增 GFP 片段",
    "type": "PCR",
    "person": "李同学",
    "status": "已完成",
    "summary": "成功扩增出约 750 bp 条带",
    "attachment_count": 2,
    "comment_count": 1
  }
]
```

#### 3.3 项目成员

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/projects/:id/members` | 获取项目成员列表 |
| `POST` | `/api/projects/:id/members` | 邀请成员 `{ email, role }` |
| `PUT` | `/api/projects/:id/members/:memberId` | 修改成员角色/权限 |
| `DELETE` | `/api/projects/:id/members/:memberId` | 移除成员 |

成员项结构: `{ user_id, name, email, role, permissions_summary, joined_at, last_active }`

---

### 4. 实验记录 Experiments

#### 4.1 记录 CRUD

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/experiments` | 获取实验记录列表 `?project_id=&status=&search=` |
| `POST` | `/api/experiments` | 新建实验记录 |
| `GET` | `/api/experiments/:id` | 获取实验详情（只读完整内容 + 元数据 + 附件 + 评论） |
| `PUT` | `/api/experiments/:id` | 更新实验记录（保存草稿 / 更新内容） |
| `DELETE` | `/api/experiments/:id` | 删除实验记录 |

新建/更新请求体:

```json
{
  "title": "PCR 扩增 GFP 片段",
  "type": "PCR",
  "project_id": "xxx",
  "experiment_date": "2026-07-07",
  "location": "分子生物学教学实验室 A203",
  "person_in_charge": "李同学",
  "status": "进行中",
  "purpose": "以 Sample-001 为模板扩增 GFP 目标片段...",
  "materials_reagents": [
    { "item": "模板 DNA", "number_lot": "Sample-001", "amount": "1 μL", "note": "pEGFP-N1 质粒" },
    { "item": "Forward Primer", "number_lot": "GFP-F", "amount": "1 μL", "note": "10 μM" },
    { "item": "Reverse Primer", "number_lot": "GFP-R", "amount": "1 μL", "note": "10 μM" },
    { "item": "2x Master Mix", "number_lot": "LOT202607", "amount": "25 μL", "note": "Taq DNA Polymerase" }
  ],
  "parameters": "退火温度 58℃，循环 35 次，延伸时间 45 s...",
  "results": "电泳检测观察到约 750 bp 条带",
  "conclusion": "GFP 片段扩增成功",
  "linked_samples": ["sample_id_1"],
  "linked_reagents": [
    { "name": "Taq DNA Polymerase", "lot": "LOT202607" }
  ]
}
```

#### 4.2 实验目录树

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/experiments/tree` | 获取记录目录树 `?project_id=` |

响应结构（按月分组 + 项目资料分组）:

```json
{
  "groups": [
    {
      "label": "2026-07",
      "count": 4,
      "records": [
        { "id": "...", "title": "PCR 扩增 GFP 片段", "type": "PCR", "status": "已完成", "date": "2026-07-07" }
      ]
    },
    {
      "label": "项目资料",
      "count": 3,
      "records": [
        { "id": "...", "title": "实验方案与引物设计", "type": "方案", "status": "已归档" }
      ]
    }
  ]
}
```

#### 4.3 审核流转

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/experiments/:id/submit` | 提交审核（状态: 进行中 → 待审核） |
| `POST` | `/api/experiments/:id/approve` | 审核通过（状态: 待审核 → 已完成） |
| `POST` | `/api/experiments/:id/reject` | 退回修改 `{ reason }` （状态: 待审核 → 退回修改） |

#### 4.4 评论

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/experiments/:id/comments` | 获取评论列表 |
| `POST` | `/api/experiments/:id/comments` | 添加评论 `{ content, type }` 类型: `comment` / `review` |

#### 4.5 版本历史

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/experiments/:id/versions` | 获取版本历史 |

响应示例:

```json
[
  { "version": 3, "user": "张老师", "description": "添加审核意见", "created_at": "..." },
  { "version": 2, "user": "李同学", "description": "上传电泳图片", "created_at": "..." },
  { "version": 1, "user": "李同学", "description": "初始创建", "created_at": "..." }
]
```

#### 4.6 实验附件

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/experiments/:id/attachments` | 获取实验附件 |
| `POST` | `/api/experiments/:id/attachments` | 上传附件 `multipart/form-data` |
| `DELETE` | `/api/experiments/:id/attachments/:attId` | 删除附件 |

#### 4.7 导出与复制

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/experiments/:id/export` | 导出 PDF `{ format: "pdf" }` → 返回文件流 |
| `POST` | `/api/experiments/:id/copy` | 复制为新实验 → 返回新 experiment_id |

---

### 5. 样品管理 Samples

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/samples` | 获取样品列表 `?project_id=&search=` |
| `POST` | `/api/samples` | 新建样品 `{ name, number, type, description, project_id }` |
| `GET` | `/api/samples/:id` | 获取样品详情（含 lineage 来源链） |
| `PUT` | `/api/samples/:id` | 更新样品信息 |
| `DELETE` | `/api/samples/:id` | 删除样品 |

样品图谱结构（lineage）:

```json
[
  { "step": 1, "action": "质粒提取", "sample": "pEGFP-N1", "date": "2026-07-01" },
  { "step": 2, "action": "PCR 扩增", "sample": "PCR 产物", "date": "2026-07-07" }
]
```

---

### 6. 冻存管理 Freezer

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/freezer/boxes` | 获取冻存盒列表 |
| `GET` | `/api/freezer/boxes/:boxId` | 获取冻存盒布局（9×N 网格） |
| `PUT` | `/api/freezer/boxes/:boxId/cells` | 批量更新格子内容 `{ cells: [{ row, col, sample_id }] }` |

格子状态: `empty` / `used` / `warn`（即将过期）

---

### 7. 模板中心 Templates

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/templates` | 获取模板列表 `?category=分子生物学` |
| `POST` | `/api/templates` | 新建模板 |
| `GET` | `/api/templates/:id` | 获取模板详情（含字段结构） |
| `PUT` | `/api/templates/:id` | 编辑模板（含字段结构） |
| `DELETE` | `/api/templates/:id` | 删除模板 |
| `POST` | `/api/templates/:id/copy` | 复制模板 |
| `POST` | `/api/templates/:id/use` | 使用模板创建实验 `{ project_id }` → `{ experiment_id }` |

模板分类枚举: `分子生物学` / `细胞生物学` / `蛋白实验` / `免疫实验` / `我的模板`

字段结构示例:

```json
{
  "fields": [
    { "name": "模板 DNA", "type": "样品选择器", "required": true, "unit": "-", "searchable": true },
    { "name": "退火温度", "type": "数字", "required": true, "unit": "℃", "searchable": true },
    { "name": "PCR 程序", "type": "表格", "required": true, "unit": "-", "searchable": false },
    { "name": "电泳结果图片", "type": "图片上传", "required": false, "unit": "-", "searchable": true }
  ]
}
```

---

### 8. 搜索中心 Search

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/search` | 全局搜索 |

查询参数: `keyword`, `type` (全部/项目/实验记录/模板/成员/附件), `owner`, `project_id`, `status`

响应结构:

```json
{
  "total": 18,
  "projects": {
    "count": 2,
    "items": [
      { "id": "...", "name": "GFP 融合蛋白表达项目", "number": "PRJ-2026-001", "owner": "李同学", "experiment_count": 12, "updated_at": "..." }
    ]
  },
  "experiments": {
    "count": 7,
    "items": [
      { "id": "...", "title": "PCR 扩增 GFP 片段", "matched_fields": ["标题", "标签", "实验目的"], "updated_at": "..." }
    ]
  },
  "templates": {
    "count": 3,
    "items": [
      { "id": "...", "name": "PCR 实验模板", "category": "分子生物学", "usage_count": 128 }
    ]
  },
  "members": { "count": 2, "items": [] },
  "attachments": {
    "count": 4,
    "items": [
      { "id": "...", "name": "GFP_gel_0707.png", "location": "实验附件 / PCR 扩增 GFP 片段" }
    ]
  }
}
```

---

### 9. 团队管理 Team

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/team/members` | 获取成员列表 `?project_id=&search=` |
| `PUT` | `/api/team/members/:memberId/permissions` | 修改单个成员权限 `{ permissions: ["view", "edit_own", "upload"] }` |
| `GET` | `/api/team/roles` | 获取角色权限矩阵 |
| `PUT` | `/api/team/roles/:roleId` | 编辑角色默认权限 |

角色权限矩阵响应:

```json
{
  "roles": [
    { "name": "项目负责人", "permissions": { "view": true, "edit_project": true, "create_record": true, "review": true, "manage_members": true, "upload": true } },
    { "name": "项目成员", "permissions": { "view": true, "edit_project": false, "create_record": true, "review": false, "manage_members": false, "upload": true } },
    { "name": "审核者", "permissions": { "view": true, "edit_project": false, "create_record": "optional", "review": true, "manage_members": false, "upload": "optional" } },
    { "name": "观察者", "permissions": { "view": true, "edit_project": false, "create_record": false, "review": false, "manage_members": false, "upload": false } }
  ]
}
```

---

### 10. AI 助手

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/ai/generate-record` | 自然语言 → 结构化记录 |
| `POST` | `/api/ai/organize-record` | 整理实验记录 `{ experiment_id }` |
| `POST` | `/api/ai/generate-summary` | 生成实验摘要 `{ experiment_id }` |
| `POST` | `/api/ai/check-completeness` | 检查记录完整性 `{ experiment_id }` |
| `POST` | `/api/ai/analyze-problem` | 分析实验问题 `{ experiment_id, question }` |

`generate-record` 请求/响应示例:

```json
// 请求
{
  "text": "今天做了 PCR，用 Sample-001 做模板，引物是 GFP-F/GFP-R，退火温度 58℃，循环 35 次，跑胶后有一条 750 bp 的条带。",
  "project_id": "xxx"
}

// 响应
{
  "structured": {
    "type": "PCR",
    "template": "Sample-001",
    "primers": "GFP-F / GFP-R",
    "annealing_temp": "58℃",
    "cycles": 35,
    "conclusion": "扩增成功"
  },
  "raw_record": { "title": "PCR 扩增 GFP 片段", "type": "PCR", "...": "..." }
}
```

`check-completeness` 响应示例:

```json
{
  "score": 78,
  "max_score": 100,
  "suggestions": [
    "建议补充 Taq 酶批号",
    "建议上传电泳结果图片",
    "建议补充最终结论"
  ]
}
```

---

### 11. 文件上传

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/files/upload` | 上传文件 `multipart/form-data` → `{ id, url, name, size, mime_type }` |
| `GET` | `/api/files/:id/download` | 下载文件（返回文件流） |
| `GET` | `/api/files/:id/preview` | 预览文件（图片缩略图） |
| `DELETE` | `/api/files/:id` | 删除文件 |

---

### 12. 通知

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/notifications` | 获取通知列表 `?is_read=&page=&page_size=` |
| `PUT` | `/api/notifications/:id/read` | 标记已读 |
| `PUT` | `/api/notifications/read-all` | 全部已读 |

---

## 三、核心数据模型

### User（用户）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | 姓名 |
| email | string | 邮箱（唯一） |
| password_hash | string | 密码哈希 |
| avatar | string | 头像 URL |
| lab | string | 所属实验室 |
| role | enum | 系统角色: `admin` / `user` |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### Project（项目）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| project_number | string | 项目编号（如 PRJ-2026-001） |
| name | string | 项目名称 |
| description | text | 项目描述 |
| status | enum | 进行中 / 已完成 / 暂停 / 待复核 |
| progress | int(0-100) | 进度百分比 |
| tags | string[] | 标签 |
| owner_id | FK → User | 项目负责人 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### ProjectMember（项目成员）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| project_id | FK → Project | 所属项目 |
| user_id | FK → User | 成员 |
| role | enum | 项目负责人 / 项目成员 / 审核者 / 观察者 |
| permissions | JSON | 具体权限位 |
| joined_at | datetime | 加入时间 |
| last_active | datetime | 最近活跃时间 |

### Experiment（实验记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| experiment_number | string | 实验编号（如 EXP-20260707-001） |
| title | string | 实验标题 |
| type | string | 实验类型（PCR / qPCR / WB / 质粒提取 / 电泳 / 酶切 / 连接 / 转化 / 测序 等） |
| project_id | FK → Project | 所属项目 |
| status | enum | 草稿 / 进行中 / 待审核 / 已完成 / 退回修改 |
| experiment_date | date | 实验日期 |
| location | string | 实验地点 |
| person_in_charge | string | 负责人姓名 |
| purpose | text | 实验目的 |
| materials_reagents | JSON | 材料与试剂表格 |
| steps | text | 实验步骤 |
| parameters | text | 实验参数 |
| results | text | 实验结果 |
| conclusion | text | 结论与讨论 |
| linked_samples | FK[] → Sample | 关联样品 |
| linked_reagents | JSON | 关联试剂 |
| created_by | FK → User | 创建者 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

### ExperimentComment（评论）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| experiment_id | FK → Experiment | 所属记录 |
| user_id | FK → User | 评论者 |
| content | text | 评论内容 |
| type | enum | `comment`（评论）/ `review`（审核意见） |
| created_at | datetime | 创建时间 |

### ExperimentVersion（版本历史）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| experiment_id | FK → Experiment | 所属记录 |
| version_num | int | 版本号 |
| user_id | FK → User | 操作者 |
| description | string | 变更描述 |
| snapshot | JSON | 记录快照 |
| created_at | datetime | 创建时间 |

### Sample（样品）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | 名称 |
| number | string | 编号 |
| type | string | 类型 |
| description | text | 描述 |
| project_id | FK → Project | 所属项目 |
| lineage | JSON | 来源链（操作步骤列表） |
| freezer_location | JSON | 冻存位置 `{ box_id, row, col }` |
| created_at | datetime | 创建时间 |

### Template（模板）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | string | 模板名称 |
| category | enum | 分类: 分子生物学 / 细胞生物学 / 蛋白实验 / 免疫实验 / 我的模板 |
| usage_count | int | 使用次数 |
| is_lab_template | bool | 是否为实验室模板 |
| fields | JSON | 字段定义数组 |
| created_by | FK → User | 创建者 |
| created_at | datetime | 创建时间 |

### Attachment（附件）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| file_id | FK → File | 文件引用 |
| name | string | 显示名称 |
| attachable_type | string | 关联类型: `project` / `experiment` |
| attachable_id | UUID | 关联 ID |
| uploaded_by | FK → User | 上传者 |
| created_at | datetime | 上传时间 |

### File（文件）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| url | string | 存储路径 / URL |
| name | string | 原始文件名 |
| size | int | 文件大小 (bytes) |
| mime_type | string | MIME 类型 |
| uploaded_by | FK → User | 上传者 |
| created_at | datetime | 上传时间 |

### Notification（通知）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | FK → User | 接收者 |
| type | string | 通知类型（review / comment / reminder / system） |
| title | string | 标题 |
| content | text | 内容 |
| related_type | string | 关联对象类型 |
| related_id | UUID | 关联对象 ID |
| is_read | bool | 是否已读 |
| created_at | datetime | 创建时间 |

---

## 四、状态枚举定义

### 项目状态

| 值 | 显示名称 | 说明 |
|----|---------|------|
| `in_progress` | 进行中 | 项目正在活跃推进 |
| `completed` | 已完成 | 项目已完结 |
| `paused` | 暂停 | 项目暂时搁置 |
| `pending_review` | 待复核 | 等待最终复核 |

### 实验记录状态

| 值 | 显示名称 | 流转 |
|----|---------|------|
| `draft` | 草稿 | 初始状态 |
| `in_progress` | 进行中 | 编辑中 |
| `pending_review` | 待审核 | 提交审核后 → 审核通过/退回修改 |
| `completed` | 已完成 | 审核通过 |
| `rejected` | 退回修改 | 审核退回 → 编辑后重新提交 |

### 项目成员角色

| 值 | 显示名称 |
|----|---------|
| `owner` | 项目负责人 |
| `member` | 项目成员 |
| `reviewer` | 审核者 |
| `observer` | 观察者 |

### 模板分类

| 值 | 显示名称 |
|----|---------|
| `molecular` | 分子生物学 |
| `cell` | 细胞生物学 |
| `protein` | 蛋白实验 |
| `immuno` | 免疫实验 |
| `my` | 我的模板 |

---

## 五、接口汇总与优先级

| 模块 | P0（核心） | P1（重要） | P2（可选） | 合计 |
|------|-----------|-----------|-----------|------|
| 用户认证 | 4 | — | — | 4 |
| 工作台 Dashboard | 5 | — | — | 5 |
| 项目管理 Projects | 7 + 8 子资源 | — | — | 15 |
| 实验记录 Experiments | 6 + 8 子资源 | — | — | 14 |
| 样品管理 Samples | — | 5 | — | 5 |
| 冻存管理 Freezer | — | — | 3 | 3 |
| 模板中心 Templates | — | 7 | — | 7 |
| 搜索中心 Search | — | 1 | — | 1 |
| 团队管理 Team | — | 4 | — | 4 |
| AI 助手 | — | 5 | — | 5 |
| 文件上传 | 4 | — | — | 4 |
| 通知 | — | 3 | — | 3 |
| **合计** | **42** | **25** | **3** | **70** |

### 推荐实现顺序

1. **Phase 1 (MVP 核心)**: 用户认证 → 项目管理 → 实验记录 CRUD → 文件上传 → 工作台
2. **Phase 2 (增强)**: 实验审核流转 → 评论与版本 → 搜索中心 → 团队管理 → 模板中心
3. **Phase 3 (智能化)**: AI 助手 → 样品管理 → 通知 → 冻存管理
