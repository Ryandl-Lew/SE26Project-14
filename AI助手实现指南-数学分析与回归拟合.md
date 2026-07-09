# AI助手实现指南：数学分析与回归拟合

> 为 `bionote-static-legacy.html` 静态原型扩展 AI 助手功能的完整实现指南

---

## 1. 现状分析

### 1.1 现有代码回顾

`bionote-static-legacy.html` 是一个约 2064 行的纯前端静态原型，包含以下核心组成部分：

| 组成部分 | 行号范围 | 行数 | 说明 |
|----------|----------|------|------|
| CSS 设计系统 | L7 ~ L1162 | ~1155 行 | CSS 变量、布局、组件、响应式 |
| HTML 主体结构 | L1165 ~ L2028 | ~863 行 | 侧边栏、顶栏、页面区 |
| JavaScript | L2031 ~ L2062 | ~31 行 | 仅页面切换 + toast |

现有 CSS 设计系统提供了丰富的 CSS 变量（`--ink`、`--muted`、`--brand`、`--blue` 等）和组件样式（`.primary-btn`、`.secondary-btn`、`.surface`、`.field`、`.badge` 等），这些都可以被 AI 助手的新增样式复用。

### 1.2 AI 页面现有内容（L1971 ~ L2024）

当前 `#ai` section 的内容为纯静态展示，由三栏布局构成：

```
+------------------+---------------------------+------------------+
| 功能选择（aside） |  输入实验描述（section）   | 结构化结果（aside）|
|                  |                           |                  |
| · 生成实验记录   |  textarea: PCR 描述       | side-chip ×6     |
| · 整理实验记录   |                           | (实验类型/PCR...) |
| · 生成实验摘要   |  按钮组:                  |                  |
| · 检查记录完整性 |   生成实验记录草稿        | stat-card:       |
| · 分析实验问题   |   插入当前记录            | 78/100           |
|                  |   重新生成                |                  |
| select: 关联项目 |   复制                    |                  |
+------------------+---------------------------+------------------+
```

### 1.3 不足之处

- **无实际计算**：评分 `78/100` 是硬编码的静态数值
- **无数据输入表格**：无法输入自定义实验数据
- **无图表渲染**：没有可视化能力
- **无 API 调用**：没有对接任何 LLM 服务
- **无数学分析能力**：缺乏回归分析、曲线拟合等科学计算

---

## 2. 总体方案

### 2.1 架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AI 助手三栏布局                              │
├───────────────┬───────────────────────────────┬─────────────────────┤
│  ai-sidebar   │        ai-main                │     ai-result       │
│               │                               │                     │
│ ┌───────────┐ │ ┌───────────────────────────┐ │ ┌─────────────────┐ │
│ │ 功能导航   │ │ │ 子面板 (Tab 切换)         │ │ │ 拟合图表         │ │
│ │           │ │ │                           │ │ │ (Chart.js)      │ │
│ │ · 实验记录 │ │ │ ┌─────────────────────┐  │ │ │                 │ │
│ │ · 曲线拟合 │ │ │ │ record / curve-fit  │  │ │ └─────────────────┘ │
│ │ · 统计分析 │ │ │ │ statistics / qa     │  │ │ ┌─────────────────┐ │
│ │ · 实验问答 │ │ │ │ manual              │  │ │ │ 拟合参数         │ │
│ │ · 使用说明 │ │ │ └─────────────────────┘  │ │ │ R², 系数, 方程  │ │
│ │           │ │ │                           │ │ └─────────────────┘ │
│ │ ────────  │ │ └───────────────────────────┘ │ ┌─────────────────┐ │
│ │ API 配置  │ │                               │ │ 分析结论         │ │
│ │           │ │                               │ │ (自动生成)      │ │
│ │ · 服务商  │ │                               │ └─────────────────┘ │
│ │ · API Key │ │                               │                     │
│ │ · 模型    │ │                               │                     │
│ └───────────┘ │                               │                     │
├───────────────┴───────────────────────────────┴─────────────────────┤
│                        ┌──────────────┐                             │
│                        │  MathEngine  │  纯前端数学计算层            │
│                        │  (纯 JS)     │  回归分析 / 统计 / 异常检测  │
│                        └──────┬───────┘                             │
│                               │                                     │
│                        ┌──────┴───────┐                             │
│                        │  LLM API 层   │  云端推理层                 │
│                        │  OpenAI /     │  对话 / 实验记录生成        │
│                        │  DeepSeek /   │                             │
│                        │  自定义       │                             │
│                        └──────────────┘                             │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 数据流图

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  用户输入数据  │────▶│  DataManager  │────▶│  MathEngine  │
│  (表格/粘贴/  │     │  (解析/验证)   │     │  (回归分析)  │
│   示例数据)   │     └──────────────┘     └──────┬───────┘
└──────────────┘                                  │
                                                  ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  AI 用户界面  │◀────│  FitEngine   │◀────│  拟合结果    │
│  (结果展示)   │     │  (可视化)    │     │  {slope,     │
└──────────────┘     └──────────────┘     │   intercept, │
                                           │   r2, eq}    │
┌──────────────┐     ┌──────────────┐     └──────────────┘
│  AIChatEngine│────▶│  LLM API     │
│  (对话管理)   │     │  (云端推理)   │
└──────────────┘     └──────────────┘
```

### 2.3 核心模块划分

| 模块 | 命名 | 职责 |
|------|------|------|
| 数学引擎 | `MathEngine` | 线性回归、多项式拟合、指数拟合、对数拟合、幂函数拟合、描述性统计、异常值检测 |
| 数据管理 | `DataManager` | 从表格读取数据、从文本解析数据、数据校验、表格同步 |
| 拟合可视化 | `FitEngine` | 执行拟合、Chart.js 图表渲染、参数面板渲染、自动分析结论 |
| AI 对话 | `AIChatEngine` | LLM API 调用、聊天界面管理、上下文注入、API 配置持久化 |
| UI 交互 | `initAIUI()` | 事件绑定、面板切换、模式切换、按钮响应 |

---

## 3. 技术选型

### 3.1 前端数学库：simple-statistics

使用 simple-statistics 对自定义回归方法进行辅助验证，同时提供描述性统计函数。

```html
<script src="https://cdn.jsdelivr.net/npm/simple-statistics@7.8.3/dist/simple-statistics.min.js"></script>
```

注意：本项目中的回归分析采用**自实现的数学方法**（高斯消元法求解正规方程），不依赖 simple-statistics 进行回归，仅将其作为统计辅助工具（如 `ss.quantile`、`ss.standardDeviation` 等可选使用）。

### 3.2 图表库：Chart.js

使用 Chart.js 4.x 版本渲染散点图与拟合曲线。

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
```

### 3.3 可选依赖

| 库 | 用途 | CDN |
|----|------|-----|
| Papa Parse | CSV 数据导入 | `https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js` |
| math.js | 高级矩阵运算 | `https://cdn.jsdelivr.net/npm/mathjs@11.12.0/lib/browser/math.js` |

本方案中不使用这些可选依赖，保持最小依赖集。

### 3.4 LLM API 选择

| 服务商 | 模型 | 端点 | 特点 |
|--------|------|------|------|
| OpenAI | GPT-4o-mini | `https://api.openai.com/v1/chat/completions` | 质量高、生态成熟 |
| DeepSeek | deepseek-chat | `https://api.deepseek.com/v1/chat/completions` | 性价比高、中文优秀 |
| 自定义 | 用户指定 | 用户自行填写 endpoint | 兼容 OpenAI 格式的均可 |

### 3.5 浏览器兼容性

- **Chart.js 4.x**：支持 Chrome 80+、Firefox 80+、Edge 80+、Safari 13.1+
- **simple-statistics 7.x**：ES5 兼容，支持所有现代浏览器
- **ES6+ 语法**（`const`、`let`、箭头函数、模板字符串）：Chrome 51+ / Firefox 54+ / Edge 14+

---

## 4. HTML 结构改造

### 4.1 添加 CDN 依赖

在 `</style>` 之后、`</head>` 之前（原文件 L1163 之后）添加两个 `<script>` 标签：

```html
  </style>
  <script src="https://cdn.jsdelivr.net/npm/simple-statistics@7.8.3/dist/simple-statistics.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
</head>
```

### 4.2 替换 AI 页面 section

将现有 `#ai` section（原文件 L1971 ~ L2024）完整替换为以下内容：

