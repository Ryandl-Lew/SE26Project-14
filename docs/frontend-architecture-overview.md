# 前端代码结构与组件关系介绍

> 生成日期：2026-07-20 | 分支：p5 | 框架：React 18 + Vite | 语言：JavaScript (JSDoc 类型标注)

---

### 1. 前端物理目录树 (Directory Tree)

```
frontend/src/
│
├── main.jsx                              # 应用入口：ReactDOM.createRoot → <App />
├── App.jsx                               # 根组件：恢复 Auth 会话 → <RouterProvider>
│
├── router/
│   └── index.jsx                         # React Router v6 路由配置 (createBrowserRouter)
│
├── store/                                # Zustand 状态管理
│   ├── authStore.js                      #   currentUser, token, loading; login/logout/restoreSession
│   └── appStore.js                       #   currentLab, currentProjectId, searchKeyword
│
├── api/                                  # API 客户端层 (Mock + Axios 混合)
│   ├── index.js                          #   统一导出
│   ├── client.js                         #   基座 (mockResponse 工厂 + 通用 request 桩)
│   ├── auth.js                           #   认证 (Mock)
│   ├── projects.js                       #   项目 CRUD (Mock)
│   ├── records.js                        #   实验记录 CRUD (Mock)
│   ├── templates.js                      #   模板 CRUD (Mock)
│   ├── team.js                           #   团队管理 (Mock)
│   ├── assist.js                         #   AI 助手 + Dashboard + 搜索 (Mock)
│   ├── files.js                          #   文件上传/下载/删除/恢复 (真实 Axios, /api/v1)
│   ├── search.js                         #   全局搜索 (真实 Axios, /api/v1)
│   └── export.js                         #   导出 Excel/PDF/Markdown (真实 Axios)
│
├── domain/                               # 领域模型 (纯 JSDoc + 运行时枚举)
│   ├── index.js                          #   统一导出 (enums)
│   ├── enums.js                          #   运行时枚举：ProjectRole, ProjectStatus, RecordStatus,
│   │                                     #     TemplateCategory, TemplateFieldType, SearchEntityType,
│   │                                     #     AiFeature, PermissionValue 等
│   ├── models.js                         #   JSDoc @typedef：User, Project, ExperimentRecord,
│   │                                     #     Template, SearchHit, DashboardStat 等 25+ 类型
│   └── common.js                         #   通用 JSDoc：ID, ISODateTime, BadgeTone, PageQuery, Paginated
│
├── components/                           # 可复用组件 (按业务域分目录)
│   ├── auth/
│   │   └── ProtectedRoute.jsx            #   鉴权守卫 (未登录 → /login)
│   ├── layout/
│   │   ├── AppLayout.jsx                 #   应用外壳：Sidebar + Topbar + <Outlet>
│   │   ├── Sidebar.jsx                   #   侧边导航 (NavLink + 品牌 + 当前实验室名)
│   │   ├── Topbar.jsx                    #   顶栏 (全局搜索入口 + 实验室切换 + 新建菜单 + 头像/登出)
│   │   └── layout.css
│   ├── file/
│   │   ├── FileManager.jsx               #   ★ 核心组件：文件列表 + 上传/预览/删除/恢复
│   │   └── file-manager.css
│   ├── project/
│   │   ├── ProjectCard.jsx               #   项目卡片 (状态徽章 + 进度条 + 元信息)
│   │   └── project-card.css
│   ├── record/
│   │   ├── RecordTree.jsx                #   实验记录树 (按月分组)
│   │   └── record-tree.css
│   ├── template/
│   │   ├── TemplateCard.jsx              #   模板卡片 (分类徽章 + 描述 + 操作)
│   │   └── template-card.css
│   └── ui/                               # 原子化 UI 组件
│       ├── index.js                      #   统一导出
│       ├── Badge.jsx                     #   通用徽章 (tone: blue|green|amber|red|violet|gray)
│       ├── StatusBadge.jsx               #   状态专用徽章 (kind + status → tone + label)
│       ├── PageHeader.jsx                #   页面标题 (eyebrow + title + description + actions)
│       ├── Surface.jsx                   #   卡片容器 (title + extra + children)
│       ├── StatCard.jsx                  #   统计卡片 (label + value + note + icon)
│       ├── stat-card.css
│       ├── GelPreview.jsx                #   凝胶电泳预览装饰组件 (纯 CSS 伪元素模拟条带)
│       └── gel-preview.css
│
├── pages/                                # 页面级路由组件 (平铺，无子目录)
│   ├── index.js                          #   统一导出
│   ├── LoginPage.jsx + login.css         #   /login — 登录表单 + 测试账号提示
│   ├── DashboardPage.jsx + dashboard.css #   / — 工作台：统计卡片 + 最近项目/记录 + 待办
│   ├── ProjectsPage.jsx                  #   /projects — 项目卡片网格 + 筛选
│   ├── ProjectDetailPage.jsx             #   /projects/:projectId — 项目详情：
│   │   + project-detail.css              #       概览 + 时间线 + 成员 + 附件 (内嵌 FileManager)
│   ├── RecordsPage.jsx + records.css     #   /records — 记录树 + 预览面板
│   ├── RecordDetailPage.jsx              #   /records/:recordId — 记录详情 (只读)：
│   │                                     #       章节内容 + 评论 + 附件 (内嵌 FileManager) + 导出
│   ├── RecordEditorPage.jsx + editor.css #   /records/new | /records/:recordId/edit — 记录编辑器：
│   │                                     #       大纲 + 富文本区 + 关联面板 (大部分为占位 UI)
│   ├── TemplatesPage.jsx                 #   /templates — 模板卡片 + 分类 Tab + 字段预览
│   ├── SearchPage.jsx + search.css       #   /search — ★ 最复杂页面：全局搜索
│   ├── TeamPage.jsx                      #   /team — 成员列表 + 权限矩阵
│   ├── AiAssistantPage.jsx               #   /ai — AI 助手：特征选择 + 输入 + 结果展示
│   └── NotFoundPage.jsx                  #   * — 404
│
├── styles/
│   └── global.css                        # 全局设计令牌 (CSS 自定义属性) + reset + 通用类
│
├── mocks/
│   └── data.js                           # 全量 Mock 数据 (用户/项目/记录/模板/附件/搜索等)
│
└── utils/
    └── toast.js                          # DOM 级 Toast 通知 (success/error)
```

