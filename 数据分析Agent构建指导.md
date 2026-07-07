# 数据分析 Agent 自主构建指导 —— 生物实验助手

## 1. 概述

本文档给出在 Web 项目中自主构建数据分析 Agent 的完整指导，覆盖架构设计、LLM 对接、Prompt 工程、流式输出、数据处理与前端集成等核心环节。

---

## 2. Agent 整体架构

```
┌────────────────────────────────────────────────────────────┐
│                        前端 (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ 数据选择面板   │  │ 模型选择面板  │  │ 结果展示面板      │  │
│  │ (时间范围/字段)│  │ (预设模型/自定义)│  │ (图表+文字报告)  │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         └─────────────────┼───────────────────┘             │
│                           │ SSE / WebSocket                 │
└───────────────────────────┼────────────────────────────────┘
                            │
┌───────────────────────────┼────────────────────────────────┐
│                    后端 (Express)                            │
│                           ▼                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Agent Service (核心层)                     │  │
│  │  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐ │  │
│  │  │请求构建器│─▶│数据预处理器│─▶│Prompt  │─▶│LLM 客户端│ │  │
│  │  │         │  │          │  │构建器  │  │         │ │  │
│  │  └─────────┘  └──────────┘  └────────┘  └────┬────┘ │  │
│  │                                               │      │  │
│  │  ┌─────────┐  ┌──────────┐  ┌────────┐       │      │  │
│  │  │结果解析器│◀─│响应处理器 │◀─│流式缓冲│◀──────┘      │  │
│  │  └─────────┘  └──────────┘  └────────┘              │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 2.1 核心模块职责

| 模块 | 职责 |
|------|------|
| 请求构建器 | 接收前端参数（项目ID、数据字段、时间范围、模型选择），构造内部请求对象 |
| 数据预处理器 | 从数据库读取原始数据，清洗、标准化、生成统计摘要 |
| Prompt 构建器 | 根据用户选择的数学模型和数据特征，动态生成高质量 Prompt |
| LLM 客户端 | 封装对 OpenAI API / 兼容接口的调用（支持流式和非流式） |
| 流式缓冲 | 接收 LLM 流式响应，解析 SSE chunk，实时推送到前端 |
| 响应处理器 | 超时重试、错误降级、Token 计数 |
| 结果解析器 | 从 LLM 回复中提取结构化结果（模型参数、R²、结论等） |

---

## 3. LLM 对接方案

### 3.1 API 选型

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| OpenAI API (GPT-4o/GPT-4) | 推理能力强，数学分析准确 | 成本较高，需科学上网 | 对分析质量要求高的场景 |
| 国内大模型 API (通义千问/文心/DeepSeek) | 无需科学上网，中文友好 | 数学推理可能弱于 GPT-4 | 成本敏感、国内部署 |
| 本地部署 (Ollama + Qwen/Llama) | 数据不出域，零 API 费用 | 需 GPU 服务器，推理速度受限 | 内网环境、数据安全要求高 |

**推荐策略**：预留多 Provider 切换能力，通过环境变量配置。

### 3.2 LLM 客户端实现（Node.js）

```javascript
// src/services/llm-client.js
const OPENAI_COMPATIBLE_BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o';
const LLM_TIMEOUT_MS = parseInt(process.env.LLM_TIMEOUT || '90000', 10);
const LLM_MAX_RETRIES = parseInt(process.env.LLM_MAX_RETRIES || '2', 10);