```html
        <section class="page" id="ai">
          <div class="page-head">
            <div>
              <p class="eyebrow">AI 助手</p>
              <h1>数学分析 · 回归拟合 · 智能问答</h1>
              <p class="page-desc">实验数据回归拟合、统计分析，以及 AI 辅助记录生成。</p>
            </div>
          </div>
          <div class="ai-layout">

            <!-- 左侧：功能选择 + API 配置 -->
            <aside class="ai-sidebar">
              <h2>功能选择</h2>
              <div class="outline-list" id="aiTabList">
                <button class="active" data-ai-panel="record">📝 实验记录</button>
                <button data-ai-panel="curve-fit">📈 曲线拟合</button>
                <button data-ai-panel="statistics">📊 统计分析</button>
                <button data-ai-panel="qa">💬 实验问答</button>
                <button data-ai-panel="manual">📖 使用说明</button>
              </div>

              <div id="apiConfigArea" style="margin-top: 20px; display: none;">
                <h2>API 配置</h2>
                <div class="field">
                  <label>服务商</label>
                  <select id="apiProvider">
                    <option value="openai">OpenAI</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="custom">自定义</option>
                  </select>
                </div>
                <div class="field" id="apiUrlField" style="display:none;">
                  <label>API 端点 URL</label>
                  <input type="text" id="apiEndpoint" placeholder="https://api.openai.com/v1/chat/completions">
                </div>
                <div class="field">
                  <label>API Key</label>
                  <input type="password" id="apiKey" placeholder="sk-...">
                </div>
                <div class="field">
                  <label>模型名称</label>
                  <input type="text" id="apiModel" placeholder="gpt-4o-mini">
                </div>
                <button class="primary-btn" id="btnSaveConfig" style="width:100%; margin-top:8px;">保存配置</button>
              </div>

              <button class="ghost-btn" id="btnToggleApiConfig" style="width:100%; margin-top:16px;">⚙️ API 设置</button>
            </aside>

            <!-- 中间：子面板 -->
            <section class="ai-main">
              <!-- 实验记录子面板 -->
              <div class="ai-sub-panel active" id="panel-record">
                <h2>AI 生成实验记录</h2>
                <div class="field">
                  <label>关联项目</label>
                  <select id="recordProject">
                    <option>GFP 融合蛋白表达项目</option>
                    <option>细胞转染条件优化</option>
                    <option>qPCR 引物验证</option>
                  </select>
                </div>
                <div class="field">
                  <label>实验描述</label>
                  <textarea id="recordDescription" rows="6" placeholder="用自然语言描述实验过程，AI 将自动生成结构化记录……">今天做了 PCR，用 Sample-001 做模板，引物是 GFP-F/GFP-R，退火温度 58℃，循环 35 次，跑胶后有一条 750 bp 的条带。</textarea>
                </div>
                <div class="field">
                  <label>拟合分析结果（自动附加到上下文）</label>
                  <textarea id="recordContext" rows="3" readonly placeholder="执行曲线拟合后，分析结果会自动显示在这里……"></textarea>
                </div>
                <div class="card-actions" style="margin-top: 12px;">
                  <button class="primary-btn" id="btnGenerateRecord">✨ 生成实验记录</button>
                  <button class="secondary-btn" id="btnClearRecord">清空</button>
                </div>
                <div id="recordResult" style="margin-top: 16px;"></div>
              </div>

              <!-- 曲线拟合子面板 -->
              <div class="ai-sub-panel" id="panel-curve-fit">
                <h2>数据输入</h2>
                <!-- 数据输入模式切换 -->
                <div class="data-input-mode">
                  <button class="mode-btn active" data-mode="table">📋 手动输入</button>
                  <button class="mode-btn" data-mode="paste">📋 粘贴数据</button>
                  <button class="mode-btn" data-mode="demo">📦 示例数据</button>
                </div>

                <!-- 手动表格输入 -->
                <div class="data-mode-content active" id="mode-table">
                  <div class="data-table-wrapper">
                    <table class="data-grid-table" id="dataGridTable">
                      <thead>
                        <tr><th>#</th><th>X (自变量)</th><th>Y (因变量)</th><th>权重</th><th></th></tr>
                      </thead>
                      <tbody id="dataGridBody"></tbody>
                    </table>
                  </div>
                  <div style="margin-top: 8px; display: flex; gap: 8px;">
                    <button class="secondary-btn" id="btnAddRow">＋ 添加行</button>
                    <button class="secondary-btn" id="btnClearData">清空数据</button>
                  </div>
                </div>

                <!-- 粘贴数据输入 -->
                <div class="data-mode-content" id="mode-paste">
                  <div class="field">
                    <label>粘贴数据（每行一个数据点，格式：x y 或 x y w）</label>
                    <textarea id="pasteDataArea" rows="8" placeholder="示例：
0 2.1
1 3.9
2 8.2
3 15.1
4 24.0"></textarea>
                  </div>
                  <button class="primary-btn" id="btnParsePaste" style="margin-top: 8px;">解析数据</button>
                </div>

                <!-- 示例数据 -->
                <div class="data-mode-content" id="mode-demo">
                  <ul class="demo-data-list">
                    <li><button data-demo="linear">📈 线性关系 — y = 2.5x + 1.8 + 噪声</button><span>10 个数据点</span></li>
                    <li><button data-demo="exponential">📈 指数增长 — y = 1.2 * e^(0.3x) + 噪声</button><span>10 个数据点</span></li>
                    <li><button data-demo="polynomial">📈 二次曲线 — y = 0.8x² - 1.5x + 3.0 + 噪声</button><span>10 个数据点</span></li>
                    <li><button data-demo="sigmoid">📈 S 型曲线 — y = 10/(1+e^(-0.5(x-5))) + 噪声</button><span>12 个数据点</span></li>
                  </ul>
                </div>

                <!-- 拟合设置 -->
                <div class="fit-settings">
                  <h2>拟合设置</h2>
                  <div class="field">
                    <label>拟合类型</label>
                    <select id="fitType">
                      <option value="linear">线性拟合 y = ax + b</option>
                      <option value="polynomial2">二次多项式 y = ax² + bx + c</option>
                      <option value="polynomial3">三次多项式 y = ax³ + bx² + cx + d</option>
                      <option value="exponential">指数拟合 y = a·e^(bx)</option>
                      <option value="logarithmic">对数拟合 y = a·ln(x) + b</option>
                      <option value="power">幂函数拟合 y = a·x^b</option>
                    </select>
                  </div>
                  <div class="field">
                    <label>
                      <input type="checkbox" id="useWeights"> 使用权重进行加权拟合
                    </label>
                  </div>
                  <button class="primary-btn" id="btnRunFit" style="width:100%; margin-top:12px;">▶ 执行拟合</button>
                </div>
              </div>

              <!-- 统计分析子面板 -->
              <div class="ai-sub-panel" id="panel-statistics">
                <h2>描述性统计分析</h2>
                <p class="page-desc">对输入的 X 和 Y 数据分别进行统计描述。</p>
                <div id="statsResultPanel" class="stats-result-panel">
                  <p style="color: var(--muted);">请先在「曲线拟合」面板中输入或加载数据，然后切换到此处查看统计结果。</p>
                </div>
                <button class="primary-btn" id="btnRunStats" style="margin-top: 12px;">▶ 执行统计分析</button>
              </div>

              <!-- 实验问答子面板 -->
              <div class="ai-sub-panel" id="panel-qa">
                <h2>💬 实验问答</h2>
                <div class="chat-container">
                  <div class="chat-messages" id="chatMessages">
                    <div class="chat-bubble assistant">
                      <div class="chat-avatar">🤖</div>
                      <div class="chat-content">
                        <p>您好！我是 BioNote AI 助手。您可以问我实验设计、数据分析、试剂选择等问题。请先在左侧配置 API Key。</p>
                      </div>
                    </div>
                  </div>
                  <div class="chat-input-row">
                    <input type="text" id="chatInput" placeholder="输入您的问题……" autocomplete="off">
                    <button class="primary-btn" id="btnSendChat">发送</button>
                  </div>
                </div>
              </div>

              <!-- 使用说明子面板 -->
              <div class="ai-sub-panel" id="panel-manual">
                <h2>📖 使用说明</h2>
                <div class="manual-content">
                  <h3>1. 曲线拟合</h3>
                  <p>在「曲线拟合」面板中输入数据（手动、粘贴或加载示例数据），选择拟合类型，点击「执行拟合」。右侧面板将显示拟合图表、参数和自动分析结论。</p>

                  <h3>2. 统计分析</h3>
                  <p>输入数据后，切换到「统计分析」面板，点击「执行统计分析」查看 X 和 Y 的描述性统计量（均值、标准差、最小值、最大值、中位数、异常值等）。</p>

                  <h3>3. AI 实验记录生成</h3>
                  <p>先在左侧「API 设置」中配置 API Key（支持 OpenAI、DeepSeek 或自定义兼容端点），然后在「实验记录」面板中输入实验描述，点击生成按钮。</p>

                  <h3>4. 实验问答</h3>
                  <p>配置 API Key 后，在「实验问答」面板中直接输入问题，AI 会结合当前拟合分析结果给出回答。</p>

                  <h3>5. 支持的分析类型</h3>
                  <ul>
                    <li><strong>线性回归</strong>：y = ax + b，最小二乘法</li>
                    <li><strong>多项式拟合</strong>：y = a₀ + a₁x + a₂x² + ...，高斯消元求解正规方程</li>
                    <li><strong>指数拟合</strong>：y = a·e^(bx)，对数变换法</li>
                    <li><strong>对数拟合</strong>：y = a·ln(x) + b，对数变换法</li>
                    <li><strong>幂函数拟合</strong>：y = a·x^b，双对数变换法</li>
                  </ul>

                  <h3>6. 注意事项</h3>
                  <ul>
                    <li>API Key 仅存储在浏览器 SessionStorage 中，关闭页面后自动清除</li>
                    <li>所有数学计算在浏览器本地完成，不依赖服务器</li>
                    <li>数据不会上传到任何服务器（除 LLM API 调用外）</li>
                  </ul>
                </div>
              </div>
            </section>

            <!-- 右侧：结果面板 -->
            <aside class="ai-result">
              <h2>拟合图表</h2>
              <div class="chart-container">
                <canvas id="fitChart"></canvas>
              </div>
              <div id="fitParamsPanel">
                <p style="color: var(--muted); text-align: center; margin-top: 24px;">执行拟合后将在此显示参数和结论。</p>
              </div>
            </aside>
          </div>
        </section>
```

### 4.3 新增 Toast 加载元素

在 `</body>` 之前（原文件 L2062 的 `</script>` 之后）添加：

```html
  <div class="loading-toast" id="loadingToast">
    <div class="loading-spinner"></div>
    <span id="loadingText">处理中……</span>
  </div>
```

---

## 5. CSS 样式新增

在原有 `</style>` 之前的响应式 `@media` 块之后、`</style>` 标签之前（原文件 L1162 之前），插入以下所有样式：