**路由层级总览：**

```
/login                             → <LoginPage />              (独立页面，无布局外壳)
/                                  → <AppLayout />              (外壳：Sidebar + Topbar)
  ├── /                              → <DashboardPage />
  ├── /projects                      → <ProjectsPage />
  ├── /projects/:projectId           → <ProjectDetailPage />
  ├── /records                       → <RecordsPage />
  ├── /records/new                   → <RecordEditorPage />
  ├── /records/:recordId             → <RecordDetailPage />
  ├── /records/:recordId/edit        → <RecordEditorPage />
  ├── /templates                     → <TemplatesPage />
  ├── /search                        → <SearchPage />
  ├── /team                          → <TeamPage />
  ├── /ai                            → <AiAssistantPage />
  └── *                              → <NotFoundPage />
```

---

### 2. 核心组件契约 (Component Contracts)

#### 2.1 布局层

| 组件 | 职责 | Props | 核心 State |
|------|------|-------|-----------|
| **AppLayout** | 应用外壳，渲染 Sidebar + Topbar + `<Outlet>` | 无 | 无 |
| **Sidebar** | 左侧导航，7 个 NavLink + 品牌区 + 当前实验室名 | 无 | 读取 `appStore.currentLab` |
| **Topbar** | 全局搜索入口、实验室切换、新建下拉菜单、头像、登出 | 无 | `menuOpen` (boolean), `menuRef` (ref)；读取 `appStore.searchKeyword`；Enter 键跳转 `/search?q=...` |

#### 2.2 业务组件

| 组件 | 职责 | Props | 核心 State |
|------|------|-------|-----------|
| **FileManager** ★ | 文件列表管理：上传（含进度条）、预览（图片/PDF 弹窗）、下载、软删除、回收站恢复 | `entityId: string` (项目或记录ID)<br>`entityType: 'project' \| 'record'`<br>`projectId?: string` (entityType=record 时必传)<br>`compact?: boolean` (紧凑模式, 默认 false)<br>`initialFiles?: Array` (默认 [])<br>`onFilesChange?: (files) => void` | `files` (当前文件列表)<br>`uploading: { name, progress } \| null`<br>`showDeleted: boolean` (回收站开关)<br>`deletedFiles: Array`<br>`loadingDeleted: boolean`<br>`previewFile: object \| null` (预览弹窗) |
| **ProjectCard** | 项目卡片展示 | `project: Project`<br>`onSetCurrent?: (id) => void` | 无（纯展示，导航用 useNavigate） |
| **RecordTree** | 实验记录按月分组树 | `records: Array`<br>`activeId?: string`<br>`onSelect?: (id) => void` | 无（纯展示） |
| **TemplateCard** | 模板卡片展示 | `template: Template` | 无（纯展示） |

