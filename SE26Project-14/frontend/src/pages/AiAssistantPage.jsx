/**
 * AI 助手 AiAssistant（重设计为聊天界面）
 * 左侧功能选择 + 中央对话区 + 右侧结构化结果面板。
 * 注意：本阶段不接入真实 LLM，「发送」调用 mock 的 runAiAssist。
 */
import { useRef, useState } from 'react'
import {
  Sparkles,
  ListChecks,
  FileText,
  CircleCheck,
  SearchCheck,
  Send,
  Bot,
} from 'lucide-react'
import { Button, Surface, EmptyState } from '@/components/ui'
import { AI_FEATURE_LABELS } from '@/domain'
import { runAiAssist } from '@/api'
import { mockProjects } from '@/mocks/data'

const FEATURE_ICONS = {
  generate: Sparkles,
  organize: ListChecks,
  summarize: FileText,
  check: CircleCheck,
  analyze: SearchCheck,
}

const FEATURES = Object.entries(AI_FEATURE_LABELS)

const SAMPLE_INPUT =
  '今天做了 PCR，用 Sample-001 做模板，引物是 GFP-F/GFP-R，退火温度 58℃，循环 35 次，跑胶后有一条 750 bp 的条带。'

const WELCOME = {
  id: 'welcome',
  role: 'ai',
  text: '你好，我是 BioNote AI 助手。用自然语言描述你的实验过程，我会帮你生成结构化的实验记录、检查完整性并给出改进建议。',
}

function LegacyAiAssistantPage() {
  const [feature, setFeature] = useState('generate')
  const [text, setText] = useState(SAMPLE_INPUT)
  const [messages, setMessages] = useState([WELCOME])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const idRef = useRef(0)

  const onSend = async () => {
    const content = text.trim()
    if (!content || loading) return
    const userMsg = { id: `u-${idRef.current++}`, role: 'user', text: content }
    setMessages((list) => [...list, userMsg])
    setText('')
    setLoading(true)
    try {
      const res = await runAiAssist(feature, content)
      setResult(res)
      setMessages((list) => [
        ...list,
        {
          id: `a-${idRef.current++}`,
          role: 'ai',
          text: `已完成「${AI_FEATURE_LABELS[feature]}」，共解析出 ${res.structuredFields.length} 个字段，完整性评分 ${res.completenessScore}/100。${res.suggestion}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-5">
      {/* 头部 */}
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">
          AI 助手
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">自然语言转实验记录</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          轻量辅助录入、完整性检查和实验摘要，不替代核心记录流程。
        </p>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[230px,minmax(0,1fr),310px]">
        {/* 功能选择 */}
        <div className="space-y-5 max-xl:col-span-full">
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
              功能选择
            </p>
            <div className="space-y-1">
              {FEATURES.map(([key, label]) => {
                const Icon = FEATURE_ICONS[key] ?? Sparkles
                const active = key === feature
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFeature(key)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      active
                        ? 'bg-brand-50 font-medium text-brand-700'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon size={16} className={active ? 'text-brand-600' : 'text-slate-400'} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label className="field-label px-1">关联项目</label>
            <select className="input h-10 cursor-pointer">
              {mockProjects.map((p) => (
                <option key={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 对话区 */}
        <div className="flex min-h-[560px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
          {/* 消息列表 */}
          <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50/60 p-5">
            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md bg-brand-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 text-white">
                    <Bot size={15} />
                  </div>
                  <div className="max-w-[80%] rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-slate-700 shadow-card">
                    {msg.text}
                  </div>
                </div>
              ),
            )}

            {/* 打字指示器 */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-indigo-600 text-white">
                  <Bot size={15} />
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3.5 shadow-card">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 输入停靠栏 */}
          <div className="border-t border-slate-200 bg-white p-4">
            <div className="flex items-end gap-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                placeholder="用自然语言描述你的实验过程，例如：今天做了 PCR，模板是 Sample-001……"
                aria-label="自然语言实验描述"
                className="input max-h-40 flex-1 resize-none leading-relaxed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSend()
                }}
              />
              <Button
                icon={Send}
                loading={loading}
                onClick={onSend}
                className="h-11 shrink-0 px-5"
              >
                发送
              </Button>
            </div>
            <p className="mt-2 text-xs text-slate-400">
              当前功能：{AI_FEATURE_LABELS[feature]} · Ctrl + Enter 快捷发送
            </p>
          </div>
        </div>

        {/* 结构化结果 */}
        <Surface title="结构化结果" className="xl:sticky xl:top-24">
          {result ? (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                {result.structuredFields.map((f) => (
                  <div
                    key={f.label}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5"
                  >
                    <span className="text-xs text-slate-500">{f.label}</span>
                    <span className="text-right text-sm font-semibold text-slate-900">
                      {f.value}
                    </span>
                  </div>
                ))}
              </div>

              {result.completenessScore != null && (
                <div className="rounded-xl bg-slate-50 p-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs font-medium text-slate-500">完整性评分</span>
                    <span className="text-2xl font-bold tracking-tight text-slate-900">
                      {result.completenessScore}
                      <span className="text-sm font-medium text-slate-400">/100</span>
                    </span>
                  </div>
                  <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                      style={{ width: `${result.completenessScore}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">{result.suggestion}</p>
                </div>
              )}

              <Button variant="secondary" className="w-full">
                插入当前记录
              </Button>
            </div>
          ) : (
            <EmptyState
              icon={Sparkles}
              title="等待生成"
              description="在对话框中描述实验过程并发送，这里会展示 AI 解析出的结构化字段。"
            />
          )}
        </Surface>
      </div>
    </section>
  )
}

export default function AiAssistantPage() {
  return (
    <section>
      <div className="mx-auto max-w-4xl py-8 sm:py-16">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
          <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50 via-white to-indigo-50 px-6 py-12 text-center sm:px-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-pop"><Sparkles size={25} /></div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">AI 助手</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">智能实验辅助功能正在规划中</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">未来将提供实验记录结构化整理、完整性检查与摘要建议。当前版本优先完成项目、记录、审核、搜索和导出闭环。</p>
          </div>
          <div className="grid gap-px bg-slate-200 sm:grid-cols-3">
            {[
              ['记录整理', '将自然语言笔记整理为规范字段'],
              ['完整性检查', '提示缺失的关键步骤、结果与附件'],
              ['实验摘要', '为已完成记录生成简明内容摘要'],
            ].map(([title, description]) => <div key={title} className="bg-white px-6 py-6 text-center"><h2 className="text-sm font-semibold text-slate-900">{title}</h2><p className="mt-1.5 text-xs leading-6 text-slate-500">{description}</p></div>)}
          </div>
        </div>
      </div>
    </section>
  )
}