```css
    /* ========== AI 助手新增样式 ========== */

    /* --- 三栏布局 --- */
    .ai-layout {
      display: grid;
      grid-template-columns: 220px minmax(0, 1fr) 320px;
      gap: 20px;
      align-items: start;
    }

    .ai-sidebar {
      position: sticky;
      top: calc(var(--topbar) + 20px);
    }

    .ai-sidebar h2 {
      font-size: 14px;
      margin: 0 0 10px;
      color: var(--ink);
    }

    .ai-main {
      min-width: 0;
    }

    .ai-result {
      position: sticky;
      top: calc(var(--topbar) + 20px);
    }

    .ai-result h2 {
      font-size: 14px;
      margin: 0 0 10px;
      color: var(--ink);
    }

    /* --- 子面板 --- */
    .ai-sub-panel {
      display: none;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 20px;
    }

    .ai-sub-panel.active {
      display: block;
    }

    .ai-sub-panel h2 {
      font-size: 16px;
      margin: 0 0 14px;
    }

    /* --- 数据输入模式切换 --- */
    .data-input-mode {
      display: flex;
      gap: 8px;
      margin-bottom: 14px;
    }

    .mode-btn {
      padding: 6px 14px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--paper);
      color: var(--ink);
      font-size: 13px;
      cursor: pointer;
    }

    .mode-btn.active {
      border-color: var(--brand);
      background: var(--brand-soft);
      color: var(--brand);
      font-weight: 600;
    }

    .data-mode-content {
      display: none;
    }

    .data-mode-content.active {
      display: block;
    }

    /* --- 数据表格 --- */
    .data-table-wrapper {
      max-height: 260px;
      overflow-y: auto;
      border: 1px solid var(--line);
      border-radius: var(--radius);
    }

    .data-grid-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .data-grid-table th {
      background: var(--gray-soft);
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid var(--line);
      position: sticky;
      top: 0;
      z-index: 1;
    }

    .data-grid-table td {
      padding: 6px 10px;
      border-bottom: 1px solid var(--soft);
    }

    .data-grid-table input {
      width: 100%;
      padding: 5px 8px;
      border: 1px solid var(--line);
      border-radius: 4px;
      font-size: 13px;
    }

    .data-grid-table input:focus {
      border-color: var(--brand);
      outline: none;
      box-shadow: 0 0 0 2px rgba(23, 107, 91, 0.12);
    }

    .btn-remove-row {
      padding: 2px 8px;
      border: 1px solid var(--red-soft);
      border-radius: 4px;
      background: var(--red-soft);
      color: var(--red);
      font-size: 12px;
      cursor: pointer;
    }

    .btn-remove-row:hover {
      filter: brightness(0.95);
    }

    /* --- 示例数据列表 --- */
    .demo-data-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .demo-data-list li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      margin-bottom: 8px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .demo-data-list li:hover {
      background: var(--brand-soft);
      border-color: var(--brand);
    }

    .demo-data-list li button {
      border: none;
      background: none;
      font: inherit;
      color: var(--ink);
      cursor: pointer;
      text-align: left;
      font-size: 13px;
    }

    .demo-data-list li span {
      font-size: 12px;
      color: var(--muted);
      white-space: nowrap;
      margin-left: 12px;
    }

    /* --- 拟合设置 --- */
    .fit-settings {
      margin-top: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
    }

    .fit-settings h2 {
      margin-top: 0;
    }

    /* --- 图表容器 --- */
    .chart-container {
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 12px;
      margin-bottom: 16px;
    }

    .chart-container canvas {
      max-height: 260px;
    }

    /* --- 拟合参数行 --- */
    .fit-param-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid var(--soft);
      font-size: 13px;
    }

    .fit-param-row .param-label {
      color: var(--muted);
    }

    .fit-param-row .param-value {
      font-weight: 600;
      font-family: "Cascadia Code", "Consolas", monospace;
    }

    /* --- 拟合方程显示 --- */
    .fit-equation-box {
      background: var(--brand-soft);
      border: 1px solid var(--brand);
      border-radius: var(--radius);
      padding: 12px 16px;
      font-family: "Cascadia Code", "Consolas", monospace;
      font-size: 14px;
      text-align: center;
      margin: 12px 0;
      word-break: break-all;
    }

    /* --- 聊天界面 --- */
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 420px;
      border: 1px solid var(--line);
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--paper);
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .chat-bubble {
      display: flex;
      gap: 10px;
      max-width: 90%;
    }

    .chat-bubble.user {
      align-self: flex-end;
      flex-direction: row-reverse;
    }

    .chat-bubble.assistant {
      align-self: flex-start;
    }

    .chat-avatar {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      font-size: 16px;
      flex-shrink: 0;
    }

    .chat-bubble.user .chat-avatar {
      background: var(--blue-soft);
      color: var(--blue);
    }

    .chat-bubble.assistant .chat-avatar {
      background: var(--brand-soft);
      color: var(--brand);
    }

    .chat-content {
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .chat-bubble.user .chat-content {
      background: var(--blue);
      color: #ffffff;
    }

    .chat-bubble.assistant .chat-content {
      background: var(--gray-soft);
      color: var(--ink);
    }

    .chat-content p,
    .chat-content ul,
    .chat-content ol {
      margin: 4px 0;
    }

    .chat-content code {
      font-family: "Cascadia Code", "Consolas", monospace;
      font-size: 12px;
      background: rgba(0,0,0,0.06);
      padding: 1px 5px;
      border-radius: 3px;
    }

    .chat-input-row {
      display: flex;
      gap: 8px;
      padding: 10px 14px;
      border-top: 1px solid var(--line);
      background: var(--gray-soft);
    }

    .chat-input-row input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      font-size: 13px;
      outline: none;
    }

    .chat-input-row input:focus {
      border-color: var(--brand);
      box-shadow: 0 0 0 3px rgba(23, 107, 91, 0.1);
    }

    .chat-input-row button {
      flex-shrink: 0;
    }

    /* --- 统计分析结果 --- */
    .stats-result-panel {
      background: var(--gray-soft);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 14px;
      margin-top: 12px;
      font-size: 13px;
    }

    .stats-result-panel table {
      width: 100%;
      border-collapse: collapse;
    }

    .stats-result-panel th {
      text-align: left;
      padding: 6px 10px;
      border-bottom: 2px solid var(--line);
      font-weight: 600;
    }

    .stats-result-panel td {
      padding: 5px 10px;
      border-bottom: 1px solid var(--soft);
    }

    /* --- 使用说明 --- */
    .manual-content {
      font-size: 13px;
      line-height: 1.7;
    }

    .manual-content h3 {
      font-size: 14px;
      margin: 16px 0 6px;
    }

    .manual-content ul {
      padding-left: 18px;
    }

    .manual-content li {
      margin: 4px 0;
    }

    /* --- 加载动画 --- */
    .loading-toast {
      display: none;
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--ink);
      color: #fff;
      padding: 16px 28px;
      border-radius: 12px;
      z-index: 9999;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.25);
    }

    .loading-toast.show {
      display: flex;
    }

    .loading-spinner {
      width: 22px;
      height: 22px;
      border: 3px solid rgba(255,255,255,0.25);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* --- 打字指示器 --- */
    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 6px 0;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--muted);
      animation: typingBounce 1.2s infinite;
    }

    .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes typingBounce {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
      30% { transform: translateY(-6px); opacity: 1; }
    }

    /* --- API 配置区域 --- */
    #apiConfigArea {
      border-top: 1px solid var(--line);
      padding-top: 14px;
    }

    #apiConfigArea h2 {
      margin-top: 0;
    }

    #apiConfigArea .field {
      margin-bottom: 10px;
    }

    #apiConfigArea .field label {
      display: block;
      font-size: 12px;
      color: var(--muted);
      margin-bottom: 4px;
    }

    #apiConfigArea .field input,
    #apiConfigArea .field select {
      width: 100%;
      height: 34px;
      padding: 0 10px;
      border: 1px solid var(--line);
      border-radius: 6px;
      font-size: 13px;
    }

    #apiConfigArea .field input:focus,
    #apiConfigArea .field select:focus {
      border-color: var(--brand);
      outline: none;
    }

    /* --- 结论区域 --- */
    .conclusion-box {
      background: var(--amber-soft);
      border: 1px solid var(--amber);
      border-radius: var(--radius);
      padding: 12px 14px;
      font-size: 13px;
      line-height: 1.6;
      margin-top: 12px;
    }

    .conclusion-box strong {
      color: var(--amber);
    }

    .conclusion-box .outlier-warning {
      color: var(--red);
      margin-top: 6px;
      font-weight: 600;
    }

    /* --- 记录结果区域 --- */
    #recordResult {
      background: var(--gray-soft);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 16px;
      font-size: 13px;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    #recordResult:empty {
      display: none;
    }

    /* --- 响应式布局 --- */
    @media (max-width: 1180px) {
      .ai-layout {
        grid-template-columns: 200px minmax(0, 1fr);
      }

      .ai-result {
        grid-column: 1 / -1;
        position: static;
      }
    }

    @media (max-width: 780px) {
      .ai-layout {
        grid-template-columns: 1fr;
      }

      .ai-sidebar,
      .ai-result {
        position: static;
      }

      .chat-container {
        height: 320px;
      }
    }
```

---

## 6. JavaScript 核心实现

将原文件底部 `<script>` 标签内的内容（L2031 ~ L2062，保留原有页面切换逻辑）替换为以下完整代码。原有页面切换逻辑已合并到新代码的底部。

