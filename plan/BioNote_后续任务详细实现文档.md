# BioNote 后续任务详细实现文档

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v1.0 |
| 编制日期 | 2026-07-13 |
| 适用阶段 | 前端原型完成后的工程实现、联调与课程验收 |
| 团队规模 | 5 人 |
| 范围基线 | `BioNote_生物实验记录助手_Vision文档 (4).pdf` |

## 1. 文档目的与实施结论

本文档用于统一 BioNote 后续开发中的技术架构、业务边界、接口契约、数据模型、人员分工、迭代顺序和验收标准。团队完成任务认领后，应以本文档和 OpenAPI 文档作为联调依据。

当前前端已完成主要页面、路由、领域模型和 mock API 骨架，但绝大多数写操作仍是占位按钮。后续不重写前端，不在开发中途整体迁移 TypeScript 或 Ant Design，而是在现有 React + Vite + Zustand 工程上补齐真实业务闭环。

统一技术方案如下：

| 层级 | 统一选型 | 说明 |
| --- | --- | --- |
| 前端 | React 18 + Vite 5 + React Router 6 + Zustand | 延续现有工程，保留当前 CSS 设计系统 |
| HTTP | Axios | 统一鉴权、错误处理、取消请求、上传进度 |
| 本地草稿 | Dexie + IndexedDB | 支持自动保存和异常退出恢复 |
| 后端 | Spring Boot 3.x + JDK 21 | 符合 Vision 中的正式工程建议和分层要求 |
| 权限 | Spring Security + JWT | 登录认证和项目级 RBAC |
| 数据库 | MySQL 8.x + Flyway | 关系数据持久化、迁移和演示数据初始化 |
| ORM | Spring Data JPA | Repository 数据访问 |
| 文件 | 本地文件系统 + StorageService 抽象 | 第一版本地存储，保留对象存储替换能力 |
| 文档 | springdoc-openapi / Swagger UI | 作为前后端唯一接口契约 |
| 测试 | JUnit 5 + Spring Boot Test + Vitest + Playwright | 服务测试、前端单测和关键流程 E2E |

仓库中的旧技术计划使用 Node.js + PostgreSQL，并包含真实 Agent、提醒和公开数据。该计划与最新 Vision 的技术建议和优先级不一致。后续实现以最新 Vision 为准；若课程明确强制其他技术栈，只替换后端实现技术，不改变本文的模块边界和 REST 契约。

## 2. 范围与优先级

### 2.1 P0：必须形成真实闭环

1. 用户登录、会话恢复和退出。
2. 项目列表、搜索、筛选、新建、编辑、归档和项目详情。
3. 实验记录列表、详情、空白创建、模板创建、编辑、保存草稿和提交。
4. 项目文件与实验附件上传、预览、下载和删除。
5. 全局搜索和项目内搜索，搜索结果必须按权限过滤。
6. 项目成员列表、固定角色分配和项目级访问控制。
7. 基础修改追溯：修改人、修改时间、修改原因、记录版本。
8. 编辑器本地草稿自动保存和异常退出恢复。

### 2.2 P1：P0 稳定后实现

1. 实验记录审核通过、退回修改、审核意见和评论。
2. 项目活动时间线和记录版本详情。
3. Markdown、PDF、Excel 报告导出。
4. 内置模板管理和模板字段预览；自定义模板编辑可排在 P1 后半段。
5. 简单数据表格和趋势图。

### 2.3 P2/P3：本轮只保留入口或 mock

1. AI 助手保留演示入口，不接入真实 LLM。
2. 采样提醒保留占位，不实现 WebSocket、定时任务或邮件推送。
3. 不实现独立样品库、试剂库存、独立文件中心、公开数据平台和分子设计。

### 2.4 范围控制规则

- P0 未完成前，不开始真实 AI、提醒和公开数据功能。
- 不为课程演示引入微服务、消息队列、Redis、Elasticsearch等额外基础设施。
- 搜索第一版使用 MySQL 索引和 `LIKE`/全文索引，不单独部署搜索引擎。
- 权限矩阵采用固定角色，不实现用户自定义权限项。
- 所有删除默认使用软删除或归档，避免误操作破坏演示数据。

## 3. 当前前端基线与主要差距