#### 2.3 UI 原子组件

| 组件 | 职责 | Props | 核心 State |
|------|------|-------|-----------|
| **Badge** | 颜色徽章 | `tone: BadgeTone` (默认 'gray')<br>`children` | 无 |
| **StatusBadge** | 状态→颜色映射 + 中文标签 | `kind: 'project' \| 'record'`<br>`status: string` | 无 |
| **PageHeader** | 页面标题区 | `eyebrow?: string`<br>`title?: string`<br>`description?: string`<br>`actions?: ReactNode` | 无 |
| **Surface** | 卡片容器（可选标题栏） | `title?: string`<br>`extra?: ReactNode`<br>`className?, style?`<br>`children` | 无 |
| **StatCard** | 统计数字卡片 | `stat: DashboardStat` | 无 |
| **GelPreview** | 凝胶电泳装饰图 | `caption?: string` (默认 '结果图预览') | 无 (纯 CSS 装饰) |
| **ProtectedRoute** | 鉴权守卫（未登录→重定向/login） | `children` | 无 (读取 `authStore`) |

#### 2.4 页面组件

| 组件 | 路由 | Props | 核心 State |
|------|------|-------|-----------|
| **LoginPage** | /login | 无 | `username, password, error, submitting` |
| **DashboardPage** | / | 无 | `stats, projects, records, todos, notifications` (5 组异步数据) |
| **ProjectsPage** | /projects | 无 | `projects` |
| **ProjectDetailPage** | /projects/:projectId | 无 (useParams 取 projectId) | `project, records, attachments, activities, timeline, members, exporting` |
| **RecordsPage** | /records | 无 | `records, activeId` |
| **RecordDetailPage** | /records/:recordId | 无 (useParams) | `record, comments, attachments, exportingPdf, exportingMd` |
| **RecordEditorPage** | /records/new<br>/records/:recordId/edit | 无 (useParams) | `record, activeOutline` |
| **TemplatesPage** | /templates | 无 | `templates, activeTab` |
| **SearchPage** ★ | /search | 无 (useSearchParams 取 q, projectId) | `keyword, projectId, hits[], page, total, totalPages, loading, error, searched` (9 个状态) |
| **TeamPage** | /team | 无 | `members, matrix` |
| **AiAssistantPage** | /ai | 无 | `feature, text, result, loading` |
| **NotFoundPage** | * | 无 | 无 |

---

### 3. UI 骨架与 DOM 嵌套 (UI Skeleton)

#### 3.1 文件管理区（ProjectDetailPage 中嵌入 + FileManager 展开）

