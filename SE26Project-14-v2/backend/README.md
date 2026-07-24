# BioNote Backend

Spring Boot REST API，负责认证、对象级权限、状态机、Flyway 迁移、文件存储、审计和导出。完整启动、环境变量、演示账号和测试说明见根目录 `README.md`。

```powershell
.\mvnw.cmd test
.\mvnw.cmd verify
.\mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev
```

API 前缀 `/api/v1`；健康检查 `/actuator/health`；OpenAPI `/swagger-ui/index.html`。数据库变化只能新增 `src/main/resources/db/migration/V*__*.sql`，不得修改已应用迁移。