```javascript
    /* =================================================================
     * BioNote AI 助手 — 数学分析与回归拟合
     * ================================================================= */

    /* ---------- 6.1 MathEngine — 数学引擎 ---------- */
    const MathEngine = (() => {
      // 内部：求均值
      function _mean(arr) {
        let sum = 0;
        for (let i = 0; i < arr.length; i++) sum += arr[i];
        return sum / arr.length;
      }

      // 内部：构建并求解正规方程（高斯消元法）
      function _solveNormalEquation(X, Y, degree) {
        const n = X.length;
        const m = degree + 1;
        // 构建 A 矩阵 (m×m) 和 B 向量 (m)
        const A = new Array(m);
        const B = new Array(m);
        for (let i = 0; i < m; i++) {
          A[i] = new Array(m + 1); // 增广矩阵
          B[i] = 0;
        }

        // 计算 A 和 B
        for (let i = 0; i < m; i++) {
          for (let j = 0; j < m; j++) {
            let sum = 0;
            for (let k = 0; k < n; k++) {
              sum += Math.pow(X[k], i + j);
            }
            A[i][j] = sum;
          }
          let sumB = 0;
          for (let k = 0; k < n; k++) {
            sumB += Y[k] * Math.pow(X[k], i);
          }
          A[i][m] = sumB; // 增广列
        }

        // 高斯消元
        return _gaussElimination(A, m);
      }

      function _gaussElimination(A, n) {
        for (let col = 0; col < n; col++) {
          // 选主元
          let maxRow = col;
          let maxVal = Math.abs(A[col][col]);
          for (let row = col + 1; row < n; row++) {
            if (Math.abs(A[row][col]) > maxVal) {
              maxVal = Math.abs(A[row][col]);
              maxRow = row;
            }
          }
          // 交换行
          if (maxRow !== col) {
            const temp = A[col];
            A[col] = A[maxRow];
            A[maxRow] = temp;
          }

          const pivot = A[col][col];
          if (Math.abs(pivot) < 1e-12) continue;

          // 消元
          for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = A[row][col] / pivot;
            for (let j = col; j <= n; j++) {
              A[row][j] -= factor * A[col][j];
            }
          }
        }

        // 回代
        const coeffs = new Array(n);
        for (let i = 0; i < n; i++) {
          coeffs[i] = A[i][n] / A[i][i];
        }
        return coeffs;
      }

      // 计算预测值（多项式）
      function _polyPredict(x, coeffs) {
        let y = 0;
        for (let d = 0; d < coeffs.length; d++) {
          y += coeffs[d] * Math.pow(x, d);
        }
        return y;
      }

      // 计算 R²
      function _calcR2(xArr, yArr, predictFn) {
        const n = xArr.length;
        const yMean = _mean(yArr);
        let ssRes = 0;
        let ssTot = 0;
        for (let i = 0; i < n; i++) {
          const predicted = predictFn(xArr[i]);
          ssRes += (yArr[i] - predicted) * (yArr[i] - predicted);
          ssTot += (yArr[i] - yMean) * (yArr[i] - yMean);
        }
        if (ssTot < 1e-15) return 1.0;
        return 1 - ssRes / ssTot;
      }

      // 公开：线性回归 y = a*x + b
      function linearRegression(x, y) {
        const n = x.length;
        const xMean = _mean(x);
        const yMean = _mean(y);
        let num = 0, den = 0;
        for (let i = 0; i < n; i++) {
          num += (x[i] - xMean) * (y[i] - yMean);
          den += (x[i] - xMean) * (x[i] - xMean);
        }
        if (Math.abs(den) < 1e-15) {
          return { slope: 0, intercept: yMean, r2: 1.0, predicted: y.map(() => yMean), equation: `y = ${yMean.toFixed(4)}` };
        }
        const slope = num / den;
        const intercept = yMean - slope * xMean;
        const fn = (xi) => slope * xi + intercept;
        const predicted = x.map(fn);
        const r2 = _calcR2(x, y, fn);
        const equation = `y = ${slope.toFixed(4)}x + ${intercept.toFixed(4)}`;
        return { slope, intercept, r2, predicted, equation };
      }

      // 公开：多项式拟合（最小二乘 + 高斯消元）
      function polynomialFit(x, y, degree) {
        const coeffs = _solveNormalEquation(x, y, degree);
        const fn = (xi) => _polyPredict(xi, coeffs);
        const predicted = x.map(fn);
        const r2 = _calcR2(x, y, fn);
        return { coefficients: coeffs, r2, predicted, equation: formatPolyEquation(coeffs) };
      }

      function formatPolyEquation(coeffs) {
        const parts = [];
        for (let d = coeffs.length - 1; d >= 0; d--) {
          const c = coeffs[d];
          if (Math.abs(c) < 1e-12) continue;
          let term = '';
          if (d === 0) {
            term = c.toFixed(4);
          } else if (d === 1) {
            term = `${c.toFixed(4)}x`;
          } else {
            term = `${c.toFixed(4)}x^${d}`;
          }
          if (parts.length > 0 && c > 0) term = '+ ' + term;
          parts.push(term);
        }
        return 'y = ' + (parts.length ? parts.join(' ') : '0');
      }

      // 公开：指数拟合 y = a * e^(b*x)  使用对数变换 ln(y) = ln(a) + b*x
      function exponentialFit(x, y) {
        const lnY = y.map(v => Math.log(v));
        const lin = linearRegression(x, lnY);
        const a = Math.exp(lin.intercept);
        const b = lin.slope;
        const fn = (xi) => a * Math.exp(b * xi);
        const predicted = x.map(fn);
        const r2 = _calcR2(x, y, fn);
        const equation = `y = ${a.toFixed(4)} · e^(${b.toFixed(4)}x)`;
        return { a, b, r2, predicted, equation };
      }

      // 公开：对数拟合 y = a * ln(x) + b
      function logarithmicFit(x, y) {
        const lnX = x.map(v => Math.log(v));
        const lin = linearRegression(lnX, y);
        const a = lin.slope;
        const b = lin.intercept;
        const fn = (xi) => a * Math.log(xi) + b;
        const predicted = x.map(fn);
        const r2 = _calcR2(x, y, fn);
        const equation = `y = ${a.toFixed(4)} · ln(x) + ${b.toFixed(4)}`;
        return { a, b, r2, predicted, equation };
      }

      // 公开：幂函数拟合 y = a * x^b  双对数变换 ln(y) = ln(a) + b*ln(x)
      function powerFit(x, y) {
        const lnX = x.map(v => Math.log(v));
        const lnY = y.map(v => Math.log(v));
        const lin = linearRegression(lnX, lnY);
        const a = Math.exp(lin.intercept);
        const b = lin.slope;
        const fn = (xi) => a * Math.pow(xi, b);
        const predicted = x.map(fn);
        const r2 = _calcR2(x, y, fn);
        const equation = `y = ${a.toFixed(4)} · x^(${b.toFixed(4)})`;
        return { a, b, r2, predicted, equation };
      }

      // 公开：描述性统计
      function describe(values) {
        if (!values || values.length === 0) return null;
        const n = values.length;
        const sorted = values.slice().sort((a, b) => a - b);
        const mean = _mean(values);
        let sumSq = 0;
        for (let i = 0; i < n; i++) sumSq += (values[i] - mean) * (values[i] - mean);
        const std = Math.sqrt(sumSq / (n - 1));
        const min = sorted[0];
        const max = sorted[n - 1];
        const median = n % 2 === 1
          ? sorted[Math.floor(n / 2)]
          : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
        const q1 = sorted[Math.floor((n - 1) * 0.25)];
        const q3 = sorted[Math.floor((n - 1) * 0.75)];
        const iqr = q3 - q1;
        const variance = sumSq / (n - 1);
        return { n, mean, std, variance, min, max, median, q1, q3, iqr };
      }

      // 公开：IQR 异常值检测
      function detectOutliers(values, multiplier) {
        multiplier = multiplier || 1.5;
        const n = values.length;
        const sorted = values.slice().sort((a, b) => a - b);
        const q1 = sorted[Math.floor((n - 1) * 0.25)];
        const q3 = sorted[Math.floor((n - 1) * 0.75)];
        const iqr = q3 - q1;
        const lower = q1 - multiplier * iqr;
        const upper = q3 + multiplier * iqr;
        const outliers = [];
        for (let i = 0; i < n; i++) {
          if (values[i] < lower || values[i] > upper) {
            outliers.push({ index: i, value: values[i] });
          }
        }
        return { lower, upper, outliers };
      }

      return {
        _mean,
        _solveNormalEquation,
        _gaussElimination,
        linearRegression,
        polynomialFit,
        exponentialFit,
        logarithmicFit,
        powerFit,
        describe,
        detectOutliers
      };
    })();


    /* ---------- 6.2 DataManager — 数据管理器 ---------- */
    const DataManager = (() => {
      let _xData = [];
      let _yData = [];
      let _wData = []; // 权重（可选）

      function readFromTable() {
        const tbody = document.getElementById('dataGridBody');
        const rows = tbody.querySelectorAll('tr');
        const xArr = [], yArr = [], wArr = [];
        rows.forEach(row => {
          const inputs = row.querySelectorAll('input');
          const xVal = parseFloat(inputs[0].value);
          const yVal = parseFloat(inputs[1].value);
          const wVal = inputs.length >= 3 ? parseFloat(inputs[2].value) : NaN;
          if (!isNaN(xVal) && !isNaN(yVal)) {
            xArr.push(xVal);
            yArr.push(yVal);
            wArr.push(isNaN(wVal) ? 1 : wVal);
          }
        });
        _xData = xArr;
        _yData = yArr;
        _wData = wArr;
        return { x: xArr, y: yArr, w: wArr };
      }

      function parseFromText(text) {
        const lines = text.trim().split(/\r?\n/);
        const xArr = [], yArr = [], wArr = [];
        for (const line of lines) {
          const parts = line.trim().split(/[\s,]+/);
          if (parts.length >= 2) {
            const xVal = parseFloat(parts[0]);
            const yVal = parseFloat(parts[1]);
            const wVal = parts.length >= 3 ? parseFloat(parts[2]) : NaN;
            if (!isNaN(xVal) && !isNaN(yVal)) {
              xArr.push(xVal);
              yArr.push(yVal);
              wArr.push(isNaN(wVal) ? 1 : wVal);
            }
          }
        }
        _xData = xArr;
        _yData = yArr;
        _wData = wArr;
        return { x: xArr, y: yArr, w: wArr };
      }

      function setData(x, y, w) {
        _xData = x || [];
        _yData = y || [];
        _wData = w || x.map(() => 1);
        return { x: _xData, y: _yData, w: _wData };
      }

      function getData() {
        return { x: _xData, y: _yData, w: _wData };
      }

      function syncToTable() {
        const tbody = document.getElementById('dataGridBody');
        tbody.innerHTML = '';
        for (let i = 0; i < _xData.length; i++) {
          _addTableRow(tbody, _xData[i], _yData[i], _wData[i] || 1, i);
        }
      }

      function _addTableRow(tbody, xVal, yVal, wVal, index) {
        const tr = document.createElement('tr');
        tr.innerHTML =
          `<td>${index + 1}</td>` +
          `<td><input type="number" step="any" value="${xVal != null ? xVal : ''}" placeholder="X"></td>` +
          `<td><input type="number" step="any" value="${yVal != null ? yVal : ''}" placeholder="Y"></td>` +
          `<td><input type="number" step="any" value="${wVal != null ? wVal : ''}" placeholder="1" style="max-width:80px;"></td>` +
          `<td><button class="btn-remove-row" data-row="${index}">×</button></td>`;
        tr.querySelector('.btn-remove-row').addEventListener('click', function () {
          tr.remove();
          // 重新编号
          const rows = tbody.querySelectorAll('tr');
          rows.forEach((r, idx) => {
            r.querySelector('td').textContent = idx + 1;
            r.querySelector('.btn-remove-row').setAttribute('data-row', idx);
          });
        });
        tbody.appendChild(tr);
      }

      function addEmptyRow() {
        const tbody = document.getElementById('dataGridBody');
        const idx = tbody.querySelectorAll('tr').length;
        _addTableRow(tbody, '', '', '', idx);
      }

      function validate() {
        readFromTable();
        if (_xData.length < 2) {
          return { valid: false, message: '至少需要 2 个数据点才能进行分析。' };
        }
        if (_xData.length !== _yData.length) {
          return { valid: false, message: 'X 和 Y 数据点数量不一致。' };
        }
        // 检查是否有重复的 x 值（对数拟合不能有 x <= 0）
        for (let i = 0; i < _xData.length; i++) {
          if (!isFinite(_xData[i]) || !isFinite(_yData[i])) {
            return { valid: false, message: `第 ${i + 1} 行数据无效（包含 NaN 或 Infinity）。` };
          }
        }
        return { valid: true };
      }

      return {
        readFromTable,
        parseFromText,
        setData,
        getData,
        syncToTable,
        addEmptyRow,
        validate,
        _addTableRow
      };
    })();


    /* ---------- 6.3 FitEngine — 拟合与可视化引擎 ---------- */
    const FitEngine = (() => {
      let _chartInstance = null;

      function _showError(msg) {
        const panel = document.getElementById('fitParamsPanel');
        panel.innerHTML = `<p style="color: var(--red); text-align: center; margin-top: 16px;">⚠️ ${msg}</p>`;
      }

      function run() {
        const data = DataManager.getData();
        const x = data.x;
        const y = data.y;
        const w = data.w;
        const useWeights = document.getElementById('useWeights').checked;

        const fitType = document.getElementById('fitType').value;
        let result;

        try {
          switch (fitType) {
            case 'linear':
              result = MathEngine.linearRegression(x, y);
              break;
            case 'polynomial2':
              result = MathEngine.polynomialFit(x, y, 2);
              break;
            case 'polynomial3':
              result = MathEngine.polynomialFit(x, y, 3);
              break;
            case 'exponential':
              // 指数拟合要求 y 值全部 > 0
              for (let i = 0; i < y.length; i++) {
                if (y[i] <= 0) {
                  _showError('指数拟合要求所有 Y 值大于 0。请检查数据或选择其他拟合类型。');
                  return;
                }
              }
              result = MathEngine.exponentialFit(x, y);
              break;
            case 'logarithmic':
              // 对数拟合要求 x 值全部 > 0
              for (let i = 0; i < x.length; i++) {
                if (x[i] <= 0) {
                  _showError('对数拟合要求所有 X 值大于 0。请检查数据或选择其他拟合类型。');
                  return;
                }
              }
              result = MathEngine.logarithmicFit(x, y);
              break;
            case 'power':
              // 幂函数拟合要求 x > 0 且 y > 0
              for (let i = 0; i < x.length; i++) {
                if (x[i] <= 0 || y[i] <= 0) {
                  _showError('幂函数拟合要求所有 X 和 Y 值大于 0。请检查数据或选择其他拟合类型。');
                  return;
                }
              }
              result = MathEngine.powerFit(x, y);
              break;
            default:
              result = MathEngine.linearRegression(x, y);
          }
        } catch (e) {
          _showError('拟合计算出错：' + e.message);
          console.error('FitEngine.run error:', e);
          return;
        }

        // 加权修正（简化版：加权 R²）
        if (useWeights && w && w.length === x.length) {
          // 使用加权计算 R²
          let wSum = 0;
          for (let i = 0; i < w.length; i++) wSum += w[i];
          const yMeanW = y.reduce((sum, yi, i) => sum + yi * w[i], 0) / wSum;
          let ssResW = 0, ssTotW = 0;
          for (let i = 0; i < x.length; i++) {
            ssResW += w[i] * (y[i] - result.predicted[i]) * (y[i] - result.predicted[i]);
            ssTotW += w[i] * (y[i] - yMeanW) * (y[i] - yMeanW);
          }
          if (ssTotW > 1e-15) {
            result.r2 = Math.max(0, Math.min(1, 1 - ssResW / ssTotW));
          }
          result.weighted = true;
        }

        // 1. 渲染图表
        renderChart(x, y, result);

        // 2. 渲染参数
        renderParams(result);

        // 3. 渲染方程
        renderEquation(result.equation);

        // 4. 自动分析结论
        _autoConclusion(result, x, y);

        // 5. 将结果同步到实验记录上下文
        updateRecordContext(result);

        return result;
      }

      function renderChart(x, y, result) {
        const ctx = document.getElementById('fitChart').getContext('2d');
        if (_chartInstance) {
          _chartInstance.destroy();
        }

        // 生成拟合曲线的密集点
        const fitX = [];
        const minX = Math.min(...x);
        const maxX = Math.max(...x);
        const step = (maxX - minX) / 200;
        for (let xi = minX; xi <= maxX; xi += step) {
          fitX.push(xi);
        }
        // 确保包含最后一个点
        if (fitX[fitX.length - 1] !== maxX) fitX.push(maxX);

        const fitY = _calculateFitCurve(fitX, result);

        _chartInstance = new Chart(ctx, {
          type: 'scatter',
          data: {
            datasets: [
              {
                label: '实验数据',
                data: x.map((xi, i) => ({ x: xi, y: y[i] })),
                backgroundColor: 'rgba(47, 111, 236, 0.75)',
                borderColor: '#2f6fec',
                pointRadius: 5,
                pointHoverRadius: 7,
              },
              {
                label: '拟合曲线',
                data: fitX.map((xi, i) => ({ x: xi, y: fitY[i] })),
                type: 'line',
                borderColor: '#c83b3b',
                borderWidth: 2,
                backgroundColor: 'rgba(200, 59, 59, 0.08)',
                fill: false,
                pointRadius: 0,
                tension: 0,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 14, padding: 16, font: { size: 12 } }
              },
              tooltip: {
                callbacks: {
                  label: function (ctx) {
                    return `${ctx.dataset.label}: (${ctx.parsed.x.toFixed(4)}, ${ctx.parsed.y.toFixed(4)})`;
                  }
                }
              }
            },
            scales: {
              x: {
                title: { display: true, text: 'X (自变量)', font: { size: 12 } },
                ticks: { font: { size: 11 } }
              },
              y: {
                title: { display: true, text: 'Y (因变量)', font: { size: 12 } },
                ticks: { font: { size: 11 } }
              }
            }
          }
        });
      }

      function _calculateFitCurve(fitX, result) {
        const fitType = document.getElementById('fitType').value;
        return fitX.map(xi => {
          switch (fitType) {
            case 'linear':
              return result.slope * xi + result.intercept;
            case 'polynomial2':
            case 'polynomial3': {
              let y = 0;
              for (let d = 0; d < result.coefficients.length; d++) {
                y += result.coefficients[d] * Math.pow(xi, d);
              }
              return y;
            }
            case 'exponential':
              return result.a * Math.exp(result.b * xi);
            case 'logarithmic':
              return result.a * Math.log(xi) + result.b;
            case 'power':
              return result.a * Math.pow(xi, result.b);
            default:
              return result.slope * xi + result.intercept;
          }
        });
      }

      function renderParams(result) {
        const fitType = document.getElementById('fitType').value;
        let html = '<h2 style="margin-top: 18px;">拟合参数</h2>';

        // R² 颜色评级
        let r2Color, r2Label;
        if (result.r2 >= 0.95) { r2Color = 'var(--green)'; r2Label = '优秀'; }
        else if (result.r2 >= 0.80) { r2Color = 'var(--brand)'; r2Label = '良好'; }
        else if (result.r2 >= 0.50) { r2Color = 'var(--amber)'; r2Label = '一般'; }
        else { r2Color = 'var(--red)'; r2Label = '较差'; }

        html += `<div class="fit-param-row">
          <span class="param-label">R² (决定系数)</span>
          <span class="param-value" style="color:${r2Color};">${result.r2.toFixed(4)} <small>(${r2Label})</small></span>
        </div>`;

        if (fitType === 'linear') {
          html += `<div class="fit-param-row"><span class="param-label">斜率 (a)</span><span class="param-value">${result.slope.toFixed(4)}</span></div>`;
          html += `<div class="fit-param-row"><span class="param-label">截距 (b)</span><span class="param-value">${result.intercept.toFixed(4)}</span></div>`;
        } else if (fitType === 'polynomial2' || fitType === 'polynomial3') {
          const labels = fitType === 'polynomial2'
            ? ['常数项 (c)', '一次项 (b)', '二次项 (a)']
            : ['常数项 (d)', '一次项 (c)', '二次项 (b)', '三次项 (a)'];
          for (let i = 0; i < result.coefficients.length; i++) {
            html += `<div class="fit-param-row"><span class="param-label">${labels[i]}</span><span class="param-value">${result.coefficients[i].toFixed(4)}</span></div>`;
          }
        } else if (fitType === 'exponential') {
          html += `<div class="fit-param-row"><span class="param-label">系数 (a)</span><span class="param-value">${result.a.toFixed(4)}</span></div>`;
          html += `<div class="fit-param-row"><span class="param-label">指数 (b)</span><span class="param-value">${result.b.toFixed(4)}</span></div>`;
        } else if (fitType === 'logarithmic') {
          html += `<div class="fit-param-row"><span class="param-label">系数 (a)</span><span class="param-value">${result.a.toFixed(4)}</span></div>`;
          html += `<div class="fit-param-row"><span class="param-label">截距 (b)</span><span class="param-value">${result.b.toFixed(4)}</span></div>`;
        } else if (fitType === 'power') {
          html += `<div class="fit-param-row"><span class="param-label">系数 (a)</span><span class="param-value">${result.a.toFixed(4)}</span></div>`;
          html += `<div class="fit-param-row"><span class="param-label">指数 (b)</span><span class="param-value">${result.b.toFixed(4)}</span></div>`;
        }

        if (result.weighted) {
          html += `<div class="fit-param-row"><span class="param-label">加权</span><span class="param-value" style="color:var(--brand);">已启用</span></div>`;
        }

        document.getElementById('fitParamsPanel').innerHTML = html;
      }

      function renderEquation(equation) {
        const panel = document.getElementById('fitParamsPanel');
        const box = document.createElement('div');
        box.className = 'fit-equation-box';
        box.textContent = equation;
        panel.appendChild(box);
      }

      function _autoConclusion(result, x, y) {
        const outliers = MathEngine.detectOutliers(y, 1.5);
        const originalPanel = document.getElementById('fitParamsPanel');
        let html = '<div class="conclusion-box"><strong>📋 分析结论</strong>';

        if (result.r2 >= 0.95) {
          html += '<p>拟合效果优秀，R² ≥ 0.95，模型很好地解释了数据的变化。</p>';
        } else if (result.r2 >= 0.80) {
          html += '<p>拟合效果良好，R² ≥ 0.80，模型基本能够描述数据趋势。</p>';
        } else if (result.r2 >= 0.50) {
          html += '<p>中等拟合效果，建议尝试其他拟合类型或增加数据点。</p>';
        } else {
          html += '<p>拟合效果不理想（R² &lt; 0.50），该模型可能不适合此数据，请尝试其他模型。</p>';
        }

        html += `<p style="margin-top:6px;font-size:12px;color:var(--muted);">数据点数: ${x.length} | X 范围: [${Math.min(...x).toFixed(2)}, ${Math.max(...x).toFixed(2)}] | Y 范围: [${Math.min(...y).toFixed(2)}, ${Math.max(...y).toFixed(2)}]</p>`;

        if (outliers.outliers.length > 0) {
          html += `<p class="outlier-warning">⚠️ 检测到 ${outliers.outliers.length} 个 Y 值异常点: `;
          html += outliers.outliers.map(o => `第${o.index + 1}个 (y=${o.value.toFixed(3)})`).join(', ');
          html += '</p>';
        }

        html += '</div>';
        originalPanel.insertAdjacentHTML('beforeend', html);
      }

      function updateRecordContext(result) {
        const x = DataManager.getData().x;
        const y = DataManager.getData().y;
        const contextArea = document.getElementById('recordContext');
        contextArea.value =
          `[拟合分析结果]\n` +
          `拟合类型: ${document.getElementById('fitType').options[document.getElementById('fitType').selectedIndex].text}\n` +
          `方程: ${result.equation}\n` +
          `R² = ${result.r2.toFixed(4)}\n` +
          `数据点数: ${x.length}\n` +
          `X 均值: ${MathEngine._mean(x).toFixed(4)}\n` +
          `Y 均值: ${MathEngine._mean(y).toFixed(4)}`;
      }

      return {
        run,
        renderChart,
        renderParams,
        renderEquation,
        _calculateFitCurve,
        _autoConclusion,
        _showError
      };
    })();


    /* ---------- 6.4 AIChatEngine — AI 对话引擎 ---------- */
    const AIChatEngine = (() => {
      let _config = {
        provider: 'openai',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        apiKey: '',
        model: 'gpt-4o-mini'
      };

      function init() {
        // 从 SessionStorage 恢复配置
        const saved = sessionStorage.getItem('bionote_ai_config');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            _config = { ..._config, ...parsed };
            document.getElementById('apiProvider').value = _config.provider || 'openai';
            document.getElementById('apiKey').value = _config.apiKey || '';
            document.getElementById('apiModel').value = _config.model || 'gpt-4o-mini';
            document.getElementById('apiEndpoint').value = _config.endpoint || '';
            _toggleApiInputs();
          } catch (e) {
            console.warn('Failed to restore API config:', e);
          }
        }
      }

      function saveConfig() {
        _config.provider = document.getElementById('apiProvider').value;
        _config.apiKey = document.getElementById('apiKey').value.trim();
        _config.model = document.getElementById('apiModel').value.trim();

        if (_config.provider === 'openai') {
          _config.endpoint = 'https://api.openai.com/v1/chat/completions';
          _config.model = _config.model || 'gpt-4o-mini';
        } else if (_config.provider === 'deepseek') {
          _config.endpoint = 'https://api.deepseek.com/v1/chat/completions';
          _config.model = _config.model || 'deepseek-chat';
        } else {
          _config.endpoint = document.getElementById('apiEndpoint').value.trim();
          _config.model = _config.model || 'gpt-4o-mini';
        }

        sessionStorage.setItem('bionote_ai_config', JSON.stringify(_config));
        _showToast('✅ API 配置已保存');
      }

      function _toggleApiInputs() {
        const provider = document.getElementById('apiProvider').value;
        const urlField = document.getElementById('apiUrlField');
        if (provider === 'custom') {
          urlField.style.display = '';
        } else {
          urlField.style.display = 'none';
        }
      }

      function _showToast(msg) {
        const toast = document.getElementById('loadingToast');
        const text = document.getElementById('loadingText');
        text.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      }

      async function sendMessage(userMessage) {
        if (!_config.apiKey) {
          _addMessage('assistant', '⚠️ 请先在左侧「API 设置」中配置您的 API Key。');
          return;
        }

        _addMessage('user', userMessage);
        const loadId = _addLoadingIndicator();

        try {
          const messages = [
            {
              role: 'system',
              content: '你是 BioNote 生物实验记录助手的 AI 助手。你帮助用户进行生物实验设计、数据分析、试剂选择等。你的回答要专业、准确，使用中文，并在不确定时明确指出。如果用户提供了实验数据或拟合结果，请结合这些信息给出分析建议。'
            },
            {
              role: 'user',
              content: userMessage
            }
          ];

          // 自动附加当前拟合分析结果作为上下文
          const contextArea = document.getElementById('recordContext');
          if (contextArea && contextArea.value.trim()) {
            messages.splice(1, 0, {
              role: 'system',
              content: '以下是用户最近执行的拟合分析结果，请结合这些数据回答问题：\n' + contextArea.value
            });
          }

          const reply = await _callAPI(messages);
          _removeLoadingIndicator(loadId);
          _addMessage('assistant', reply);
        } catch (err) {
          _removeLoadingIndicator(loadId);
          console.error('AI Chat Error:', err);
          _addMessage('assistant', '❌ API 调用失败：' + err.message + '\n\n请检查：\n1. API Key 是否正确\n2. 网络连接是否正常\n3. 服务商是否可用');
        }
      }

      async function generateRecord(description, contextText) {
        if (!_config.apiKey) {
          // 无 API 时降级为本地演示
          return _demoGenerateRecord(description);
        }

        const systemPrompt = `你是 BioNote 生物实验记录助手的 AI 助手。