async function chatCompletion({ messages, temperature = 0.3, stream = false }) {
    const response = await fetch(`${OPENAI_COMPATIBLE_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LLM_API_KEY}`,
        },
        body: JSON.stringify({
            model: LLM_MODEL,
            messages,
            temperature,
            stream,
            max_tokens: 4096,
        }),
        signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });

    if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`LLM API error ${response.status}: ${errBody}`);
    }

    return response;
}
```

### 3.3 流式输出（SSE 推送）

```javascript
// src/routes/analysis.js
router.post('/api/projects/:id/analyze', async (req, res) => {
    const { dataFields, timeRange, modelType } = req.body;

    // 设置 SSE 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // 禁用 nginx 缓冲

    try {
        // 1. 读取并预处理数据
        const rawData = await fetchExperimentData(req.params.id, dataFields, timeRange);
        const preprocessed = preprocessData(rawData);

        // 2. 构建 Prompt
        const prompt = buildAnalysisPrompt(preprocessed, modelType);

        // 3. 调用 LLM 流式接口
        const llmResponse = await chatCompletion({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: prompt },
            ],
            temperature: 0.3,
            stream: true,
        });

        // 4. 逐块转发流式响应
        const reader = llmResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop(); // 保留未完成的行

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') {
                        res.write(`data: [DONE]\n\n`);
                        break;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        if (content) {
                            res.write(`data: ${JSON.stringify({ content })}\n\n`);
                        }
                    } catch { /* 跳过解析失败的行 */ }
                }
            }
        }

        res.write(`data: [DONE]\n\n`);
        res.end();
    } catch (error) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});
```

---

## 4. Prompt 工程

### 4.1 System Prompt 设计

```
你是一个专业的生物实验数据分析助手。你的核心能力包括：

1. 数据统计：计算均值、标准差、变异系数、置信区间等基础统计量
2. 数学建模：对实验数据进行回归分析，支持以下模型：
   - 线性回归 (y = ax + b)
   - 多项式回归 (y = a₀ + a₁x + a₂x² + ...)
   - 指数模型 (y = a·e^(bx))
   - 对数模型 (y = a·ln(x) + b)
   - Logistic/Sigmoid 生长曲线 (y = L/(1 + e^(-k(x-x₀))))
   - Michaelis-Menten 酶动力学 (v = Vmax·[S]/(Km + [S]))
3. 相关性分析：计算 R²、Pearson/Spearman 相关系数、p-value
4. 结果解读：用中文给出专业、清晰的生物学解释

输出格式要求：
- 用 JSON 返回结构化结果，便于前端解析
- 同时提供 Markdown 格式的文字解读，便于展示
- 所有数值保留 4 位有效数字
```

### 4.2 User Prompt 模板

```
请分析以下生物实验数据：

## 实验信息
- 实验名称：{experimentName}
- 数据字段：{fields}
- 自变量：{independentVar}
- 因变量：{dependentVar}

## 原始数据（JSON）
```json
{dataJSON}
```

## 分析要求
- 数学模型：{modelType}（若为"auto"，请自动选择最优模型）
- 要求输出：模型方程、拟合参数、R²值、残差分析、生物学意义解读

## 输出格式
请严格按以下 JSON 结构返回（不要包含其他内容）：

```json
{{
  "bestModel": "模型名称",
  "equation": "拟合方程（LaTeX格式）",
  "parameters": [
    {{"name": "参数名", "value": 数值, "unit": "单位"}}
  ],
  "rSquared": 数值,
  "adjustedRSquared": 数值,
  "pValue": 数值,
  "fittedData": [
    {{"x": 数值, "y_observed": 数值, "y_predicted": 数值, "residual": 数值}}
  ],
  "summary": "Markdown格式的详细分析报告"
}}
```
```

### 4.3 自动模型选择 Prompt 增强

当用户选择 `auto`（自动推荐）时，在 Prompt 中追加：

```
你首先需要遍历所有候选模型进行拟合，然后按 R² adjusted 从高到低排序，
选择最优模型。如果多个模型 R² 差距 < 0.02，则优先选择形式更简单的模型（奥卡姆剃刀原则）。
```

---

## 5. 数据预处理管道

### 5.1 预处理流程（Node.js）

```javascript
// src/services/data-preprocessor.js

/**
 * 从数据库原始记录中提取并清洗分析用数据
 */