| 模块 | 已有能力 | 后续任务 |
| --- | --- | --- |
| 布局与路由 | Sidebar、Topbar、主要页面路由 | 将 `ProtectedRoute` 挂到业务路由，补充无权限页 |
| 登录 | mock 账号、Zustand 会话保存 | 对接 JWT，校验过期，401 自动退出 |
| API 层 | 已按 projects/records/templates/team 等拆分 | 实现 Axios client，移除业务模块对 mock 的直接依赖 |
| 工作台 | 统计、项目、记录、待办展示 | 聚合接口、真实日期、真实跳转和空状态 |
| 项目 | 列表和详情展示 | CRUD、分页、筛选、项目内搜索、项目上下文同步 |
| 记录 | 列表、详情、三栏编辑器骨架 | 受控表单、模板预填、校验、保存、提交、审核、版本 |
| 草稿 | 未实现 | IndexedDB 自动保存、恢复、丢弃和清理 |
| 附件 | 仅 mock 文件名 | 上传、进度、预览、下载、删除、失败重试 |
| 搜索 | mock 结果和未接线筛选 | 查询参数、分页、结果定位、权限过滤 |
| 团队 | 成员和权限矩阵展示 | 邀请、改角色、移除、待审核成员处理 |
| 导出 | 仅按钮 | Blob 下载、文件名处理、失败反馈 |
| 质量 | 基本响应式 CSS | Loading、错误、空状态、E2E、窄屏检查 |

## 4. 总体系统架构

```text
Browser
  React SPA
  ├─ Router / ProtectedRoute
  ├─ Pages and Feature Components
  ├─ Zustand: auth + app context
  ├─ Axios API Client
  └─ Dexie / IndexedDB Drafts
              │ HTTPS / JSON / multipart
              ▼
Spring Boot Application
  ├─ Controller + Request/Response DTO
  ├─ Application Service + Transaction
  ├─ Domain Rules: RBAC / Status Machine / Audit
  ├─ Repository: Spring Data JPA
  ├─ StorageService: Local File Storage
  ├─ ExportService: Markdown / PDF / Excel
  └─ Security / Exception / OpenAPI
              │
       ┌──────┴──────┐
       ▼             ▼
    MySQL 8       File Storage
```

部署时由 Nginx 或 Spring Boot 静态资源配置提供前端构建产物，`/api` 转发到后端。开发环境继续使用 Vite proxy，前端代码只访问相对地址 `/api/v1`。

## 5. 前端统一架构

### 5.1 目录约定

在现有目录上增量补充，不做大规模重排：

```text
frontend/src/
├─ api/                 # 仅负责 HTTP 和 DTO 映射
│  ├─ client.js
│  ├─ auth.js
│  ├─ projects.js
│  ├─ records.js
│  ├─ templates.js
│  ├─ files.js
│  ├─ team.js
│  ├─ search.js
│  └─ reports.js
├─ components/
│  ├─ auth/
│  ├─ common/           # Loading、Empty、Error、ConfirmDialog
│  ├─ project/
│  ├─ record/
│  ├─ template/
│  └─ file/
├─ domain/              # 枚举、JSDoc 类型、状态流转显示
├─ hooks/               # useAsync、usePermission、useRecordDraft
├─ services/drafts/     # Dexie 数据库与草稿策略
├─ store/               # authStore、appStore
└─ pages/
```

### 5.2 API 客户端约定

`client.js` 统一实现以下能力：

1. `baseURL=/api/v1`，从环境变量读取覆盖值。
2. 请求前从 `authStore` 注入 `Authorization: Bearer <token>`。
3. 收到 401 时清除会话并跳转登录页。
4. 将后端错误转换为统一 `ApiError`，页面不直接解析 Axios 原始错误。
5. GET 请求支持 `AbortController` 或 Axios cancellation，防止快速筛选时旧请求覆盖新结果。
6. 文件上传支持进度回调，文件下载正确解析 `Content-Disposition` 中文文件名。
7. 页面组件不得直接 import `mocks/data.js`；mock 只允许作为测试 fixture。

### 5.3 前端状态边界

| 状态 | 存放位置 | 示例 |
| --- | --- | --- |
| 登录用户和 Token | `authStore` | `currentUser`、`accessToken` |
| 当前项目上下文 | `appStore` | `currentProjectId` |
| 页面查询和表单 | 页面局部 state | 项目筛选、搜索条件、编辑表单 |
| 服务端业务数据 | 页面/feature hook | 项目列表、记录详情、成员列表 |
| 未提交草稿 | IndexedDB | 新建记录和编辑记录的本地快照 |

不要把所有项目和记录长期复制进 Zustand，避免刷新、更新和缓存失效逻辑复杂化。

### 5.4 草稿恢复设计

草稿键使用 `userId + projectId + recordId/newDraftId`，内容包含：

- `formData`：当前完整表单。
- `serverVersion`：开始编辑时的服务端版本号。
- `updatedAt`：本地最后保存时间。
- `dirty`：是否存在未同步修改。

编辑时每 10 秒防抖保存一次，页面关闭前立即写入 IndexedDB。进入编辑器时，如果本地草稿时间晚于服务端更新时间，弹出“恢复/丢弃”对话框。服务端保存成功后更新本地版本；提交审核成功后删除对应草稿。