请根据用户的自然语言描述，生成一份结构化的实验记录。输出格式如下：

【实验名称】
【实验日期】今天
【实验目的】
【实验材料】
【实验步骤】
【实验结果】
【结论与讨论】

请确保：
1. 从描述中提取所有关键信息
2. 补充合理的实验细节
3. 使用专业术语
4. 标注不确定的信息为"[待确认]"`;

        const messages = [
          { role: 'system', content: systemPrompt },
        ];

        if (contextText && contextText.trim()) {
          messages.push({
            role: 'system',
            content: '以下是与本次实验相关的拟合分析数据：\n' + contextText
          });
        }

        messages.push({ role: 'user', content: description });

        try {
          return await _callAPI(messages);
        } catch (err) {
          console.error('Generate record error:', err);
          throw err;
        }
      }

      function _demoGenerateRecord(description) {
        // 无 API 时的本地演示模式
        return `【实验名称】PCR 扩增实验
【实验日期】2026-07-09
【实验目的】使用 GFP-F/GFP-R 引物对 Sample-001 模板进行 PCR 扩增
【实验材料】
  · 模板：Sample-001
  · 引物：GFP-F / GFP-R
  · Taq 酶：[待确认]
  · dNTP Mix：[待确认]
  · PCR Buffer：[待确认]
