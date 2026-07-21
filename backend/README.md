# BioNote 合并后端

本目录是 `p1`-`p5` 当前后端实现的统一 Spring Boot 应用。合并版以 P1/P2 公共骨架为基础，整合项目成员、实验记录工作流、协作追溯、文件、搜索和导出代码，并修复了成员分支之间的实体、Repository、Flyway 与权限冲突。

## 已合入模块

| 来源 | 合入内容 |
| --- | --- |
| P1 | JWT 认证、用户、统一响应与异常、Trace ID、Security、OpenAPI |
| P2 | 项目 CRUD、成员管理、项目活动、项目级 Repository |
| P3 | 原目录未提交模板或记录业务实现，仅保留公共骨架 |
| P4 | 实验记录 CRUD、状态流转、评论、审核、版本、审计、模板实体与种子数据 |
| P5 | 文件存储、附件 API、权限过滤搜索、真实数据 Markdown/PDF/Excel 导出、性能测试 |

合并时统一采用 Vision 定义的项目角色：`OWNER`、`MEMBER`、`REVIEWER`、`OBSERVER`。P4 的 `ProjectAccessService`、P5 文件/搜索/导出均复用 P2 项目成员数据，不再使用固定 mock 用户或项目 ID。

## 环境要求

- JDK 21+
- Maven 3.9+
- Docker Desktop，或可访问的 MySQL 8

## 启动

```powershell
docker compose up -d mysql
mvn spring-boot:run
```

默认地址：

- API: `http://localhost:8080/api/v1`
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- 健康检查: `http://localhost:8080/api/v1/health`

配置项见 `.env.example`。生产环境必须覆盖 `JWT_SECRET`、数据库密码和 CORS 来源。

## 演示数据

开发环境默认初始化三个账号，密码均为 `123456`：

| 用户名 | 姓名 | 演示角色 |
| --- | --- | --- |
| `li` | 李同学 | OWNER |
| `wang` | 王同学 | MEMBER |
| `zhang` | 张老师 | REVIEWER |

同时初始化三个项目、十条实验记录和三套完整内置模板（PCR 扩增、琼脂糖凝胶电泳、发酵工程）。非演示环境应设置 `SEED_ENABLED=false`。

## 测试

```powershell
mvn test
```

测试使用 H2 的 MySQL 兼容模式，无需 Docker。当前共 42 个测试，覆盖应用/Flyway 启动、认证、项目隔离与成员权限、模板与记录状态机、禁止自审、版本冲突、Dashboard/搜索数据隔离、文件签名与补偿清理、路径穿越防护，以及 Markdown/PDF/Excel 导出。

## 主要接口

- `/api/v1/auth`: 登录、当前用户、登出
- `/api/v1/projects`: 项目 CRUD、归档、活动与成员
- `/api/v1/templates`: 模板查询、category 筛选、自定义模板创建与字段整体更新
- `/api/v1/records`: 记录 CRUD、复制、开始、提交、审核、补充、归档、评论与版本
- `/api/v1/dashboard`: 当前用户可访问项目范围内的工作台聚合数据
- `/api/v1/projects/{id}/statistics`: 项目记录状态、审核和趋势聚合
- `/api/v1/projects/{id}/files`、`/api/v1/records/{id}/attachments`: 文件闭环
- `/api/v1/search`: 权限过滤的项目、记录、模板、附件和项目活动联合分页搜索
- `/api/v1/projects/{id}/export?format=md|pdf|excel`: 项目 Markdown/PDF/Excel 导出
- `/api/v1/records/{id}/export`: 单记录 PDF 导出

旧的 `/api/v1/export/projects/{id}` 与 `/api/v1/export/records/{id}` 路径暂保留为兼容别名。

## 数据库说明

`src/main/resources/db/migration/V1__create_core_schema.sql` 是已经发布的合并基线；后续结构补充位于 `V2__complete_p0_schema.sql`，包括记录模板快照和完成 P0 所需的约束/索引。P5 原有的 `V2__drop_attachment_foreign_keys.sql` 为 mock 联调临时方案，合并版未采用，附件到项目、记录和上传者的外键仍保持有效。

如果本地数据库曾执行任一成员分支的旧 V1/V2，请重建开发库后再启动合并版；不要在已有 Flyway 历史上直接替换 V1。

## 当前实现范围

- P0 后端闭环已实现：项目权限、直接归档、模板快照、记录工作流、Dashboard、权限搜索、文件安全与统一错误响应。
- P1 已实现：项目 Markdown/PDF/Excel 导出、单记录 PDF、自定义模板、项目统计/趋势；PDF 使用 classpath 内嵌中文字体，不依赖服务器字体。
- AI 助手、提醒、样品库、试剂库存、独立文件中心、WebSocket 和邮件通知不在当前范围。
- 公共前端未在本轮修改；联调时应以本节列出的公开路径和 Swagger 为准。

后续新增表结构必须使用新的 Flyway 版本，不再修改已经发布的合并 V1。
