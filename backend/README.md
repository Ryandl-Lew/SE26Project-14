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

同时初始化一个项目、三套内置模板和两条实验记录。非演示环境应设置 `SEED_ENABLED=false`。

## 测试

```powershell
mvn test
```

测试使用 H2 的 MySQL 兼容模式，无需 Docker。当前共 23 个测试，覆盖应用/Flyway 启动、认证、文件上传下载与软删除、路径穿越防护，以及 10,000 条记录加 2,000 个附件的权限搜索性能场景。

## 主要接口

- `/api/v1/auth`: 登录、当前用户、登出
- `/api/v1/projects`: 项目 CRUD、归档、活动与成员
- `/api/v1/records`: 记录 CRUD、复制、提交、审核、归档、评论与版本
- `/api/v1/projects/{id}/files`、`/api/v1/records/{id}/attachments`: 文件闭环
- `/api/v1/search`: 按当前用户项目成员关系过滤的综合搜索
- `/api/v1/export`: 真实记录数据的 Markdown、PDF 与项目 Excel 导出

## 数据库说明

`src/main/resources/db/migration/V1__create_core_schema.sql` 是合并后的全量新库基线。P5 原有的 `V2__drop_attachment_foreign_keys.sql` 为 mock 联调临时方案，合并版未采用，附件外键仍保持有效。

如果本地数据库曾执行任一成员分支的旧 V1/V2，请重建开发库后再启动合并版；不要在已有 Flyway 历史上直接替换 V1。

## 当前缺口

- P1 只提交了 `dashboard` 包占位，没有 Dashboard 聚合接口。
- P3 未提交模板/记录业务代码；当前记录实现来自 P4，模板已有实体、Repository 和三套种子数据，但没有 `/api/v1/templates` Controller。
- 项目、记录工作流与导出尚缺专门的集成测试；现有测试重点在认证、文件和搜索。
- 公共前端仍使用 mock API，本次任务没有修改 `frontend/`。

后续新增表结构必须使用新的 Flyway 版本，不再修改已经发布的合并 V1。