【实验步骤】
  1. 配制 PCR 反应体系（总体积 [待确认] μL）
  2. 设置 PCR 程序：预变性 [待确认]℃, [待确认]min
  3. 循环 35 次：变性 [待确认]℃/[待确认]s → 退火 58℃/[待确认]s → 延伸 [待确认]℃/[待确认]s
  4. 终延伸 [待确认]℃/[待确认]min
  5. 琼脂糖凝胶电泳检测
【实验结果】
  · 在约 750 bp 位置观察到单一清晰条带
  · 无引物二聚体或非特异性扩增
【结论与讨论】
  · PCR 扩增成功，获得预期大小的目的片段
  · 建议补充：Taq 酶批号、电泳结果图片
  · 后续可进行胶回收纯化及连接克隆\n\n⚠️ 注意：此为本地演示模式生成的结果。配置 API Key 后可获得更精准的 AI 生成内容。`;
      }

      async function _callAPI(messages) {
        const response = await fetch(_config.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${_config.apiKey}`
          },
          body: JSON.stringify({
            model: _config.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2048
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          let errMsg = `HTTP ${response.status}`;
          try {
            const errJson = JSON.parse(errText);
            errMsg += ': ' + (errJson.error?.message || errText);
          } catch {
            errMsg += ': ' + errText.substring(0, 200);
          }
          throw new Error(errMsg);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      }

      function _addMessage(role, content) {
        const container = document.getElementById('chatMessages');
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${role}`;
        bubble.innerHTML = `
          <div class="chat-avatar">${role === 'user' ? '👤' : '🤖'}</div>
          <div class="chat-content">${escapeHtml(content)}</div>
        `;
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
      }

      function _addLoadingIndicator() {
        const container = document.getElementById('chatMessages');
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble assistant';
        bubble.id = 'loading-indicator-' + Date.now();
        bubble.innerHTML = `
          <div class="chat-avatar">🤖</div>
          <div class="chat-content"><div class="typing-indicator"><span></span><span></span><span></span></div></div>
        `;
        container.appendChild(bubble);
        container.scrollTop = container.scrollHeight;
        return bubble.id;
      }

      function _removeLoadingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
      }

      function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      return {
        init,
        saveConfig,
        sendMessage,
        generateRecord,
        _callAPI,
        _addMessage,
        _addLoadingIndicator,
        _removeLoadingIndicator,
        _toggleApiInputs,
        _demoGenerateRecord
      };
    })();


    /* ---------- 6.5 initAIUI — UI 初始化函数 ---------- */
    function initAIUI() {
      /* --- 子面板 Tab 切换 --- */
      document.querySelectorAll('#aiTabList button').forEach(btn => {
        btn.addEventListener('click', function () {
          document.querySelectorAll('#aiTabList button').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          const panelId = 'panel-' + this.dataset.aiPanel;
          document.querySelectorAll('.ai-sub-panel').forEach(p => p.classList.remove('active'));
          const panel = document.getElementById(panelId);
          if (panel) panel.classList.add('active');
        });
      });

      /* --- API 配置变更保存 --- */
      document.getElementById('apiProvider').addEventListener('change', function () {
        AIChatEngine._toggleApiInputs();
        AIChatEngine.saveConfig();
      });

      document.getElementById('apiKey').addEventListener('change', () => AIChatEngine.saveConfig());
      document.getElementById('apiModel').addEventListener('change', () => AIChatEngine.saveConfig());
      document.getElementById('apiEndpoint').addEventListener('change', () => AIChatEngine.saveConfig());

      document.getElementById('btnSaveConfig').addEventListener('click', () => AIChatEngine.saveConfig());

      document.getElementById('btnToggleApiConfig').addEventListener('click', function () {
        const area = document.getElementById('apiConfigArea');
        if (area.style.display === 'none' || !area.style.display) {
          area.style.display = '';
          this.textContent = '⚙️ 收起设置';
        } else {
          area.style.display = 'none';
          this.textContent = '⚙️ API 设置';
        }
      });

      /* --- 数据输入模式切换 --- */
      document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function () {
          document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          const mode = this.dataset.mode;
          document.querySelectorAll('.data-mode-content').forEach(c => c.classList.remove('active'));
          document.getElementById('mode-' + mode).classList.add('active');
        });
      });

      /* --- 添加数据行 --- */
      document.getElementById('btnAddRow').addEventListener('click', () => DataManager.addEmptyRow());

      /* --- 清空数据 --- */
      document.getElementById('btnClearData').addEventListener('click', () => {
        DataManager.setData([], [], []);
        DataManager.syncToTable();
        if (FitEngine._chartInstance) {
          FitEngine._chartInstance.destroy();
          FitEngine._chartInstance = null;
        }
        document.getElementById('fitParamsPanel').innerHTML =
          '<p style="color: var(--muted); text-align: center; margin-top: 24px;">执行拟合后将在此显示参数和结论。</p>';
      });

      /* --- 粘贴数据解析 --- */
      document.getElementById('btnParsePaste').addEventListener('click', () => {
        const text = document.getElementById('pasteDataArea').value;
        if (!text.trim()) {
          alert('请先粘贴数据。');
          return;
        }
        const data = DataManager.parseFromText(text);
        if (data.x.length === 0) {
          alert('未能解析到有效数据。请确保每行格式为：x y 或 x y w（用空格或逗号分隔）。');
          return;
        }
        DataManager.syncToTable();
        // 自动切换到表格模式
        document.querySelector('.mode-btn[data-mode="table"]').click();
        const toast = document.getElementById('loadingToast');
        document.getElementById('loadingText').textContent = `✅ 已解析 ${data.x.length} 个数据点`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      });

      /* --- 示例数据集 --- */
      const demoDatasets = {
        linear: {
          generate: () => {
            const x = [], y = [];
            for (let i = 0; i < 10; i++) {
              x.push(i);
              y.push(2.5 * i + 1.8 + (Math.random() - 0.5) * 2);
            }
            return { x, y };
          },
          fitType: 'linear'
        },
        exponential: {
          generate: () => {
            const x = [], y = [];
            for (let i = 0; i < 10; i++) {
              x.push(i);
              y.push(1.2 * Math.exp(0.3 * i) + (Math.random() - 0.5) * 1.5);
            }
            return { x, y };
          },
          fitType: 'exponential'
        },
        polynomial: {
          generate: () => {
            const x = [], y = [];
            for (let i = 0; i < 10; i++) {
              x.push(i);
              y.push(0.8 * i * i - 1.5 * i + 3.0 + (Math.random() - 0.5) * 3);
            }
            return { x, y };
          },
          fitType: 'polynomial2'
        },
        sigmoid: {
          generate: () => {
            const x = [], y = [];
            for (let i = 0; i < 12; i++) {
              x.push(i);
              y.push(10 / (1 + Math.exp(-0.5 * (i - 5))) + (Math.random() - 0.5) * 0.8);
            }
            return { x, y };
          },
          fitType: 'polynomial2'
        }
      };

      document.querySelectorAll('.demo-data-list li button').forEach(btn => {
        btn.addEventListener('click', function () {
          const demoKey = this.dataset.demo;
          const demo = demoDatasets[demoKey];
          if (!demo) return;
          const data = demo.generate();
          DataManager.setData(data.x, data.y);
          DataManager.syncToTable();
          if (demo.fitType) {
            document.getElementById('fitType').value = demo.fitType;
          }
          // 切换到表格模式
          document.querySelector('.mode-btn[data-mode="table"]').classList.add('active');
          document.querySelectorAll('.mode-btn').forEach(b => {
            if (b.dataset.mode !== 'table') b.classList.remove('active');
          });
          document.querySelectorAll('.data-mode-content').forEach(c => c.classList.remove('active'));
          document.getElementById('mode-table').classList.add('active');
        });
      });

      /* --- 执行拟合 --- */
      document.getElementById('btnRunFit').addEventListener('click', () => {
        // 先从表格读取数据
        DataManager.readFromTable();
        const validation = DataManager.validate();
        if (!validation.valid) {
          alert(validation.message);
          return;
        }
        FitEngine.run();
      });

      /* --- 执行统计分析 --- */
      document.getElementById('btnRunStats').addEventListener('click', () => {
        DataManager.readFromTable();
        const validation = DataManager.validate();
        if (!validation.valid) {
          alert(validation.message);
          return;
        }
        const data = DataManager.getData();
        const statsX = MathEngine.describe(data.x);
        const statsY = MathEngine.describe(data.y);
        const outliersY = MathEngine.detectOutliers(data.y);

        if (!statsX || !statsY) return;

        const panel = document.getElementById('statsResultPanel');
        panel.innerHTML = `
          <h3 style="margin-top:0;">X (自变量) 统计</h3>
          <table>
            <tr><th>统计量</th><th>值</th></tr>
            <tr><td>样本数 (n)</td><td>${statsX.n}</td></tr>
            <tr><td>均值</td><td>${statsX.mean.toFixed(4)}</td></tr>
            <tr><td>标准差 (σ)</td><td>${statsX.std.toFixed(4)}</td></tr>
            <tr><td>方差</td><td>${statsX.variance.toFixed(4)}</td></tr>
            <tr><td>最小值</td><td>${statsX.min.toFixed(4)}</td></tr>
            <tr><td>最大值</td><td>${statsX.max.toFixed(4)}</td></tr>
            <tr><td>中位数</td><td>${statsX.median.toFixed(4)}</td></tr>
            <tr><td>Q1</td><td>${statsX.q1.toFixed(4)}</td></tr>
            <tr><td>Q3</td><td>${statsX.q3.toFixed(4)}</td></tr>
            <tr><td>IQR</td><td>${statsX.iqr.toFixed(4)}</td></tr>
          </table>
          <h3 style="margin-top:16px;">Y (因变量) 统计</h3>
          <table>
            <tr><th>统计量</th><th>值</th></tr>
            <tr><td>样本数 (n)</td><td>${statsY.n}</td></tr>
            <tr><td>均值</td><td>${statsY.mean.toFixed(4)}</td></tr>
            <tr><td>标准差 (σ)</td><td>${statsY.std.toFixed(4)}</td></tr>
            <tr><td>方差</td><td>${statsY.variance.toFixed(4)}</td></tr>
            <tr><td>最小值</td><td>${statsY.min.toFixed(4)}</td></tr>
            <tr><td>最大值</td><td>${statsY.max.toFixed(4)}</td></tr>
            <tr><td>中位数</td><td>${statsY.median.toFixed(4)}</td></tr>
            <tr><td>Q1</td><td>${statsY.q1.toFixed(4)}</td></tr>
            <tr><td>Q3</td><td>${statsY.q3.toFixed(4)}</td></tr>
            <tr><td>IQR</td><td>${statsY.iqr.toFixed(4)}</td></tr>
          </table>
          ${outliersY.outliers.length > 0 ? `<p style="color:var(--red);margin-top:12px;">⚠️ 检测到 ${outliersY.outliers.length} 个 Y 异常值: ` + outliersY.outliers.map(o => `第${o.index + 1}个 (${o.value.toFixed(3)})`).join(', ') + '</p>' : ''}
        `;
      });

      /* --- 聊天发送 --- */
      function sendChat() {
        const input = document.getElementById('chatInput');
        const msg = input.value.trim();
        if (!msg) return;
        input.value = '';
        AIChatEngine.sendMessage(msg);
      }

      document.getElementById('btnSendChat').addEventListener('click', sendChat);
      document.getElementById('chatInput').addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendChat();
        }
      });

      /* --- 生成实验记录 --- */
      document.getElementById('btnGenerateRecord').addEventListener('click', async () => {
        const desc = document.getElementById('recordDescription').value;
        const context = document.getElementById('recordContext').value;
        const resultDiv = document.getElementById('recordResult');
        const btn = document.getElementById('btnGenerateRecord');

        btn.disabled = true;
        btn.textContent = '⏳ 生成中...';
        resultDiv.textContent = '';

        try {
          const record = await AIChatEngine.generateRecord(desc, context);
          resultDiv.textContent = record;
        } catch (err) {
          resultDiv.textContent = '❌ 生成失败：' + err.message;
        } finally {
          btn.disabled = false;
          btn.textContent = '✨ 生成实验记录';
        }
      });

      /* --- 清空记录 --- */
      document.getElementById('btnClearRecord').addEventListener('click', () => {
        document.getElementById('recordDescription').value = '';
        document.getElementById('recordContext').value = '';
        document.getElementById('recordResult').textContent = '';
      });

      /* --- 导出报告 --- */
      // 在页面底部新增一个全局导出按钮（如果有的话），这里提供一个函数
      window.exportReport = function () {
        DataManager.readFromTable();
        const data = DataManager.getData();
        if (data.x.length === 0) {
          alert('没有数据可导出。');
          return;
        }

        let report = 'BioNote 实验数据分析报告\n';
        report += '========================\n';
        report += `导出时间: ${new Date().toLocaleString()}\n\n`;
        report += '原始数据:\n';
        report += '序号\tX\tY\n';
        for (let i = 0; i < data.x.length; i++) {
          report += `${i + 1}\t${data.x[i]}\t${data.y[i]}\n`;
        }

        // 附加拟合结果
        const paramsPanel = document.getElementById('fitParamsPanel');
        if (paramsPanel) {
          report += '\n拟合结果:\n';
          report += paramsPanel.textContent.replace(/\s+/g, ' ').trim() + '\n';
        }

        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `BioNote_Report_${new Date().toISOString().slice(0, 10)}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }


    /* ---------- 6.6 DOMContentLoaded 启动 ---------- */
    document.addEventListener('DOMContentLoaded', () => {
      // 初始化数据表格
      DataManager.syncToTable();

      // 初始化 AI 配置
      AIChatEngine.init();

      // 初始化所有 UI 交互
      initAIUI();

      console.log('BioNote AI 助手初始化完成');
      console.log('  - MathEngine: ', Object.keys(MathEngine));
      console.log('  - DataManager: ', Object.keys(DataManager));
      console.log('  - FitEngine: ', Object.keys(FitEngine));
      console.log('  - AIChatEngine: ', Object.keys(AIChatEngine));
    });

    /* ========== 保留原有页面切换逻辑（合并自原文件 L2031~L2062） ========== */
    const pages = document.querySelectorAll(".page");
    const navButtons = document.querySelectorAll(".nav-button");
    const jumpButtons = document.querySelectorAll("[data-page-jump]");
    const toast = document.getElementById("toast");

    function showPage(pageId) {
      pages.forEach((page) => page.classList.toggle("active", page.id === pageId));
      navButtons.forEach((button) => button.classList.toggle("active", button.dataset.page === pageId));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    navButtons.forEach((button) => {
      button.addEventListener("click", () => showPage(button.dataset.page));
    });

    jumpButtons.forEach((button) => {
      button.addEventListener("click", () => showPage(button.dataset.pageJump));
    });

    document.getElementById("quickCreate").addEventListener("click", () => {
      toast.classList.add("show");
      window.clearTimeout(window.toastTimer);
      window.toastTimer = window.setTimeout(() => toast.classList.remove("show"), 2600);
    });

    document.getElementById("topSearch").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        showPage("search");
      }
    });