## 6. 统一后端架构

### 6.1 工程模块和包结构

第一版采用单体分模块架构，便于课程展示、事务管理和部署：

```text
backend/src/main/java/com/bionote/
├─ BioNoteApplication.java
├─ common/
│  ├─ api/              # ApiResponse、PageResponse、错误码
│  ├─ exception/        # 业务异常与全局异常处理
│  ├─ config/           # CORS、Jackson、OpenAPI
│  └─ audit/            # 操作者上下文和活动记录工具
├─ security/            # JWT、认证过滤器、SecurityConfig
├─ auth/                # 登录和当前用户
├─ user/                # 用户实体与查询
├─ project/             # 项目、成员、角色和项目活动
├─ template/            # 模板与模板字段
├─ record/              # 实验记录、版本、状态机
├─ collaboration/       # 评论、审核、修改原因
├─ file/                # 文件元数据、上传下载、StorageService
├─ search/              # 全局和项目内搜索
├─ dashboard/           # 工作台聚合查询
└─ report/              # Markdown/PDF/Excel 导出
```

每个业务模块内部采用一致结构：

```text
module/
├─ controller/
├─ dto/
├─ service/
├─ repository/
├─ entity/
└─ mapper/
```

### 6.2 分层责任

| 层 | 允许做的事情 | 禁止事项 |
| --- | --- | --- |
| Controller | 参数接收、校验、调用 Service、返回 DTO | 直接访问 Repository、编写权限逻辑 |
| Service | 事务、权限判断、状态流转、领域规则、审计 | 返回 JPA Entity 给前端 |
| Repository | 数据查询和持久化 | 拼装 HTTP 响应、处理用户身份 |
| Entity | 数据关系和必要约束 | 承载页面显示文案 |
| DTO/Mapper | 输入输出模型和实体转换 | 在 Mapper 中执行数据库查询 |
| Infrastructure | JWT、文件、导出、配置 | 绕过 Service 修改业务数据 |

### 6.3 数据库核心表

| 表 | 关键字段 | 说明 |
| --- | --- | --- |
| `users` | id, username, password_hash, name, email, status | 用户和登录身份 |
| `projects` | id, code, name, description, status, owner_id, version, timestamps | 项目主表，`code` 唯一 |
| `project_members` | project_id, user_id, role, member_status, timestamps | 联合唯一索引，项目角色关系 |
| `experiment_templates` | id, name, category, description, built_in, version | 模板元信息 |
| `template_fields` | template_id, field_key, label, field_type, required, config_json, sort_order | 动态字段定义 |
| `experiment_records` | id, code, project_id, template_id, title, type, status, owner_id, content_json, version, timestamps | 当前实验记录快照 |
| `record_versions` | record_id, version_no, snapshot_json, changed_by, change_reason, created_at | 每次重要保存和状态流转的历史快照 |
| `attachments` | id, project_id, record_id, original_name, storage_key, mime_type, size, uploaded_by, created_at, deleted | 项目文件或记录附件 |
| `comments` | id, record_id, author_id, category, content, created_at | 评论和补充说明 |
| `reviews` | id, record_id, reviewer_id, decision, reason, created_at | 审核操作记录 |
| `activities` | id, project_id, actor_id, action, target_type, target_id, summary, created_at | 项目协作动态 |

数据库约束：

- 所有业务主键使用 UUID 字符串或有序 UUID，全项目保持一致。
- `project_members(project_id, user_id)` 建立唯一索引。
- `experiment_records(project_id, status, updated_at)` 建立组合索引。
- `attachments` 必须且只能归属一个项目文件或实验记录；使用数据库 CHECK 或 Service 校验。
- `content_json` 保存实验目的、步骤、参数、结果、结论等动态结构；标题、状态、负责人等常用筛选字段不得只存在 JSON 中。
- 业务表统一包含 `created_at`、`updated_at`，需要软删除的表包含 `deleted` 或 `archived_at`。

### 6.4 项目角色与权限矩阵

| 操作 | OWNER | MEMBER | REVIEWER | OBSERVER |
| --- | :---: | :---: | :---: | :---: |
| 查看项目、记录和允许下载的附件 | 是 | 是 | 是 | 是 |
| 编辑项目信息 | 是 | 否 | 否 | 否 |
| 管理项目成员 | 是 | 否 | 否 | 否 |
| 创建实验记录 | 是 | 是 | 否 | 否 |
| 编辑自己的未完成记录 | 是 | 是 | 否 | 否 |
| 编辑其他成员记录 | 是 | 否 | 否 | 否 |
| 上传项目文件和记录附件 | 是 | 是 | 否 | 否 |
| 发表评论 | 是 | 是 | 是 | 否 |
| 审核实验记录 | 是 | 否 | 是 | 否 |
| 查看活动与版本历史 | 是 | 是 | 是 | 是 |
| 导出项目报告 | 是 | 是 | 是 | 是 |

