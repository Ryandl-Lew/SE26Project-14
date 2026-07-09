/**
 * AI 助手 AiAssistant
 * 三栏：功能选择 + 自然语言输入 + 结构化结果 / 完整性评分。
 * 注意：本阶段不接入真实 LLM，「生成」按钮调用 mock 的 runAiAssist。
 */
import { useState } from 'react'
import { PageHeader, Surface } from '@/components/ui'
import { AI_FEATURE_LABELS } from '@/domain'
import { runAiAssist } from '@/api'
import { mockProjects } from '@/mocks/data'
import './editor.css'

const FEATURES = Object.entries(AI_FEATURE_LABELS)

const SAMPLE_INPUT =
  '今天做了 PCR，用 Sample-001 做模板，引物是 GFP-F/GFP-R，退火温度 58℃，循环 35 次，跑胶后有一条 750 bp 的条带。'

export default function AiAssistantPage() {
  const [feature, setFeature] = useState('generate')
  const [text, setText] = useState(SAMPLE_INPUT)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const onGenerate = async () => {
    setLoading(true)
    try {
      const res = await runAiAssist(feature, text)
      setResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="AI 助手"
        title="自然语言转实验记录"
        description="轻量辅助录入、完整性检查和实验摘要，不替代核心记录流程。"
      />

      <div className="editor-shell">
        <aside className="surface">
          <h2>功能选择</h2>
          <div className="outline-list">
            {FEATURES.map(([key, label]) => (
              <button
                key={key}
                className={key === feature ? 'active' : ''}
                onClick={() => setFeature(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="field" style={{ marginTop: 16 }}>
            <label>关联项目</label>
            <select>
              {mockProjects.map((p) => (
                <option key={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </aside>

        <Surface title="输入实验描述">
          <div className="field">
            <label>自然语言记录</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} />
          </div>
          <div className="card-actions" style={{ marginTop: 12 }}>
            <button className="primary-btn" onClick={onGenerate} disabled={loading}>
              {loading ? '生成中…' : '生成结构化结果'}
            </button>
            <button className="secondary-btn">插入当前记录</button>
            <button className="secondary-btn">重新生成</button>
          </div>
        </Surface>

        <aside className="surface">
          <h2>结构化结果</h2>
          {result ? (
            <>
              <div className="side-list">
                {result.structuredFields.map((f) => (
                  <div className="side-chip" key={f.label}>
                    <span>{f.label}</span>
                    <strong>{f.value}</strong>
                  </div>
                ))}
              </div>
              {result.completenessScore != null && (
                <>
                  <h2 style={{ marginTop: 18 }}>完整性评分</h2>
                  <div className="stat-card">
                    <div className="stat-number">{result.completenessScore}/100</div>
                    <p className="stat-note">{result.suggestion}</p>
                  </div>
                </>
              )}
            </>
          ) : (
            <p className="muted small">点击「生成结构化结果」以查看 AI 解析结果（当前为 mock）。</p>
          )}
        </aside>
      </div>
    </section>
  )
}
