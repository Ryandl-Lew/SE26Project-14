# BioNote Backend 运行环境配置

## 前置依赖

| 依赖 | 版本要求 | 说明 |
|------|---------|------|
| JDK | 21+ | 运行环境 |
| Maven | 3.9+ | 构建工具 |
| MySQL | 8.x 或 9.x | 数据库（Docker 或本地安装） |

## 快速启动（开发）

```powershell
# 1. 启动 MySQL（Docker）
cd backend
docker compose up -d mysql

# 2. 启动后端（自动建库 + 迁移 + 种子数据）
mvn org.springframework.boot:spring-boot-maven-plugin:run
```

## 部署到服务器

### 方案一：Docker Compose 部署（推荐）

服务器需安装 Docker 和 Docker Compose。

```bash
# 1. 将 backend 目录上传到服务器
scp -r backend user@server:/opt/bionote/

# 2. 登录服务器，创建 compose.yml（包含后端 + MySQL）
cd /opt/bionote
```

新建 `deploy.yml`：

```yaml
services:
  mysql:
    image: mysql:8.4
    container_name: bionote-mysql
    restart: unless-stopped
    environment:
      MYSQL_DATABASE: bionote
      MYSQL_USER: bionote
      MYSQL_PASSWORD: bionote
      MYSQL_ROOT_PASSWORD: bionote-root
      TZ: Asia/Shanghai
    ports:
      - "3306:3306"
    volumes:
      - bionote-mysql-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-ubionote", "-pbionote"]
      interval: 5s
      timeout: 3s
      retries: 20

  backend:
    image: eclipse-temurin:21-jre
    container_name: bionote-backend
    restart: unless-stopped
    depends_on:
      mysql:
        condition: service_healthy
    ports:
      - "8080:8080"
    environment:
      DB_URL: jdbc:mysql://mysql:3306/bionote?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false&createDatabaseIfNotExist=true
      DB_USERNAME: bionote
      DB_PASSWORD: bionote
      JWT_SECRET: "your-production-secret-at-least-32-chars-long"
      CORS_ALLOWED_ORIGINS: "https://your-frontend-domain.com"
      SEED_ENABLED: "false"
    volumes:
      - ./target/bionote-backend-0.1.0-SNAPSHOT.jar:/app/app.jar
      - ./storage:/app/storage
    working_dir: /app
    command: java -jar app.jar

volumes:
  bionote-mysql-data:
```

```bash
# 3. 本地打包 JAR
mvn clean package -DskipTests

# 4. 上传 JAR 到服务器
scp target/bionote-backend-0.1.0-SNAPSHOT.jar user@server:/opt/bionote/

# 5. 在服务器上启动
docker compose -f deploy.yml up -d
```

### 方案二：手动部署（服务器直装 JDK + MySQL）

```bash
# 1. 服务器安装 JDK 21
sudo apt update
sudo apt install openjdk-21-jre -y

# 2. 安装 MySQL 并创建数据库
sudo apt install mysql-server -y
sudo mysql -e "CREATE DATABASE IF NOT EXISTS bionote DEFAULT CHARACTER SET utf8mb4;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'bionote'@'localhost' IDENTIFIED BY 'bionote';"
sudo mysql -e "GRANT ALL ON bionote.* TO 'bionote'@'localhost';"

# 3. 上传 JAR
scp target/bionote-backend-0.1.0-SNAPSHOT.jar user@server:/opt/bionote/

# 4. 运行
java -jar /opt/bionote/bionote-backend-0.1.0-SNAPSHOT.jar \
  --spring.profiles.active=dev \
  --DB_USERNAME=bionote \
  --DB_PASSWORD=bionote \
  --CORS_ALLOWED_ORIGINS=https://your-frontend.com
```

### 方案三：打包成单一镜像（便携部署）

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/bionote-backend-0.1.0-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

```bash
# 构建并推送镜像
docker build -t bionote-backend .
docker tag bionote-backend your-registry/bionote-backend:latest
docker push your-registry/bionote-backend:latest
```

服务器上只需一条命令启动：
```bash
docker run -d --name bionote-backend -p 8080:8080 \
  -e DB_URL=jdbc:mysql://your-mysql-host:3306/bionote?... \
  -e DB_USERNAME=bionote \
  -e DB_PASSWORD=bionote \
  -e JWT_SECRET="your-production-secret" \
  -e CORS_ALLOWED_ORIGINS="https://your-frontend.com" \
  -e SEED_ENABLED=false \
  -v /opt/bionote/storage:/app/storage \
  bionote-backend
```

## 部署后验证

```bash
# 健康检查
curl http://your-server:8080/api/v1/health

# 测试登录
curl -X POST http://your-server:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"li","password":"123456"}'
```

## 生产环境注意事项

| 事项 | 建议 |
|------|------|
| JWT_SECRET | 使用 32+ 字符随机字符串，**不要**使用默认值 |
| CORS_ALLOWED_ORIGINS | 只填真实前端域名，不要留 `*` |
| SEED_ENABLED | 设为 `false`，不要在线上数据库插演示数据 |
| 文件存储 | `storage/` 目录挂载外部持久卷，防止容器重启丢失 |
| 数据库密码 | 使用强密码，不要用 `bionote` 或 `123456` |
| HTTPS | 前方加 Nginx 反向代理并配置 SSL |

---

## 环境变量说明

以下环境变量可在系统环境或启动命令中配置：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `DB_URL` | `jdbc:mysql://localhost:3306/bionote?...&createDatabaseIfNotExist=true` | 数据库连接 URL，`createDatabaseIfNotExist=true` 自动创建数据库 |
| `DB_USERNAME` | `root` | 数据库用户名 |
| `DB_PASSWORD` | `123456` | 数据库密码 |
| `JWT_SECRET` | `development-only-secret-change-before-deploy-...` | JWT 签名密钥（至少 32 字符） |
| `JWT_EXPIRATION_SECONDS` | `7200` | Token 过期秒数 |
| `FILE_STORAGE_ROOT` | `./storage` | 文件上传存储根目录 |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | 允许跨域的前端地址（逗号分隔） |
| `SEED_ENABLED` | `true` | 是否初始化演示数据（用户 + 模板） |
| `SERVER_PORT` | `8080` | 应用端口 |

## 演示账号（`SEED_ENABLED=true` 时自动创建）

| 用户名 | 密码 | 姓名 | 角色 |
|--------|------|------|------|
| `li` | `123456` | 李同学 | 项目成员 |
| `wang` | `123456` | 王同学 | 项目成员 |
| `zhang` | `123456` | 张老师 | 审核者 |

## 测试

```powershell
mvn test
```

测试使用 H2 内存数据库（MySQL 兼容模式），无需 Docker 或 MySQL 实例。