```
<section>                                           // ProjectDetailPage 根

  → <.detail-header>                                // 项目标题 + 状态徽章 + 元信息网格
       ├── <span.eyebrow>                           // "项目管理"
       ├── <h1>                                     // 项目名
       ├── <StatusBadge kind="project" />           // 状态徽章
       ├── <.meta-grid>                             // 4 列：编号/负责人/成员数/更新时间
       └── <.card-actions>                          // 编辑 / 导出 Excel / 归档

  → <.stats-grid>                                   // 4 个 StatCard
       ├── <StatCard stat={...} />
       ├── <StatCard stat={...} />
       ├── <StatCard stat={...} />
       └── <StatCard stat={...} />

  → <.split-layout>                                 // 双栏布局

       → <Surface title="概览与最近实验">            // 左栏
            ├── <p>                                 // 项目描述
            └── <table>                             // 实验记录简表
                 └── <tr> (每行)
                      ├── <td> (标题)
                      ├── <td> (类型)
                      ├── <td> (状态 → StatusBadge)
                      └── <td> (更新时间)

       → <aside.surface>                            // 右栏
            ├── <h2> "项目附件"
            ├── <FileManager                         // ★ 文件管理组件
            │      entityId={projectId}
            │      entityType="project"
            │      compact />
            │   >
            │   ├── <.fm-upload-bar>
            │   │    ├── <input type="file" hidden />
            │   │    ├── <button> "+ 上传附件"
            │   │    ├── <span> (格式/大小提示)
            │   │    └── <label.toggle-switch> "回收站" <input checkbox />
            │   │
            │   ├── <.fm-progress-bar>              // 条件渲染：上传中
            │   │    ├── <span> (文件名 + 百分比)
            │   │    └── <div.bar-fill>              // 进度条填充
            │   │
            │   ├── <.fm-file-list>                 // 文件表格
            │   │    ├── <.fm-row.fm-header>        // 表头
            │   │    │    ├── <span> "文件名"
            │   │    │    ├── <span> "大小"
            │   │    │    ├── <span> "上传时间"
            │   │    │    └── <span> "操作"
            │   │    │
            │   │    ├── <.fm-row>                  // ← FileRow (活跃文件，循环)
            │   │    │    ├── <.fm-icon>            // 文件类型图标 (彩色)
            │   │    │    │    └── <.icon-box>      // 背景色 + 扩展名缩写
            │   │    │    ├── <.fm-name>            // 文件名 (带 title tooltip)
            │   │    │    ├── <.fm-size>            // 格式化文件大小
            │   │    │    ├── <.fm-time>            // 上传时间 (compact 模式隐藏)
            │   │    │    └── <.fm-actions>         // 操作按钮组
            │   │    │         ├── <button> 👁 预览
            │   │    │         ├── <button> ⬇ 下载
            │   │    │         └── <button> 🗑 删除
            │   │    │
            │   │    └── <.fm-row.deleted>          // ← FileRow (已删除文件，回收站模式)
            │   │         ├── ... (同上，但无预览/下载)
            │   │         └── <.fm-actions>
            │   │              └── <button> ↩ 恢复
            │   │
            │   └── <.fm-preview-overlay>           // 条件渲染：预览弹窗
            │        ├── <.fm-preview-header>
            │        │    ├── <h3> (文件名)
            │        │    ├── <button> ⬇ (下载)
            │        │    ├── <button> ↗ (新窗口)
            │        │    └── <button> ✕ (关闭)
            │        └── <.fm-preview-body>
            │             ├── <img />                // 图片预览
            │             └── <iframe />             // PDF 预览
            │
            ├── <h2> "最近动态"
            └── <.activity-list>                    // 动态列表 (时间 + 用户 + 描述)

  → <Surface title="项目时间线">                    // 时间线条目
       └── <.timeline-item> × N

  → <Surface title="项目成员">                      // 成员表格
       └── <table> + <button> "邀请成员"
```

#### 3.2 全局搜索区（SearchPage 完整骨架）

```
<section.search-page>                              // SearchPage 根

  → <PageHeader
       eyebrow="搜索中心"
       title="全局检索"
       description="跨项目、实验记录、附件和模板进行全文搜索" />

  → <Surface className="search-bar-panel">
       → <form.search-bar-form>
            ├── <.search-input-wrap>
            │    ├── <svg> (搜索图标)
            │    ├── <input type="text"            // 关键词输入
            │    │         value={keyword}
            │    │         ref={inputRef}
            │    │         placeholder="输入关键词搜索项目、记录、文件、模板..." />
            │    └── <button.clear-btn>            // 条件渲染：清空按钮
            │         └── ✕
            │
            ├── <.search-bar-filters>
            │    ├── <select.project-filter-select> // 项目筛选下拉
            │    │    ├── <option> "全部项目"
            │    │    ├── <option> "GFP融合蛋白表达载体构建..."
            │    │    ├── <option> "IFN-β 抗病毒活性检测..."
            │    │    └── <option> "脂质体转染条件优化..."
            │    │
            │    └── <button.search-btn>            // 搜索按钮
            │         └── "搜索" | "搜索中..."
            │
            └── <.search-status>                    // 条件渲染：搜索结果摘要
                 └── "找到 {total} 条结果" (第 {page+1}/{totalPages} 页)

  → <.search-error>                                // 条件渲染：错误信息 + 重试按钮

  → <.search-placeholder>                          // 条件渲染：初始空白态
       ├── <svg> (大号搜索图标)
       └── <p> "输入关键词开始搜索..."

  → <.search-loading-skeleton>                     // 条件渲染：加载骨架屏
       └── <.skeleton-item> × 5
            └── <.skeleton-shimmer>                 // CSS shimmer 动画

  → <.search-results>                              // 条件渲染：结果列表
       ├── <.search-hit-item> (循环)               // 每条命中结果
       │    ├── <.hit-icon>                        // 实体类型图标
       │    │    └── <Badge tone={实体色调}>       // PROJECT/RECORD/FILE/TEMPLATE
       │    ├── <.hit-body>
       │    │    ├── <h3.hit-title>                // 命中标题 (可点击跳转)
       │    │    └── <p.hit-snippet>               // 摘要片段
       │    │         └── <em> (关键词高亮，dangerouslySetInnerHTML)
       │    └── <.hit-footer>
       │         ├── <span> (项目名 / 文件大小 / 模板分类)
       │         └── <span> (更新时间)
       │
       ├── <.search-load-more-wrap>                // 无限滚动触发器
       │    ├── <div ref={sentinelRef} />           // IntersectionObserver 观察目标
       │    └── <button> "加载更多"                // rootMargin '0px 0px 200px 0px'
       │
       └── <.search-loading-more>                  // 条件渲染：加载更多中
            ├── <span.spinner />
            └── "正在加载更多结果..."

  → <.search-no-results>                            // 条件渲染：搜索无结果
       └── "未找到与 "{keyword}" 相关的结果"
```