前端权限控制只负责用户体验；后端每个 Service 方法仍必须校验用户是否属于项目以及是否具备对应角色。

### 6.5 实验记录状态机

```text
新建
  │
  ▼
DRAFT ──────► IN_PROGRESS ──────► PENDING_REVIEW ──────► COMPLETED
  │                │                    │                    │
  └────────────────┴────────────────────┤                    ▼
                                       ▼                 ARCHIVED
                                    REJECTED
                                       │
                                       ▼
                                   SUPPLEMENT
                                       │
                                       └────────► PENDING_REVIEW
```

| 当前状态 | 允许操作 | 下一状态 |
| --- | --- | --- |
| DRAFT | 保存草稿、开始实验、提交审核、归档 | DRAFT / IN_PROGRESS / PENDING_REVIEW / ARCHIVED |
| IN_PROGRESS | 保存、提交审核、归档 | IN_PROGRESS / PENDING_REVIEW / ARCHIVED |
| PENDING_REVIEW | 审核通过、退回 | COMPLETED / REJECTED |
| REJECTED | 开始补充修改 | SUPPLEMENT |
| SUPPLEMENT | 保存补充、再次提交 | SUPPLEMENT / PENDING_REVIEW |
| COMPLETED | 查看、导出、归档 | COMPLETED / ARCHIVED |
| ARCHIVED | 查看；OWNER 可恢复 | 原状态或 ARCHIVED |

状态转换由后端集中校验，前端不得通过普通更新接口直接修改 `status`。

### 6.6 版本与并发控制

- 项目和实验记录包含整数 `version` 字段，并使用 JPA `@Version` 乐观锁。
- 前端更新记录时必须提交当前 `version`。
- 版本不一致返回 HTTP 409 和错误码 `RECORD_VERSION_CONFLICT`。
- 前端收到冲突后提示用户刷新服务端版本或复制当前内容，不自动覆盖他人修改。
- 保存、提交、审核、退回和归档时写入 `record_versions` 或 `activities`。
- 修改已存在记录时要求 `changeReason`；自动保存草稿可使用固定原因“自动保存草稿”。

### 6.7 文件存储

`StorageService` 定义 `store`、`load`、`delete` 和 `getPreview`。第一版实现 `LocalStorageService`：

- 文件保存为随机 `storageKey`，禁止直接使用用户文件名作为磁盘路径。
- 允许 JPG、PNG、PDF、CSV、XLS、XLSX，默认单文件上限 20 MB。
- 下载前校验当前用户对文件所属项目的访问权限。
- 数据库只保存元数据；删除业务记录时先软删除附件，不立即物理删除。
- 上传失败时清理临时文件，数据库和文件写入保持补偿一致性。

## 7. REST API 统一契约

### 7.1 基础规范

- 基础路径：`/api/v1`。
- JSON 字段使用 camelCase，数据库字段使用 snake_case。
- 请求和响应 UTF-8；时间使用带时区的 ISO 8601 字符串。
- 普通成功响应：`{ "code": "OK", "data": ..., "traceId": "..." }`。
- 分页数据：`{ "items": [], "page": 0, "size": 20, "total": 0, "totalPages": 0 }`。
- 错误响应：`{ "code": "VALIDATION_ERROR", "message": "...", "fieldErrors": {}, "traceId": "..." }`。
- 新建成功返回 201，删除/归档成功返回 204，参数错误返回 400，无登录返回 401，无项目权限返回 403，不存在返回 404，版本冲突返回 409。

### 7.2 接口清单与负责人

