# BioNote 前端骨架

生物实验记录助手的前端工程骨架。本阶段仅搭建**可运行、可扩展**的基础框架：页面结构、路由、组件边界、类型/接口占位，业务逻辑以 mock 数据与 TODO 标记占位。

## 技术栈

- **React 18** + **Vite 5**（JavaScript / JSX）
- **React Router 6** 路由
- **Zustand** 轻量全局状态
- 纯 CSS 设计系统（令牌抽取自原型 `bionote-static-legacy.html`）

> 项目《技术选型与学习计划》另列了 Ant Design / Axios / ECharts。本骨架阶段暂未引入，
> 以保持轻量并贴合原型自带的视觉风格；后续按需接入即可（API 层 `src/api` 为替换点）。

## 启动与构建

```bash
cd frontend
npm install      # 安装依赖
npm run dev      # 本地开发，默认 http://localhost:5173
npm run build    # 生产构建，输出到 dist/
npm run preview  # 预览构建产物
```

## 目录结构

```
src/
├── main.jsx / App.jsx        入口与根组件
├── router/                   路由配置
├── domain/                   业务枚举 + 标签映射 + JSDoc 类型
├── mocks/                    原型抽取的 mock 数据（TODO: 后端就绪后移除）
├── api/                      接口调用层（当前返回 mock Promise）
├── store/                    Zustand 全局状态
├── styles/                   全局基础样式与设计令牌
├── components/
│   ├── layout/               AppLayout / Sidebar / Topbar
│   ├── ui/                   Badge / StatusBadge / Surface / StatCard / PageHeader / GelPreview
│   ├── project/              ProjectCard
│   ├── record/               RecordTree
│   └── template/             TemplateCard
└── pages/                    各功能页面
```

## 后续开发指引

- 真实接口：替换 `src/api/client.js`（接入 Axios/fetch），各业务 API 函数签名保持不变。
- 状态管理：如复杂度上升，可在 `src/store` 下拆分多个 store。
- 组件内 `TODO` 注释标记了尚未实现的交互与业务逻辑。