---

### 4. 样式依赖现状 (Style Strategy)

#### 4.1 样式方案类型

- **纯全局 CSS**：全部 14 个 `.css` 文件均为普通全局样式表，**未使用 CSS Modules、CSS-in-JS、Sass/Less 预处理器**。
- 样式文件采用**就近放置**策略：组件级 CSS 与对应 `.jsx` 放在同一目录（如 `components/file/file-manager.css`），页面级 CSS 放在 `pages/` 目录下（如 `pages/search.css`）。
- 入口在 `main.jsx` 中通过 `import './styles/global.css'` 加载全局样式；其余 CSS 由各自组件 `import` 引入，Vite 负责打包。

#### 4.2 设计令牌体系

全局样式文件 `styles/global.css` 使用 **CSS 自定义属性（CSS Custom Properties / CSS Variables）** 作为设计令牌：

```
--ink           #1a1a2e   (主文字色)
--ink-light     #6b7280   (次要文字色)
--brand         #2563eb   (品牌蓝)
--brand-light   #eff6ff   (品牌浅蓝背景)
--brand-hover   #1d4ed8   (品牌蓝悬停)
--sidebar       #0f172a   (侧边栏底色)
--sidebar-hover #1e293b   (侧边栏悬停)
--topbar        #ffffff   (顶栏底色)
--surface       #ffffff   (卡片底色)
--border        #e5e7eb   (分割线)
--radius        12px      (统一圆角)
--shadow-sm     ...       (轻阴影)
```

组件级 CSS 文件中的 `.badge`、`.btn`、`.surface`、`.page-head`、`.form-field` 等通用类也定义在 `global.css` 中，作为整个应用的基础样式骨架。

#### 4.3 第三方 UI 库

**未引入任何第三方 UI 组件库**（无 Ant Design、无 MUI、无 shadcn/ui、无 Tailwind CSS）。全部 UI 组件（Badge、Surface、StatCard、PageHeader 等）均为手写实现。

#### 4.4 类命名规范

- **BEM 混合风格**：使用中横线分隔的层级命名，如 `.fm-root` → `.fm-upload-bar` → `.fm-file-list` → `.fm-row` → `.fm-name`（FileManager 组件），前缀 `fm-` 作为命名空间避免冲突。
- **语义化命名**：`.app-shell`、`.workspace`、`.global-search`、`.split-layout`、`.hero-strip`、`.stats-grid` 等，命名即表意。
- **无 scoped 机制**：由于不使用 CSS Modules，所有类名全局可见，依靠开发者手动维护命名前缀（如 `fm-`、`search-`、`record-`、`editor-`）来避免冲突。

#### 4.5 响应式设计

`layout.css` 中有基础的响应式断点（`@media (max-width: 860px)`），侧边栏在窄屏下收起；`search.css`、`file-manager.css`、`project-card.css` 也包含少量响应式规则。整体响应式覆盖不全面，当前的移动端适配程度较低。

---

*本文档覆盖 `src/` 下 50 个文件，29 个 JSX 组件，14 个 CSS 样式表，12 个页面路由。*