| 模块 | 方法与路径 | 用途 | 负责人 |
| --- | --- | --- | --- |
| Auth | `POST /auth/login` | 登录并返回 JWT 和用户 | P1 |
| Auth | `GET /auth/me` | 恢复当前会话 | P1 |
| Auth | `POST /auth/logout` | 前端登出确认 | P1 |
| Dashboard | `GET /dashboard` | 聚合统计、最近项目、最近记录、待办 | P1 |
| Project | `GET /projects` | 分页、关键词、状态、负责人筛选 | P2 |
| Project | `POST /projects` | 新建项目并将创建者设为 OWNER | P2 |
| Project | `GET /projects/{id}` | 项目详情 | P2 |
| Project | `PATCH /projects/{id}` | 编辑项目基本信息 | P2 |
| Project | `POST /projects/{id}/archive` | 归档项目 | P2 |
| Project | `GET /projects/{id}/activities` | 项目动态；数据由 P4 的 AuditService 写入 | P2 |
| Member | `GET /projects/{id}/members` | 成员和角色列表 | P2 |
| Member | `POST /projects/{id}/members` | 邀请或添加成员 | P2 |
| Member | `PATCH /projects/{id}/members/{userId}` | 修改成员角色/状态 | P2 |
| Member | `DELETE /projects/{id}/members/{userId}` | 移除成员 | P2 |
| Template | `GET /templates` | 分类查询模板 | P3 |
| Template | `GET /templates/{id}` | 模板和字段详情 | P3 |
| Template | `POST /templates` | P1 后半段创建自定义模板 | P3 |
| Record | `GET /records` | 按项目、状态、负责人分页查询 | P4 |
| Record | `POST /records` | 空白或按 `templateId` 创建草稿 | P3 |
| Record | `GET /records/{id}` | 记录详情 | P3 |
| Record | `PUT /records/{id}` | 保存记录内容和修改原因 | P3 |
| Record | `POST /records/{id}/copy` | 复制为新实验 | P3 |
| Workflow | `POST /records/{id}/start` | 从草稿进入进行中 | P4 |
| Workflow | `POST /records/{id}/submit` | 提交审核 | P4 |
| Workflow | `POST /records/{id}/review` | 审核通过或退回，包含原因 | P4 |
| Workflow | `POST /records/{id}/archive` | 归档记录 | P4 |
| Comment | `GET /records/{id}/comments` | 评论和审核意见列表 | P4 |
| Comment | `POST /records/{id}/comments` | 添加评论 | P4 |
| Version | `GET /records/{id}/versions` | 版本列表 | P4 |
| Version | `GET /records/{id}/versions/{versionNo}` | 版本快照详情 | P4 |
| File | `GET/POST /projects/{id}/files` | 项目文件列表和上传 | P5 |
| File | `GET/POST /records/{id}/attachments` | 记录附件列表和上传 | P5 |
| File | `GET /files/{id}/download` | 权限校验后下载 | P5 |
| File | `GET /files/{id}/preview` | 图片/PDF 预览 | P5 |
| File | `DELETE /files/{id}` | 软删除文件 | P5 |
| Search | `GET /search` | 全局或指定项目综合搜索 | P5 |
| Report | `GET /projects/{id}/export` | Markdown/PDF/Excel 导出 | P5 |
| Report | `GET /records/{id}/export` | 单条记录 PDF 导出 | P5 |

### 7.3 关键请求结构

创建实验记录：

```json
{
  "projectId": "project-id",
  "templateId": "template-id-or-null",
  "title": "PCR 扩增 GFP 片段",
  "experimentType": "PCR",
  "experimentDate": "2026-07-13",
  "location": "A203"
}
```

保存实验记录：

```json
{
  "version": 3,
  "title": "PCR 扩增 GFP 片段",
  "experimentType": "PCR",
  "experimentDate": "2026-07-13",
  "location": "A203",
  "content": {
    "purpose": "扩增目标片段",
    "materials": [],
    "steps": [],
    "parameters": [],
    "results": [],
    "conclusion": ""
  },
  "changeReason": "补充反应体系"
}
```

审核实验记录：

```json
{
  "decision": "APPROVE",
  "reason": "记录完整，结果与附件一致",
  "version": 4
}
```

## 8. 核心业务流程实现

### 8.1 创建项目

1. 前端校验名称和描述，调用 `POST /projects`。
2. 后端生成项目编号，在同一事务中创建项目和 OWNER 成员关系。
3. 写入“创建项目”活动日志。
4. 返回项目详情，前端将其设为当前项目并进入详情页。

### 8.2 从模板创建实验记录

1. 前端加载模板列表和模板字段预览。
2. 用户选择模板后调用 `POST /records` 并提交 `templateId`。
3. 后端复制模板字段为记录内容快照，防止模板后续修改影响旧记录。
4. 记录状态初始化为 DRAFT，返回记录 ID、内容和版本号。
5. 前端创建本地 IndexedDB 草稿并进入编辑器。

### 8.3 保存和提交记录

1. 编辑器执行前端格式校验，草稿保存不强制所有必填字段完整。
2. `PUT /records/{id}` 进行权限、版本和字段类型校验。
3. 后端更新当前快照，增加版本号，写入版本记录和项目活动。
4. 提交审核前执行完整必填校验；失败返回具体 `fieldErrors`。
5. 提交成功后状态变为 PENDING_REVIEW，前端删除本地草稿并跳转详情页。

### 8.4 审核和退回

