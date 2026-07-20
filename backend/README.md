# BioNote Backend

Spring Boot backend skeleton for the BioNote biological experiment notebook. It provides a verified project baseline, authentication, unified API errors, database migrations, OpenAPI and explicit module ownership so five members can start in parallel.

## Requirements

- JDK 21 or newer
- Maven 3.9+
- Docker Desktop, or an existing MySQL 8 instance

## Start locally

1. Start MySQL:

   ```powershell
   docker compose up -d mysql
   ```

2. Start the application:

   ```powershell
   mvn spring-boot:run
   ```

3. Open the API documentation:

   ```text
   http://localhost:8080/swagger-ui.html
   ```

4. Verify the public health endpoint:

   ```text
   GET http://localhost:8080/api/v1/health
   ```

Configuration can be overridden with the environment variables listed in `.env.example`. Never commit a production JWT secret or database password.

## Demo users

Development seeding is enabled by default. All demo accounts use password `123456`.

| Username | Name | Intended role |
| --- | --- | --- |
| `li` | 李同学 | project owner/member |
| `wang` | 王同学 | project member |
| `zhang` | 张老师 | reviewer |

Set `SEED_ENABLED=false` outside local demonstration environments.

## Run tests

Tests use an isolated H2 database in MySQL compatibility mode and do not require Docker:

```powershell
mvn test
```

The baseline tests verify application startup, Flyway migrations, public health, protected endpoints, login, JWT session restoration and validation errors.

## Key locations

- `src/main/resources/db/migration`: versioned database schema
- `src/main/java/com/bionote/common`: response, errors, trace IDs and persistence base types
- `src/main/java/com/bionote/security`: JWT and Spring Security
- `docs/API_CONVENTIONS.md`: contract and status-code rules
- `docs/MODULE_OWNERSHIP.md`: P1-P5 module boundaries
- `../BioNote_后续任务详细实现文档.md`: complete implementation and iteration plan

## Before implementing a module

1. Confirm its DTO and endpoint in OpenAPI.
2. Create the module's controller/service/repository/entity packages as needed.
3. Add a Flyway migration instead of editing an existing migration after it has been shared.
4. Implement project permission checks in the service layer.
5. Add success, validation, unauthorized and forbidden tests.
6. Request review from the owner listed in `docs/MODULE_OWNERSHIP.md`.