```

### 6.7 保留原有功能

以上代码末尾完整保留了原文件 L2031 ~ L2062 的页面切换逻辑（`showPage`、导航按钮事件、`quickCreate` toast、`topSearch` 搜索跳转），确保原有非 AI 功能不受影响。同时在 `DOMContentLoaded` 事件中新增了 AI 模块初始化逻辑。

---

## 7. API 对接方案

### 7.1 三种 API 后端格式

代码通过 `_config.provider` 自动切换对应的 API 端点和模型，用户也可选择"自定义"模式手动填写兼容 OpenAI 格式的端点。

#### OpenAI

```
端点:  https://api.openai.com/v1/chat/completions
方法:  POST
请求头:
  Content-Type: application/json
  Authorization: Bearer {apiKey}
请求体:
{
  "model": "gpt-4o-mini",
  "messages": [
    { "role": "system", "content": "系统提示词" },
    { "role": "user", "content": "用户消息" }
  ],
  "temperature": 0.7,
  "max_tokens": 2048
}

响应格式:
{
  "choices": [
    { "message": { "role": "assistant", "content": "回复内容" } }
  ]
}
```

#### DeepSeek

```
端点:  https://api.deepseek.com/v1/chat/completions
方法:  POST
请求头: 同 OpenAI 格式
请求体: 同 OpenAI 格式，model 为 "deepseek-chat"
响应格式: 同 OpenAI 格式
```

#### 自定义（兼容 OpenAI 格式）

通过用户自行填写的端点 URL 和模型名称进行调用，请求/响应格式与 OpenAI 完全一致。适用于通义千问（DashScope）、本地部署的 vLLM/Ollama 等兼容服务。

### 7.2 系统提示词（System Prompt）

#### 实验问答提示词

```
你是 BioNote 生物实验记录助手的 AI 助手。你帮助用户进行生物实验设计、数据分析、试剂选择等。你的回答要专业、准确，使用中文，并在不确定时明确指出。如果用户提供了实验数据或拟合结果，请结合这些信息给出分析建议。
```

#### 实验记录生成提示词

```
你是 BioNote 生物实验记录助手的 AI 助手。
请根据用户的自然语言描述，生成一份结构化的实验记录。输出格式如下：