1. 只有 OWNER 或 REVIEWER 可以看到并调用审核操作。
2. 后端校验记录处于 PENDING_REVIEW。
3. APPROVE 将状态设为 COMPLETED；REJECT 必须填写原因并设为 REJECTED。
4. 写入 reviews、record_versions 和 activities。
5. 记录作者在工作台看到待补充事项。

### 8.5 搜索

1. 搜索请求先计算当前用户可访问的项目 ID。
2. 分别查询项目、记录、模板和附件，并在数据库层限制项目范围。
3. 返回统一 SearchHit DTO，包含 `entityType`、`title`、`snippet`、`targetUrl`。
4. 项目内搜索必须携带 `projectId`，并额外检索成员活动。
5. 前端点击结果直接定位到项目、记录或文件所属页面。

### 8.6 报告导出

1. Service 查询项目信息、记录、附件元数据和审核结论。
2. 转换为统一 `ReportModel`，三个格式生成器共享该模型。
3. Markdown 使用模板渲染；Excel 使用 Apache POI；PDF 使用 OpenPDF 或 HTML-to-PDF 方案。
4. 响应使用正确 MIME 和 UTF-8 文件名；生成失败返回稳定错误码。
5. 大文件场景不在第一版做异步任务，演示数据量下同步生成。

## 9. 五人详细分工

团队采用“纵向模块所有权”：每个人同时负责所属模块的前端、后端、测试和接口文档。P1 兼任技术负责人，但不替代其他成员完成模块测试。

### 9.1 分工总览

| 人员 | 主模块 | 前端范围 | 后端范围 | 必须提交的测试 |
| --- | --- | --- | --- | --- |
| P1 | 平台、认证、工作台 | API client、路由守卫、登录、工作台、全局状态 | 工程骨架、JWT、用户、统一异常、Dashboard | 登录/过期会话 E2E、统一异常集成测试 |
| P2 | 项目与成员权限 | 项目列表/详情/表单、筛选、成员与角色 | Project、ProjectMember、RBAC、项目活动 | 项目 CRUD、越权操作、成员角色测试 |
| P3 | 模板与记录编辑 | 模板选择、编辑器、动态字段、Dexie 草稿 | Template、Record CRUD、字段校验、版本快照 | 草稿恢复 E2E、记录保存与冲突测试 |
| P4 | 记录流程与协作追溯 | 记录列表/详情、提交、审核、评论、版本 | 状态机、Review、Comment、Version、Audit | 状态转换、审核权限、历史完整性测试 |
| P5 | 文件、搜索、导出和质量 | 上传预览下载、搜索、导出、响应式 | Storage、Attachment、Search、Report | 文件安全、搜索权限、导出和主链 E2E |

### 9.2 P1：平台、认证与工作台负责人

前端任务：

- 实现 Axios client、Token 注入、统一 `ApiError` 和 401 处理。
- 将 `ProtectedRoute` 应用于全部业务路由，新增 403 页面。
- 登录页接入真实接口，使用 `/auth/me` 恢复会话。
- 工作台改为单一聚合接口，移除硬编码日期和固定项目。
- 提供 Loading、EmptyState、ErrorState、ConfirmDialog 公共组件。

后端任务：

- 创建 Spring Boot 工程、环境配置、统一响应、异常处理、CORS 和 OpenAPI。
- 完成 User/Auth、密码 BCrypt、JWT 生成和认证过滤器。
- 完成 Dashboard 聚合查询。
- 维护 Flyway 基线、开发/测试配置和演示账号种子数据。
- 审核其他成员新增的 migration、公共依赖和跨模块 DTO。

交付物：工程可启动、Swagger 可访问、三个测试账号、认证接口、Dashboard 接口、公共前端基础设施。

### 9.3 P2：项目与成员权限负责人

前端任务：

- 项目列表接入分页、关键词、状态和负责人筛选。
- 实现新建/编辑项目对话框、归档确认和成功后刷新。
- 项目详情接入统计、最近记录、项目文件入口和活动列表。
- 实现成员邀请、角色修改、移除和当前项目切换。
- 提供 `usePermission(projectId)`，供其他页面控制按钮展示。

后端任务：

- 完成 Project CRUD、自动项目编号、归档和乐观锁。
- 完成 ProjectMember 增删改查、角色与成员状态。
- 提供项目级 `ProjectAccessService`，供记录、文件、搜索模块复用。
- 创建项目和成员变化时写入 activities。
- 为项目查询建立分页、筛选和索引。

交付物：项目管理闭环、成员权限闭环、权限服务、项目活动接口和对应 OpenAPI。

### 9.4 P3：模板、记录编辑与草稿负责人

前端任务：