function preprocessData(records, fields) {
    // 1. 提取目标字段
    let data = records.map(r => {
        const row = {};
        for (const f of fields) {
            row[f] = r.dataValues?.[f] ?? r[f] ?? null;
        }
        row.timestamp = r.createdAt || r.timestamp;
        return row;
    });

    // 2. 剔除缺失值
    data = data.filter(row => fields.every(f => row[f] !== null && row[f] !== undefined));

    // 3. 异常值检测（IQR 方法）
    for (const f of fields) {
        const values = data.map(r => Number(r[f])).filter(v => !isNaN(v));
        if (values.length < 4) continue;
        values.sort((a, b) => a - b);
        const q1 = values[Math.floor(values.length * 0.25)];
        const q3 = values[Math.floor(values.length * 0.75)];
        const iqr = q3 - q1;
        const lower = q1 - 1.5 * iqr;
        const upper = q3 + 1.5 * iqr;
        data = data.filter(r => {
            const v = Number(r[f]);
            return !isNaN(v) && v >= lower && v <= upper;
        });
    }

    // 4. 生成统计摘要
    const summary = {};
    for (const f of fields) {
        const values = data.map(r => Number(r[f]));
        summary[f] = {
            count: values.length,
            mean: mean(values),
            std: stddev(values),
            min: Math.min(...values),
            max: Math.max(...values),
        };
    }

    return {
        records: data,
        recordCount: data.length,
        summary,
        outlierRemoved: records.length - data.length,
    };
}

function mean(arr) { return arr.reduce((a, b) => a + b, 0) / arr.length; }
function stddev(arr) {
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}
```

### 5.2 数据量控制

LLM 上下文窗口有限，需控制发送的数据量：

| 数据条数 | 策略 |
|----------|------|
| ≤ 50 条 | 全部发送 |
| 50 - 200 条 | 发送全部 + 统计摘要 |
| > 200 条 | 均匀采样 200 条 + 完整统计摘要 + 告知 Agent 数据总量 |

```javascript
function sampleData(records, maxSamples = 200) {
    if (records.length <= maxSamples) return records;
    const step = records.length / maxSamples;
    const sampled = [];
    for (let i = 0; i < maxSamples; i++) {
        sampled.push(records[Math.floor(i * step)]);
    }
    return sampled;
}
```

---

## 6. 数学模型实现（本地辅助计算）

对于简单模型，可本地计算以减少 API 调用并获得确定性的结果。

### 6.1 最小二乘线性回归

```javascript
// src/services/math/linear-regression.js

/**
 * 最小二乘线性回归 y = a + bx
 * 返回 { a, b, rSquared, fittedValues }
 */
function linearRegression(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((s, xi, i) => s + xi * y[i], 0);
    const sumX2 = x.reduce((s, xi) => s + xi * xi, 0);

    const b = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const a = (sumY - b * sumX) / n;

    // R² 计算
    const yMean = sumY / n;
    const ssRes = y.reduce((s, yi, i) => s + (yi - (a + b * x[i])) ** 2, 0);
    const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
    const rSquared = 1 - ssRes / ssTot;

    const fittedValues = x.map(xi => ({ x: xi, y_predicted: a + b * xi }));

    return { a, b, equation: `y = ${a.toFixed(4)} + ${b.toFixed(4)}x`, rSquared, fittedValues };
}
```

### 6.2 多项式回归（正规方程法）

```javascript
// src/services/math/polynomial-regression.js

/**
 * 多项式拟合 y = a₀ + a₁x + a₂x² + ... + aₖxᵏ
 * @param {number} degree - 多项式次数（建议 1-5）
 */
function polynomialRegression(x, y, degree = 2) {
    const n = x.length;
    // 构建 Vandermonde 矩阵
    const A = Array.from({ length: n }, (_, i) =>
        Array.from({ length: degree + 1 }, (_, j) => Math.pow(x[i], j))
    );

    // 正规方程: (AᵀA)β = Aᵀy
    const AT = transpose(A);
    const ATA = multiply(AT, A);
    const ATy = multiplyVector(AT, y);
    const coeffs = solveLinearSystem(ATA, ATy);

    // 计算拟合值
    const fitted = x.map(xi =>
        coeffs.reduce((sum, c, j) => sum + c * Math.pow(xi, j), 0)
    );

    // R²
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    const ssRes = y.reduce((s, yi, i) => s + (yi - fitted[i]) ** 2, 0);
    const ssTot = y.reduce((s, yi) => s + (yi - yMean) ** 2, 0);
    const rSquared = 1 - ssRes / ssTot;

    return { coefficients: coeffs, rSquared, fitted };
}