【实验名称】
【实验日期】今天
【实验目的】
【实验材料】
【实验步骤】
【实验结果】
【结论与讨论】

请确保：
1. 从描述中提取所有关键信息
2. 补充合理的实验细节
3. 使用专业术语
4. 标注不确定的信息为"[待确认]"
```

### 7.3 上下文注入策略

当用户在"曲线拟合"面板执行拟合分析后，结果会自动填充到"实验记录"面板的 `#recordContext` 文本框中。在调用 `sendMessage`（问答）和 `generateRecord`（生成记录）时，会自动将上下文以 system 消息的形式注入：

```javascript
// 自动附加当前拟合分析结果作为上下文
const contextArea = document.getElementById('recordContext');
if (contextArea && contextArea.value.trim()) {
  messages.splice(1, 0, {
    role: 'system',
    content: '以下是用户最近执行的拟合分析结果，请结合这些数据回答问题：\n' + contextArea.value
  });
}
```

上下文内容包括：拟合类型、方程、R²、数据点数、X/Y 均值等关键信息。

### 7.4 错误处理与降级方案

| 错误场景 | 处理方式 |
|----------|----------|
| 未配置 API Key | 聊天：提示用户配置；生成记录：降级为本地演示模式 |
| 网络错误 | 捕获 fetch 异常，显示详细错误信息 |
| HTTP 错误 (4xx/5xx) | 解析响应体，提取 `error.message` 展示给用户 |
| API 返回格式异常 | try-catch 包裹 JSON 解析，展示截断的原始响应 |
| 无 API 时的生成记录 | 调用 `_demoGenerateRecord()` 返回预置的演示文本 |

### 7.5 无 API 时的本地演示模式

`AIChatEngine._demoGenerateRecord()` 提供一个基于固定模板的本地演示输出，使用户在未配置 API Key 时也能体验实验记录生成功能。生成内容中所有不确定信息均标注为 `[待确认]`，并在末尾提示这是演示模式。

---

## 8. 部署与测试

### 8.1 文件结构

```
SE26Project-14/
├── bionote-static-legacy.html    ← 单文件，包含所有 HTML/CSS/JS
├── AI助手实现指南-数学分析与回归拟合.md  ← 本文档
├── sample.pdf
├── ...
```

**所有依赖通过 CDN 引入，无需 npm 安装、无需构建工具。** 直接用浏览器打开 `bionote-static-legacy.html` 即可运行。

### 8.2 测试检查清单

| 编号 | 测试项 | 步骤 | 预期结果 |
|------|--------|------|----------|
| 1 | 页面切换 | 点击侧边栏导航按钮切换页面 | 各页面正常显示/隐藏，AI 助手页面三栏布局正常 |
| 2 | 数据输入-手动 | 在表格中输入 X/Y 数据 | 数据正确保存，删除行正常工作 |
| 3 | 数据输入-粘贴 | 粘贴多行 `x y` 数据并点击解析 | 数据正确填充到表格中 |
| 4 | 数据输入-示例 | 点击线性/指数/多项式/S型示例 | 数据加载并自动切换到对应拟合类型 |
| 5 | 线性拟合 | 加载线性示例数据 → 选择线性拟合 → 执行 | 散点图+拟合直线正确渲染，方程 R² 接近 1.0 |
| 6 | 多项式拟合 | 加载多项式示例数据 → 选择二次多项式 → 执行 | 拟合曲线正确，三次项参数可用 |
| 7 | 指数拟合 | 加载指数示例数据 → 选择指数拟合 → 执行 | 曲线正确，无"Y≤0"错误 |
| 8 | 图表渲染 | 执行任意拟合 | Chart.js 散点图显示数据点（蓝色）和拟合曲线（红色） |
| 9 | 拟合参数 | 执行拟合后查看右侧面板 | R² 带颜色评级，参数值完整显示，方程正确 |
| 10 | 统计分析 | 加载数据 → 切换到统计分析 → 执行 | X/Y 的描述性统计表格完整显示 |
| 11 | 聊天功能 | 配置 API Key → 进入实验问答 → 发送消息 | 消息正常发送和接收，显示头像和气泡 |
| 12 | 聊天无 API | 不配置 API Key → 发送消息 | 提示用户先配置 API Key |
| 13 | 生成实验记录 | 配置 API Key → 输入描述 → 生成 | 返回结构化实验记录 |
| 14 | 生成记录无 API | 不配置 API Key → 输入描述 → 生成 | 返回本地演示模板，含 `[待确认]` 标注 |
| 15 | API 配置持久化 | 配置并保存 → 刷新页面 | 配置从 SessionStorage 恢复，仍保持正确 |
| 16 | 导出报告 | 加载数据 → 调用 `window.exportReport()` | 下载 .txt 文件，内容包含数据和拟合结果 |
| 17 | 响应式布局 | 调整浏览器窗口至 780px 以下 | 三栏变为单栏，所有元素可正常操作 |
| 18 | 加权拟合 | 在权重列输入数值 → 勾选"使用权重" → 执行 | 结果标注"已启用"，R² 按加权计算 |

### 8.3 调试技巧

| 技巧 | 说明 |
|------|------|
| 控制台日志 | 页面加载后，Console 中会输出各模块的初始化状态和暴露的 API 列表 |
| Network 面板 | 检查 LLM API 请求的 Request/Response Headers 和 Body，确认 API Key 和端点正确 |
| API Key 验证 | 在 Console 中输入 `sessionStorage.getItem('bionote_ai_config')` 查看当前存储的配置 |
| 数学计算验证 | 在 Console 中直接调用 `MathEngine.linearRegression([1,2,3], [2,4,6])` 验证回归结果 |
| 图表问题 | `FitEngine._chartInstance` 可访问当前 Chart.js 实例，用于调试图表配置 |

### 8.4 安全注意事项

| 关注点 | 措施 |
|--------|------|
| API Key 存储 | 仅存储在 `sessionStorage`，关闭浏览器标签页后自动清除。不写入 `localStorage`，不存储在 Cookie 中 |
| CORS 配置 | 浏览器端直接调用 LLM API 需要服务商支持 CORS（OpenAI、DeepSeek 均支持）。如使用自定义代理，需在服务端配置 `Access-Control-Allow-Origin` |
| 不在客户端硬编码密钥 | 代码中不包含任何默认的 API Key 值，`apiKey` 输入框的 placeholder 仅为 `sk-...` 的格式提示 |
| HTTPS | 所有 API 调用均使用 HTTPS 端点 |

### 8.5 性能优化建议

| 优化项 | 具体措施 |
|--------|----------|
| 图表实例复用 | `FitEngine.renderChart()` 在每次重绘前调用 `_chartInstance.destroy()` 销毁旧实例，避免 Canvas 内存泄漏 |
| 防抖拟合按钮 | （建议）在大数据集场景下，对 `btnRunFit` 的点击事件添加 300ms 防抖，防止用户重复点击 |
| 虚拟滚动 | 当数据点超过 1000 个时（罕见场景），可考虑对表格使用虚拟滚动。本方案中 `data-table-wrapper` 已设置 `max-height: 260px; overflow-y: auto`，可应对中等规模数据 |
| 拟合曲线密度 | `renderChart` 中拟合曲线的采样点为 200 个（`step = (maxX - minX) / 200`），在精度和渲染性能之间取得平衡 |
| CDN 缓存 | simple-statistics 和 Chart.js 使用 jsdelivr CDN，浏览器会缓存这些资源，减少后续加载时间 |

---

> **文档版本**：v1.0
> **最后更新**：2026-07-09
> **适用文件**：`bionote-static-legacy.html`