- 模板分类、预览和“使用模板”跳转携带 templateId。
- 将 RecordEditor 改为受控表单，覆盖基础信息、目的、材料、步骤、参数、结果、结论。
- 实现动态表格行增删、字段校验、错误定位和保存反馈。
- 使用 Dexie 实现自动草稿、恢复和丢弃。
- 实现保存草稿、复制记录以及 409 冲突提示。

后端任务：

- 完成 Template、TemplateField 查询和内置模板种子数据。
- 完成 Record 创建、详情、更新、复制和动态字段校验。
- 保存模板快照和记录内容 JSON。
- 使用 `@Version` 实现并发控制，保存时创建 record_versions。
- 提供 PCR、电泳、发酵工程三个完整内置模板。

交付物：空白/模板创建、记录编辑保存、草稿恢复、模板数据和版本冲突处理。

### 9.5 P4：记录流程、审核与追溯负责人

前端任务：

- 记录列表实现分页、搜索、状态筛选和项目切换。
- 记录详情根据状态和角色展示提交、审核、退回、编辑操作。
- 实现审核/退回对话框，退回原因必填。
- 实现评论输入、评论列表、版本列表和版本快照查看。
- 工作台待办与具体待审核/待补充记录打通。

后端任务：

- 实现集中 RecordStatusService，禁止任意状态更新。
- 完成 start、submit、review、archive 操作。
- 完成 Comment、Review、RecordVersion 查询。
- 提供统一 AuditService，记录操作者、时间、原因和目标对象。
- 与 P1 完成工作台待审核/待补充聚合。

交付物：记录从草稿到审核完成的完整状态链、评论、审核意见和修改历史。

### 9.6 P5：文件、搜索、导出与质量负责人

前端任务：

- 项目文件和实验附件的上传、进度、格式校验、预览、下载和删除。
- 全局搜索和项目内搜索接入筛选、分页和结果跳转。
- 实现项目三格式导出和单记录 PDF 下载。
- 负责窄屏布局检查、文件名溢出和表格横向滚动。
- 编写全主链 Playwright 测试并维护演示检查表。

后端任务：

- 完成 StorageService、LocalStorageService 和 Attachment API。
- 防止路径穿越、伪造 MIME、超大文件和无权限下载。
- 完成权限过滤的综合搜索。
- 完成 ReportModel 和 Markdown/PDF/Excel 生成器。
- 准备 10,000 条记录性能数据，执行分页、搜索和核心接口测试。

交付物：文件闭环、搜索闭环、报告下载、E2E 套件、性能与浏览器检查结果。

## 10. 迭代计划与依赖关系

### 10.1 10 个工作日计划

| 阶段 | 时间 | P1 | P2 | P3 | P4 | P5 |
| --- | --- | --- | --- | --- | --- | --- |
| 契约冻结 | D1 上午 | 工程和响应规范 | 项目/成员 DTO | 模板/记录 DTO | 状态机/审核 DTO | 文件/搜索/导出 DTO |
| 基础数据 | D1-D2 | Auth、用户、前端 client | Project、Member | Template、Record schema | 状态机骨架、Audit | Storage 骨架、测试方案 |
| P0 主链 | D3-D5 | 登录、工作台 | 项目和成员闭环 | 编辑、保存、草稿恢复 | 提交和详情 | 附件上传下载 |
| 协作能力 | D6-D7 | 集成、公共错误 | 活动和权限复核 | 冲突与模板完善 | 审核、评论、历史 | 全局/项目搜索 |
| P1 与质量 | D8-D9 | 全局联调、README | 项目边界测试 | 编辑器 E2E 修复 | 状态链 E2E 修复 | 导出、响应式、性能 |
| 交付 | D10 | 版本冻结和部署 | 演示数据检查 | 模板/记录演示 | 审核演示 | 全主链 E2E 和验收报告 |

### 10.2 必须提前冻结的契约

D1 中午前完成并评审：

1. 角色枚举和权限矩阵。
2. 项目状态、记录状态和合法状态转换。
3. Project、Record、Template、Attachment 的请求/响应 DTO。
4. 统一错误码和分页格式。
5. `content` JSON 结构和模板字段类型。
6. 文件限制、存储目录和下载策略。

接口实现未完成时，前端继续使用与 OpenAPI 一致的 fixture；不得自行发明另一套字段结构。

### 10.3 关键依赖

```text
P1 Auth ───────────────► 所有受保护接口
P2 Project/Access ─────► P3 Record、P4 Workflow、P5 File/Search
P3 Record ─────────────► P4 Review/Version、P5 Record Export
P4 Audit ──────────────► P1 Dashboard、P2 Project Activity
P5 Storage ────────────► P3 Editor Attachment、P5 Report
```

