/**
 * AI 助手 AiAssistant
 * 次级增强能力：自然语言转结构化实验记录、完整性检查等。
 * 结果仅为辅助建议，需人工核对后写入记录；本阶段调用 mock 的 runAiAssist。
 */
import { useState } from 'react'
import { Sparkles, Send, ClipboardList } from 'lucide-react'
import { PageHeader, Surface, Badge, EmptyState, Icon, useToast } from '@/components/ui'
import { AI_FEATURE_LABELS } from '@/domain'
import { runAiAssist } from '@/api'
import { useAppStore } from '@/store/appStore'
import './editor.css'

const FEATURES = Object.entries(AI_FEATURE_LABELS)

const SAMPLE_INPUT =
  '今天做了 PCR，用 Sample-001 做模板，引物是 GFP-F/GFP-R，退火温度 58℃，循环 35 次，跑胶后有一条 750 bp 的条带。'

export default function AiAssistantPage() {
  const toast = useToast()
  const projects = useAppStore((s) => s.projects)
  const currentProjectId = useAppStore((s) => s.currentProjectId)

  const [feature, setFeature] = useState('generate')
  const [text, setText] = useState(SAMPLE_INPUT)
  const [projectId, setProjectId] = useState(currentProjectId)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const onGenerate = async () => {
    if (!text.trim()) return
    setLoading(true)
    try {
      const res = await runAiAssist(feature, text, projectId)
      setResult(res)
    } catch {
      toast('AI 处理失败，请重试', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="AI 助手"
        title="AI 助手"
        description="把口头描述整理成结构化实验记录草稿。AI 结果仅为辅助建议，请核对后再写入正式记录。"
      />

      <div className="ai-shell">
        <Surface title="输入实验描述">
          <div className="field" style={{ marginBottom: 12 }}>
            <label>功能</label>
            <div className="ai-feature-list" role="group" aria-label="AI 功能选择">
              {FEATURES.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`ai-feature-btn ${key === feature ? 'active' : ''}`.trim()}
                  onClick={() => setFeature(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="ai-text">自然语言记录</label>
            <textarea
              id="ai-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              style={{ minHeight: 140 }}
            />
          </div>

          <div className="field" style={{ marginBottom: 14 }}>
            <label htmlFor="ai-project">关联项目</label>
            <select
              id="ai-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="card-actions">
            <button
              className="primary-btn"
              onClick={onGenerate}
              disabled={loading || !text.trim()}
            >
              {loading ? <span className="spinner on-light" /> : <Icon name={Send} size={14} />}
              {loading ? '处理中…' : '生成结构化结果'}
            </button>
            <button
              className="secondary-btn"
              disabled={!result}
              onClick={() => toast('「写入实验记录」为原型占位：请复制结果到记录编辑器')}
            >
              <Icon name={ClipboardList} size={14} />
              写入实验记录
            </button>
          </div>
        </Surface>

        <aside className="stack" style={{ alignContent: 'start' }}>
          <Surface
            title={
              <>
                <Icon name={Sparkles} size={15} style={{ verticalAlign: '-2px' }} /> 结构化结果
              </>
            }
          >
            {result ? (
              <>
                <Badge tone="blue">{AI_FEATURE_LABELS[result.feature]}</Badge>
                <div className="side-list">
                  {result.structuredFields.map((f) => (
                    <div className="side-chip" key={f.label}>
                      <span className="muted">{f.label}</span>
                      <strong>{f.value}</strong>
                    </div>
                  ))}
                </div>
                {result.completenessScore != null && (
                  <>
                    <h2 style={{ marginTop: 16 }}>完整性评分</h2>
                    <div className="continue-progress">
                      <div className="progress" aria-label={`完整性 ${result.completenessScore} 分`}>
                        <span style={{ width: `${result.completenessScore}%` }} />
                      </div>
                      <strong className="nowrap">{result.completenessScore}/100</strong>
                    </div>
                    <p className="muted small" style={{ margin: '8px 0 0' }}>
                      {result.suggestion}
                    </p>
                  </>
                )}
              </>
            ) : (
              <EmptyState
                icon={Sparkles}
                title="尚未生成结果"
                description="填写描述后点击「生成结构化结果」（当前为 mock 结果）。"
              />
            )}
          </Surface>

          <Surface>
            <p className="muted small" style={{ margin: 0 }}>
              提示：AI 助手是辅助录入工具，不能替代实验者的判断。生成的字段、评分和建议
              请在写入记录前逐条核对；涉及数据结论的内容以实际实验为准。
            </p>
          </Surface>
        </aside>
      </div>
    </section>
  )
}
