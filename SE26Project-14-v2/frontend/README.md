# BioNote Frontend

React + Vite 的 BioNote 第一阶段 MVP 前端，使用真实 `/api/v1` 服务，不包含业务 mock 或假成功交互。完整启动、演示和后端配置见根目录 `README.md`。

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run lint
npm.cmd test -- --run
npm.cmd run build
npm.cmd run test:e2e
```

Playwright 需要本机 MySQL 3306 可用；首次运行执行 `npx.cmd playwright install chromium`。开发服务器把 `/api` 代理到 `http://localhost:8080`，生产镜像由 Nginx 提供 SPA fallback 和 API 反向代理。