为减少阻塞，P2 在 D2 先交付 `ProjectAccessService` 接口；P3 在 D2 先交付 Record DTO 和 Repository 接口；其他成员可以据此使用 mock 实现并行开发。

## 11. 测试和验收

### 11.1 后端测试

- Service 单元测试：角色权限、状态转换、动态字段校验、版本冲突。
- Controller 集成测试：认证、参数错误、分页、404、403、409。
- 文件测试：非法扩展名、超限文件、路径穿越、无权限下载。
- 数据库测试：migration 可从空库完整执行，种子数据可重复初始化。
- 性能测试：10,000 条实验记录、至少 20 个并发用户，常规核心请求平均响应不超过 3 秒。

### 11.2 前端测试

- API client：Token 注入、401、错误解析和文件名解析。
- 编辑器：模板预填、必填校验、草稿保存恢复、409 冲突。
- 权限：不同角色按钮展示和禁止操作。
- 搜索：筛选参数、分页和结果定位。
- E2E：登录、创建项目、模板创建记录、上传附件、保存、提交、审核、搜索、导出。

### 11.3 P0 验收场景

1. 使用成员账号登录并创建或进入项目。
2. 从 PCR 模板创建实验记录，填写数据并上传凝胶图片。
3. 关闭页面后重新进入，恢复未提交草稿。
4. 保存并提交审核，成员不能自行审核。
5. 使用审核者账号通过或退回记录并填写原因。
6. 查看记录版本、修改人、修改时间和修改原因。
7. 通过全局搜索找到记录和附件，并定位到详情。
8. 导出项目 PDF，文件内容和中文文件名正确。

### 11.4 Definition of Done

一个任务只有同时满足以下条件才算完成：

- 功能代码已合并，且没有继续依赖业务 mock。
- OpenAPI 与实际请求、响应一致。
- 包含成功、失败和无权限场景测试。
- 页面具有 Loading、空状态、错误和防重复提交。
- 通过至少一名非模块负责人的 Code Review。
- README 或模块文档说明了启动方式、配置和演示步骤。

## 12. 协作与 Git 规则

- 分支命名：`feature/p1-auth`、`feature/p3-record-editor`、`fix/p5-file-download`。
- 每个 PR 只处理一个模块或一个明确问题，不混入无关格式化。
- 数据库结构通过 Flyway migration 修改，禁止手工修改共享数据库后不提交脚本。
- 公共 DTO、枚举、错误码和权限规则修改必须通知所有成员并评审。
- API 变更先修改 OpenAPI，再修改后端和前端，禁止只口头同步。
- 每日至少一次短会同步“已完成、今日任务、阻塞、接口变更”。
- P1 负责版本冻结；P5 负责发布前验收清单；模块负责人负责修复自己模块的问题。

建议代码所有权：

| 路径/模块 | 主要负责人 | 必须评审人 |
| --- | --- | --- |
| `frontend/src/api/client.js`、后端 `common/security` | P1 | P2 |
| 前后端 project/team | P2 | P1 |
| 前后端 template/record editor | P3 | P4 |
| 前后端 workflow/collaboration/audit | P4 | P3 |
| 前后端 file/search/report、E2E | P5 | P1 |

## 13. 交付物清单

最终仓库至少包含：

1. 可构建的 `frontend` 和 `backend` 工程。
2. MySQL Flyway migration 和演示数据。
3. Swagger UI/OpenAPI JSON，以及稳定的错误码说明。
4. 三类角色测试账号和不少于三个项目、十条记录、三个模板的演示数据。
5. 前端关键流程 E2E 和后端权限/状态测试。
6. 根 README：环境要求、配置、数据库初始化、启动命令、测试命令和演示流程。
7. 简化 ER 图、部署说明、用户操作说明和迭代评估记录。

## 14. 截止时间压缩方案

如果 `2026-07-17` 仍是硬截止日期，则当前只执行以下最小交付：

| 优先顺序 | 保留 | 暂缓 |
| --- | --- | --- |
| 1 | Auth、项目 CRUD、项目成员固定角色 | 自定义权限矩阵 |
| 2 | 空白/PCR 模板创建记录、保存、草稿恢复 | 模板在线编辑 |
| 3 | 图片/PDF 附件上传下载 | 更多文件预览能力 |
| 4 | 提交、通过、退回和基础版本历史 | 版本差异可视化 |
| 5 | 全局/项目搜索 | 高级搜索排序 |
| 6 | 单记录/项目 PDF 导出 | Excel、Markdown、趋势图 |
| 7 | 一条完整 E2E 演示链 | AI、提醒、公开数据、WebSocket |

压缩计划中仍不能取消后端权限校验、草稿恢复和主链测试，因为这三项分别对应系统安全性、Vision 可靠性要求和课程验收可重复性。