// 矩阵工具函数（此处省略完整实现，建议使用 mathjs 或 ml-matrix 库）
```

### 6.3 推荐数学库

| 库 | 用途 | 包大小 |
|----|------|--------|
| `mathjs` | 通用数学计算、矩阵运算 | ~200KB |
| `ml-regression` | 多种回归模型（线性/多项式/指数/幂律） | ~50KB |
| `simple-statistics` | 统计量计算 | ~30KB |
| `regression` | 轻量级回归拟合 | ~10KB |

**建议**：前端使用 `regression`（轻量），后端使用 `mathjs` 或 `ml-regression`（功能全）。

---

## 7. 前端集成

### 7.1 流式响应消费（EventSource / fetch + ReadableStream）

```typescript
// src/hooks/useAnalysisStream.ts
import { useState, useCallback, useRef } from 'react';

interface StreamChunk {
    content?: string;
    error?: string;
}

export function useAnalysisStream() {
    const [output, setOutput] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    const startAnalysis = useCallback(async (
        projectId: string,
        params: { dataFields: string[]; timeRange: [string, string]; modelType: string }
    ) => {
        setOutput('');
        setError(null);
        setIsStreaming(true);

        abortRef.current = new AbortController();

        try {
            const response = await fetch(`/api/projects/${projectId}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params),
                signal: abortRef.current.signal,
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const reader = response.body!.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullContent = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop()!;

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const data = line.slice(6).trim();
                    if (data === '[DONE]') break;

                    try {
                        const parsed: StreamChunk = JSON.parse(data);
                        if (parsed.content) {
                            fullContent += parsed.content;
                            setOutput(fullContent);
                        }
                        if (parsed.error) {
                            setError(parsed.error);
                        }
                    } catch { /* 跳过解析失败 */ }
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                setError(err.message || '分析请求失败');
            }
        } finally {
            setIsStreaming(false);
        }
    }, []);

    const abort = useCallback(() => {
        abortRef.current?.abort();
    }, []);

    return { output, isStreaming, error, startAnalysis, abort };
}
```

### 7.2 结果展示组件结构

```tsx
// 分析结果面板伪代码结构
<AnalysisResultPanel>
    <ModelInfo>           {/* 最优模型名称、方程（LaTeX渲染） */}
    <ParameterTable>      {/* 拟合参数表格 */}
    <MetricsCards>        {/* R²、Adjusted R²、p-value 卡片 */}
    <ComparisonChart>     {/* ECharts: 原始数据散点 + 拟合曲线 */}
    <ResidualPlot>        {/* ECharts: 残差图，检测异方差性 */}
    <SummaryReport>       {/* Markdown 渲染的分析报告 */}
</AnalysisResultPanel>
```

### 7.3 LaTeX 公式渲染

前端使用 `katex` 渲染 Agent 返回的 LaTeX 公式：

```bash
npm install katex
```

```tsx
import katex from 'katex';
import 'katex/dist/katex.min.css';

function LatexRenderer({ equation }: { equation: string }) {
    const html = katex.renderToString(equation, { throwOnError: false });
    return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
```

---

## 8. 错误处理与容错

### 8.1 重试策略

```javascript
// src/services/retry.js
async function withRetry(fn, { maxRetries = 2, baseDelayMs = 1000 } = {}) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            if (attempt === maxRetries) throw error;
            const isRetryable =
                error.message.includes('429') ||  // Rate limit
                error.message.includes('5') ||    // Server error
                error.name === 'TimeoutError';

            if (!isRetryable) throw error;

            const delay = baseDelayMs * Math.pow(2, attempt); // 指数退避
            console.warn(`LLM call retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}
```

### 8.2 Token 超限处理

```javascript
function estimateTokens(text) {
    // 粗略估算：中文 ~1.5 token/字，英文 ~0.25 token/字，数字 ~1 token/数
    const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
    const otherChars = text.length - chineseChars;
    return Math.ceil(chineseChars * 1.5 + otherChars * 0.25);
}

function truncateDataIfNeeded(dataJSON, maxTokens = 6000) {
    let truncated = dataJSON;
    while (estimateTokens(truncated) > maxTokens) {
        const parsed = JSON.parse(truncated);
        if (Array.isArray(parsed)) {
            parsed.splice(Math.floor(parsed.length * 0.8)); // 保留 80%
            truncated = JSON.stringify(parsed);
        } else {
            break;
        }
    }
    return truncated;
}
```

### 8.3 超时与降级

```
LLM 调用超时（默认 90s）
    ├── 自动重试 1 次
    ├── 仍失败 → 降级为本地数学模型计算
    │           → 仅给出统计量 + 线性回归结果，不输出文字解读
    └── 前端展示降级提示："AI 分析超时，已展示本地计算结果"
```

---

## 9. 安全与数据隐私

| 关注点 | 措施 |
|--------|------|
| API Key 保护 | 仅存储在后端环境变量，前端不可见；前端所有 Agent 请求统一走后端转发 |
| 数据脱敏 | 发送给 LLM 的数据仅包含数值和字段名，不包含用户个人信息 |
| 输入校验 | 后端严格校验前端传入的 `dataFields` 是否是项目中已定义的合法条目 |
| 速率限制 | 对分析接口实施频率限制（如每用户每分钟最多 3 次分析请求） |
| 审计日志 | 记录每次 Agent 调用的时间、数据量、耗时、模型、Token 消耗 |
| 隐私提示 | 前端在发送分析前提示用户："分析数据将发送至第三方 AI 服务进行处理" |

---

## 10. 监控与评估

### 10.1 关键指标

| 指标 | 目标值 | 监控方式 |
|------|--------|----------|
| 分析请求成功率 | ≥ 95% | 后端日志 + 告警 |
| P95 分析耗时 | ≤ 60s | 请求耗时统计 |
| Token 消耗/次 | ≤ 8000 | LLM API response.usage |
| 用户满意度 | 待采集 | 分析结果页 "有帮助/无帮助" 反馈按钮 |

### 10.2 分析结果缓存

相同（项目 + 数据字段 + 时间范围 + 模型）的分析请求，可缓存结果避免重复调用：

```javascript
// 简单的内存缓存（生产环境建议 Redis）
const analysisCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 分钟

function getCacheKey(projectId, params) {
    return `analysis:${projectId}:${JSON.stringify(params)}`;
}

function getFromCache(key) {
    const entry = analysisCache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        return entry.result;
    }
    analysisCache.delete(key);
    return null;
}
```

---

## 11. 开发阶段建议

### 第一阶段：基础对接（1-2 天）

- 搭建 LLM 客户端，完成一次非流式调用
- 实现最简单的 Prompt：发送 CSV 数据 + "请分析"
- 验证 API 连通性和返回格式

### 第二阶段：Prompt 优化（1-2 天）

- 设计 System Prompt 和结构化 User Prompt
- 测试不同模型对 JSON 输出的遵循度
- 调优 temperature、max_tokens 参数
- 建立 Prompt 模板库（线性/多项式/指数/对数/酶动力学）

### 第三阶段：流式 + 前端集成（1-2 天）

- 实现 SSE 流式推送
- 前端接收流式响应并实时渲染
- 结果解析 + ECharts 图表绑定
- LaTeX 公式渲染

### 第四阶段：鲁棒性（1 天）

- 超时重试、Token 截断
- 本地数学库降级方案
- 缓存机制
- 错误状态 UI 完善

---

## 12. 参考资源

- [OpenAI API 文档](https://platform.openai.com/docs/api-reference)
- [Server-Sent Events 规范](https://html.spec.whatwg.org/multipage/server-sent-events.html)
- [ECharts 散点图 + 折线图](https://echarts.apache.org/examples/zh/index.html#chart-type-scatter)
- [KaTeX 公式渲染](https://katex.org/docs/api)
- [ml-regression 库](https://github.com/mljs/regression)
- [mathjs 文档](https://mathjs.org/docs/)
